import "server-only";
import { z } from "zod";
import { requireRole } from "@/lib/permissions/guards";
import { PLATFORM_ADMIN_ROLES } from "@/constants/roles";
import { getPlanDefinition, PLAN_REGISTRY } from "@/constants/subscriptions";
import { restaurantQueries, subscriptionQueries, auditLogQueries } from "@/lib/db/queries";
import { getDb, type DatabaseAdapter } from "@/lib/db/client";
import type { CurrentUser } from "@/types/auth";
import type { Restaurant } from "@/types/restaurant";
import type { Subscription } from "@/types/subscription";
import type { AdminAuditLog, AdminAuditAction } from "@/types/audit";

// ==============================================================================
// STRICT INPUT VALIDATION SCHEMAS
// ==============================================================================

const UuidSchema = z.string().uuid("Invalid restaurant ID format");

const ReasonSchema = z
  .string()
  .trim()
  .max(500, "Reason must not exceed 500 characters")
  .optional();

const RequiredReasonSchema = z
  .string()
  .trim()
  .min(2, "Suspension reason is required (minimum 2 characters)")
  .max(500, "Reason must not exceed 500 characters");

const DurationDaysSchema = z
  .number({
    required_error: "Duration days is required",
    invalid_type_error: "Duration must be a valid integer number of days",
  })
  .int("Duration must be an integer (no fractions allowed)")
  .positive("Duration must be a positive integer greater than 0")
  .max(3650, "Duration cannot exceed 3,650 days (10 years)");

const TrialDaysSchema = z
  .number({
    invalid_type_error: "Trial duration must be a valid integer number of days",
  })
  .int("Trial duration must be an integer")
  .positive("Trial duration must be greater than 0")
  .max(180, "Trial duration cannot exceed 180 days")
  .default(14);

const PlanIdSchema = z
  .string({
    required_error: "Plan ID is required",
    invalid_type_error: "Plan ID must be a valid string",
  })
  .trim()
  .min(1, "Plan ID cannot be empty");

// ==============================================================================
// RESULT TYPES & INTERFACES
// ==============================================================================

export interface LifecycleActionResult {
  success: boolean;
  action: AdminAuditAction;
  restaurant: Restaurant;
  subscription: Subscription;
  auditLog: AdminAuditLog;
}

export interface LifecycleOperationOptions {
  reason?: string;
  actor?: CurrentUser;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

// ==============================================================================
// TRANSACTIONAL EXECUTION & CONCURRENCY CONTROL ENGINE
// ==============================================================================

/**
 * Executes a lifecycle action inside an atomic database transaction with:
 * 1. DB-Level Row Locking (`FOR UPDATE`) to serialize concurrent writes on the same tenant.
 * 2. Persistent Idempotency Check (via `admin_audit_logs.metadata->>'idempotencyKey'`).
 * 3. Atomic multi-table updates (Restaurant + Subscription + Audit Record).
 */
async function executeLifecycleTransaction(
  restaurantId: string,
  idempotencyKey: string | undefined,
  action: AdminAuditAction,
  operation: (tx: DatabaseAdapter, lockedRestaurant: Restaurant) => Promise<LifecycleActionResult>
): Promise<LifecycleActionResult> {
  return getDb().transaction(async (tx) => {
    // 1. Acquire DB-level row lock on the target restaurant
    const lockedRestaurant = await restaurantQueries.lockForUpdate(restaurantId, tx);
    if (!lockedRestaurant) {
      throw new Error(`Restaurant with ID ${restaurantId} not found`);
    }

    // 2. Check DB-persistent idempotency if idempotencyKey is supplied
    if (idempotencyKey) {
      const existingAudit = await auditLogQueries.findRecentByIdempotencyKey(restaurantId, idempotencyKey, tx);
      if (existingAudit) {
        const currentSub = await subscriptionQueries.findByRestaurantId(restaurantId, tx);
        if (currentSub) {
          return {
            success: true,
            action,
            restaurant: lockedRestaurant,
            subscription: currentSub,
            auditLog: existingAudit,
          };
        }
      }
    }

    // 3. Execute atomic business operations
    return operation(tx, lockedRestaurant);
  });
}

// ==============================================================================
// SUPER ADMIN LIFECYCLE SERVICE
// ==============================================================================

export const adminLifecycleService = {
  /**
   * 1. ACTIVATE PLAN (Authoritative Plan Activation with Decoupled Period)
   * Resolves plan from server-authoritative registry, sets authoritative price,
   * calculates duration, updates subscription & restaurant, and records audit record atomically.
   */
  async activatePlan(
    restaurantId: string,
    planId: string,
    options?: LifecycleOperationOptions & { customDurationDays?: number }
  ): Promise<LifecycleActionResult> {
    const validId = UuidSchema.parse(restaurantId);
    const validPlanId = PlanIdSchema.parse(planId);
    const validReason = ReasonSchema.parse(options?.reason);

    // Resolve authoritative plan definition
    const planDef = getPlanDefinition(validPlanId);
    if (!planDef) {
      throw new Error(`Invalid plan identifier "${validPlanId}". Allowed plans: ${Object.keys(PLAN_REGISTRY).join(", ")}`);
    }

    const durationDays = options?.customDurationDays !== undefined
      ? DurationDaysSchema.parse(options.customDurationDays)
      : planDef.defaultDurationDays;

    const actor = options?.actor || (await requireRole(PLATFORM_ADMIN_ROLES));

    return executeLifecycleTransaction(
      validId,
      options?.idempotencyKey,
      "ACTIVATE_PLAN",
      async (tx, lockedRestaurant) => {
        const existingSub = await subscriptionQueries.findByRestaurantId(validId, tx);

        const previousState = {
          restaurantStatus: lockedRestaurant.status,
          subscriptionPlan: existingSub?.plan ?? null,
          subscriptionStatus: existingSub?.status ?? null,
          currentPeriodStart: existingSub?.currentPeriodStart ?? null,
          currentPeriodEnd: existingSub?.currentPeriodEnd ?? null,
        };

        // Activate authoritative plan on database transaction
        const updatedSub = await subscriptionQueries.activatePlan(
          validId,
          planDef.id,
          durationDays,
          planDef.isTrial ?? false,
          tx
        );

        // Ensure restaurant status is ACTIVE
        let updatedRestaurant = lockedRestaurant;
        if (lockedRestaurant.status !== "ACTIVE") {
          updatedRestaurant = await restaurantQueries.updateStatus(validId, "ACTIVE", tx);
        }

        const newState = {
          restaurantStatus: updatedRestaurant.status,
          subscriptionPlan: updatedSub.plan,
          subscriptionStatus: updatedSub.status,
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
        };

        const auditLog = await auditLogQueries.record(
          {
            actorId: actor.id,
            actorEmail: actor.email,
            action: "ACTIVATE_PLAN",
            targetRestaurantId: lockedRestaurant.id,
            targetRestaurantName: lockedRestaurant.name,
            previousState,
            newState,
            reason: validReason || `Activated ${planDef.name} (${durationDays} days) by platform administrator`,
            metadata: {
              actorRole: actor.role,
              planId: planDef.id,
              planName: planDef.name,
              authoritativePrice: planDef.price,
              currency: planDef.currency,
              durationDays,
              idempotencyKey: options?.idempotencyKey,
              ...options?.metadata,
            },
          },
          tx
        );

        return {
          success: true,
          action: "ACTIVATE_PLAN",
          restaurant: updatedRestaurant,
          subscription: updatedSub,
          auditLog,
        };
      }
    );
  },

  /**
   * 2. EXTEND SUBSCRIPTION (Flexible Period Extension)
   * Extends subscription by any validated duration (+3, +7, +30, +90, +365 days).
   * If unexpired and active/trialing: newExpiration = currentExpiration + durationDays.
   * If expired or inactive: newExpiration = NOW + durationDays.
   */
  async extendSubscription(
    restaurantId: string,
    durationDays: number,
    options?: LifecycleOperationOptions
  ): Promise<LifecycleActionResult> {
    const validId = UuidSchema.parse(restaurantId);
    const validDurationDays = DurationDaysSchema.parse(durationDays);
    const validReason = ReasonSchema.parse(options?.reason);
    const actor = options?.actor || (await requireRole(PLATFORM_ADMIN_ROLES));

    return executeLifecycleTransaction(
      validId,
      options?.idempotencyKey,
      "EXTEND_SUBSCRIPTION",
      async (tx, lockedRestaurant) => {
        const existingSub = await subscriptionQueries.findByRestaurantId(validId, tx);

        const previousState = {
          restaurantStatus: lockedRestaurant.status,
          subscriptionPlan: existingSub?.plan ?? null,
          subscriptionStatus: existingSub?.status ?? null,
          currentPeriodStart: existingSub?.currentPeriodStart ?? null,
          currentPeriodEnd: existingSub?.currentPeriodEnd ?? null,
        };

        // Calculate and apply extension inside transaction
        const updatedSub = await subscriptionQueries.extendPeriod(validId, validDurationDays, tx);

        // Ensure restaurant is ACTIVE
        let updatedRestaurant = lockedRestaurant;
        if (lockedRestaurant.status !== "ACTIVE") {
          updatedRestaurant = await restaurantQueries.updateStatus(validId, "ACTIVE", tx);
        }

        const newState = {
          restaurantStatus: updatedRestaurant.status,
          subscriptionPlan: updatedSub.plan,
          subscriptionStatus: updatedSub.status,
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
        };

        const auditLog = await auditLogQueries.record(
          {
            actorId: actor.id,
            actorEmail: actor.email,
            action: "EXTEND_SUBSCRIPTION",
            targetRestaurantId: lockedRestaurant.id,
            targetRestaurantName: lockedRestaurant.name,
            previousState,
            newState,
            reason: validReason || `Subscription extended by +${validDurationDays} days by platform administrator`,
            metadata: {
              actorRole: actor.role,
              durationDays: validDurationDays,
              idempotencyKey: options?.idempotencyKey,
              ...options?.metadata,
            },
          },
          tx
        );

        return {
          success: true,
          action: "EXTEND_SUBSCRIPTION",
          restaurant: updatedRestaurant,
          subscription: updatedSub,
          auditLog,
        };
      }
    );
  },

  /**
   * 3. GRANT TRIAL (Flexible Trial Duration)
   * Grants or extends a trial with arbitrary duration (e.g. 3, 7, 14, 30 days).
   */
  async grantTrial(
    restaurantId: string,
    durationDays?: number,
    options?: LifecycleOperationOptions & { planId?: string }
  ): Promise<LifecycleActionResult> {
    const validId = UuidSchema.parse(restaurantId);
    const validTrialDays = TrialDaysSchema.parse(durationDays ?? 14);
    const validReason = ReasonSchema.parse(options?.reason);
    const planIdentifier = options?.planId || "TRIAL";
    const actor = options?.actor || (await requireRole(PLATFORM_ADMIN_ROLES));

    return executeLifecycleTransaction(
      validId,
      options?.idempotencyKey,
      "GRANT_TRIAL",
      async (tx, lockedRestaurant) => {
        const existingSub = await subscriptionQueries.findByRestaurantId(validId, tx);

        const previousState = {
          restaurantStatus: lockedRestaurant.status,
          subscriptionPlan: existingSub?.plan ?? null,
          subscriptionStatus: existingSub?.status ?? null,
          currentPeriodStart: existingSub?.currentPeriodStart ?? null,
          currentPeriodEnd: existingSub?.currentPeriodEnd ?? null,
        };

        const updatedSub = await subscriptionQueries.grantTrial(validId, validTrialDays, planIdentifier, tx);

        let updatedRestaurant = lockedRestaurant;
        if (lockedRestaurant.status !== "ACTIVE") {
          updatedRestaurant = await restaurantQueries.updateStatus(validId, "ACTIVE", tx);
        }

        const newState = {
          restaurantStatus: updatedRestaurant.status,
          subscriptionPlan: updatedSub.plan,
          subscriptionStatus: updatedSub.status,
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
        };

        const auditLog = await auditLogQueries.record(
          {
            actorId: actor.id,
            actorEmail: actor.email,
            action: "GRANT_TRIAL",
            targetRestaurantId: lockedRestaurant.id,
            targetRestaurantName: lockedRestaurant.name,
            previousState,
            newState,
            reason: validReason || `Granted ${validTrialDays}-day trial period by platform administrator`,
            metadata: {
              actorRole: actor.role,
              durationDays: validTrialDays,
              trialDays: validTrialDays,
              planId: planIdentifier,
              idempotencyKey: options?.idempotencyKey,
              ...options?.metadata,
            },
          },
          tx
        );

        return {
          success: true,
          action: "GRANT_TRIAL",
          restaurant: updatedRestaurant,
          subscription: updatedSub,
          auditLog,
        };
      }
    );
  },

  /**
   * 4. SUSPEND RESTAURANT
   * Immediately suspends tenant and sets subscription status to SUSPENDED.
   * Preserves expiration dates unchanged.
   */
  async suspendRestaurant(
    restaurantId: string,
    options: LifecycleOperationOptions & { reason: string }
  ): Promise<LifecycleActionResult> {
    const validId = UuidSchema.parse(restaurantId);
    const validReason = RequiredReasonSchema.parse(options.reason);
    const actor = options.actor || (await requireRole(PLATFORM_ADMIN_ROLES));

    return executeLifecycleTransaction(
      validId,
      options.idempotencyKey,
      "SUSPEND_RESTAURANT",
      async (tx, lockedRestaurant) => {
        let existingSub = await subscriptionQueries.findByRestaurantId(validId, tx);
        if (!existingSub) {
          existingSub = await subscriptionQueries.create(validId, "STANDARD", "INACTIVE", undefined, tx);
        }

        const previousState = {
          restaurantStatus: lockedRestaurant.status,
          subscriptionPlan: existingSub.plan,
          subscriptionStatus: existingSub.status,
          currentPeriodStart: existingSub.currentPeriodStart,
          currentPeriodEnd: existingSub.currentPeriodEnd,
        };

        // Update restaurant and subscription status to SUSPENDED without modifying period dates
        const updatedRestaurant = await restaurantQueries.updateStatus(validId, "SUSPENDED", tx);
        const updatedSub = await subscriptionQueries.updateStatus(validId, "SUSPENDED", tx);

        const newState = {
          restaurantStatus: updatedRestaurant.status,
          subscriptionPlan: updatedSub.plan,
          subscriptionStatus: updatedSub.status,
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
        };

        const auditLog = await auditLogQueries.record(
          {
            actorId: actor.id,
            actorEmail: actor.email,
            action: "SUSPEND_RESTAURANT",
            targetRestaurantId: lockedRestaurant.id,
            targetRestaurantName: lockedRestaurant.name,
            previousState,
            newState,
            reason: validReason,
            metadata: {
              actorRole: actor.role,
              idempotencyKey: options.idempotencyKey,
              ...options.metadata,
            },
          },
          tx
        );

        return {
          success: true,
          action: "SUSPEND_RESTAURANT",
          restaurant: updatedRestaurant,
          subscription: updatedSub,
          auditLog,
        };
      }
    );
  },

  /**
   * 5. REACTIVATE RESTAURANT
   * Un-suspends a restaurant. If period end is in the future, restores ACTIVE/TRIALING.
   * If expired during suspension, sets subscription status to EXPIRED (no free extension).
   */
  async reactivateRestaurant(
    restaurantId: string,
    options?: LifecycleOperationOptions
  ): Promise<LifecycleActionResult> {
    const validId = UuidSchema.parse(restaurantId);
    const validReason = ReasonSchema.parse(options?.reason);
    const actor = options?.actor || (await requireRole(PLATFORM_ADMIN_ROLES));

    return executeLifecycleTransaction(
      validId,
      options?.idempotencyKey,
      "REACTIVATE_RESTAURANT",
      async (tx, lockedRestaurant) => {
        let existingSub = await subscriptionQueries.findByRestaurantId(validId, tx);
        if (!existingSub) {
          existingSub = await subscriptionQueries.create(validId, "STANDARD", "INACTIVE", undefined, tx);
        }

        const previousState = {
          restaurantStatus: lockedRestaurant.status,
          subscriptionPlan: existingSub.plan,
          subscriptionStatus: existingSub.status,
          currentPeriodStart: existingSub.currentPeriodStart,
          currentPeriodEnd: existingSub.currentPeriodEnd,
        };

        // Compute resumed subscription status accurately without granting free days
        const now = new Date();
        const isPeriodValid = new Date(existingSub.currentPeriodEnd) > now;
        const resumedStatus = isPeriodValid
          ? existingSub.plan.includes("TRIAL")
            ? "TRIALING"
            : "ACTIVE"
          : "EXPIRED";

        const updatedRestaurant = await restaurantQueries.updateStatus(validId, "ACTIVE", tx);
        const updatedSub = await subscriptionQueries.updateStatus(validId, resumedStatus, tx);

        const newState = {
          restaurantStatus: updatedRestaurant.status,
          subscriptionPlan: updatedSub.plan,
          subscriptionStatus: updatedSub.status,
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
        };

        const auditLog = await auditLogQueries.record(
          {
            actorId: actor.id,
            actorEmail: actor.email,
            action: "REACTIVATE_RESTAURANT",
            targetRestaurantId: lockedRestaurant.id,
            targetRestaurantName: lockedRestaurant.name,
            previousState,
            newState,
            reason: validReason || "Restaurant reactivated from suspension by platform administrator",
            metadata: {
              actorRole: actor.role,
              isPeriodValid,
              resumedStatus,
              idempotencyKey: options?.idempotencyKey,
              ...options?.metadata,
            },
          },
          tx
        );

        return {
          success: true,
          action: "REACTIVATE_RESTAURANT",
          restaurant: updatedRestaurant,
          subscription: updatedSub,
          auditLog,
        };
      }
    );
  },

  // ============================================================================
  // BACKWARD-COMPATIBILITY DELEGATING WRAPPERS
  // ============================================================================

  /**
   * Backward-compatible wrapper delegating to activatePlan with STANDARD.
   */
  async activateAnnual(
    restaurantId: string,
    options?: LifecycleOperationOptions & { durationDays?: number }
  ): Promise<LifecycleActionResult> {
    return this.activatePlan(restaurantId, "STANDARD", {
      ...options,
      customDurationDays: options?.durationDays ?? 365,
    });
  },

  /**
   * Backward-compatible wrapper delegating to extendSubscription.
   */
  async extendAnnual(
    restaurantId: string,
    options?: LifecycleOperationOptions & { durationDays?: number }
  ): Promise<LifecycleActionResult> {
    return this.extendSubscription(restaurantId, options?.durationDays ?? 365, options);
  },
};
