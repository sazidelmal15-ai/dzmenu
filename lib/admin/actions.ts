"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { requireRole } from "@/lib/permissions/guards";
import { PLATFORM_ADMIN_ROLES } from "@/constants/roles";
import { restaurantQueries, auditLogQueries, type AdminRestaurantDetail } from "@/lib/db/queries";
import type { AdminAuditLog } from "@/types/audit";
import { adminLifecycleService } from "./lifecycle-service";
import type { LifecycleActionResult } from "./lifecycle-service";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

/**
 * Server action to securely retrieve restaurant details and recent activity for the Phase 5 Drawer.
 */
export async function getRestaurantDrawerDataAction(
  restaurantId: string
): Promise<ActionResult<{ restaurant: AdminRestaurantDetail; recentActivity: AdminAuditLog[] }>> {
  try {
    // 1. Enforce platform admin role guard (SUPER_OWNER, SUPPORT_LEAD)
    await requireRole(PLATFORM_ADMIN_ROLES);

    if (!restaurantId || typeof restaurantId !== "string") {
      return { success: false, error: "Valid restaurant ID is required" };
    }

    // 2. Query real restaurant details and recent activity simultaneously
    const [restaurant, recentActivity] = await Promise.all([
      restaurantQueries.getDetailForAdmin(restaurantId),
      auditLogQueries.getByRestaurantId(restaurantId, 10),
    ]);

    if (!restaurant) {
      return { success: false, error: "Restaurant tenant not found" };
    }

    return {
      success: true,
      data: {
        restaurant,
        recentActivity,
      },
    };
  } catch (err: unknown) {
    console.error("getRestaurantDrawerDataAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to load restaurant details") };
  }
}


/**
 * Server action to activate a specific plan with authoritative pricing and flexible duration.
 */
export async function activatePlanAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  try {
    const restaurantId = formData.get("restaurantId") as string;
    const planId = formData.get("planId") as string;
    const durationDaysRaw = formData.get("durationDays") as string;
    const durationDays = durationDaysRaw ? parseInt(durationDaysRaw, 10) : undefined;
    const reason = (formData.get("reason") as string) || undefined;
    const idempotencyKey = (formData.get("idempotencyKey") as string) || undefined;

    if (!restaurantId) {
      return { success: false, error: "Restaurant ID is required" };
    }
    if (!planId) {
      return { success: false, error: "Plan ID is required" };
    }

    const result = await adminLifecycleService.activatePlan(restaurantId, planId, {
      customDurationDays: durationDays,
      reason,
      idempotencyKey,
    });
    revalidatePath(ROUTES.ADMIN);
    return { success: true, data: result };
  } catch (err: unknown) {
    console.error("activatePlanAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to activate plan") };
  }
}

/**
 * Server action to extend a subscription by any duration (+3, +7, +30, +90, +365 days).
 */
export async function extendSubscriptionAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  try {
    const restaurantId = formData.get("restaurantId") as string;
    const durationDaysRaw = formData.get("durationDays") as string;
    const durationDays = durationDaysRaw ? parseInt(durationDaysRaw, 10) : NaN;
    const reason = (formData.get("reason") as string) || undefined;
    const idempotencyKey = (formData.get("idempotencyKey") as string) || undefined;

    if (!restaurantId) {
      return { success: false, error: "Restaurant ID is required" };
    }
    if (isNaN(durationDays) || durationDays <= 0) {
      return { success: false, error: "A valid positive integer duration in days is required" };
    }

    const result = await adminLifecycleService.extendSubscription(restaurantId, durationDays, {
      reason,
      idempotencyKey,
    });
    revalidatePath(ROUTES.ADMIN);
    return { success: true, data: result };
  } catch (err: unknown) {
    console.error("extendSubscriptionAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to extend subscription") };
  }
}

/**
 * Server action to grant a free trial with flexible duration (e.g. 3, 7, 14, 30 days).
 */
export async function grantTrialAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  try {
    const restaurantId = formData.get("restaurantId") as string;
    const trialDaysRaw = formData.get("trialDays") as string;
    const trialDays = trialDaysRaw ? parseInt(trialDaysRaw, 10) : undefined;
    const planId = (formData.get("planId") as string) || undefined;
    const reason = (formData.get("reason") as string) || undefined;
    const idempotencyKey = (formData.get("idempotencyKey") as string) || undefined;

    if (!restaurantId) {
      return { success: false, error: "Restaurant ID is required" };
    }

    const result = await adminLifecycleService.grantTrial(restaurantId, trialDays, {
      planId,
      reason,
      idempotencyKey,
    });
    revalidatePath(ROUTES.ADMIN);
    return { success: true, data: result };
  } catch (err: unknown) {
    console.error("grantTrialAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to grant trial") };
  }
}

/**
 * Server action to suspend a restaurant tenant.
 */
export async function suspendRestaurantAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  try {
    const restaurantId = formData.get("restaurantId") as string;
    const reason = (formData.get("reason") as string) || "";
    const idempotencyKey = (formData.get("idempotencyKey") as string) || undefined;

    if (!restaurantId) {
      return { success: false, error: "Restaurant ID is required" };
    }
    if (!reason || reason.trim().length < 2) {
      return { success: false, error: "Suspension reason is required (minimum 2 characters)" };
    }

    const result = await adminLifecycleService.suspendRestaurant(restaurantId, {
      reason,
      idempotencyKey,
    });
    revalidatePath(ROUTES.ADMIN);
    return { success: true, data: result };
  } catch (err: unknown) {
    console.error("suspendRestaurantAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to suspend restaurant") };
  }
}

/**
 * Server action to reactivate a suspended restaurant tenant.
 */
export async function reactivateRestaurantAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  try {
    const restaurantId = formData.get("restaurantId") as string;
    const reason = (formData.get("reason") as string) || undefined;
    const idempotencyKey = (formData.get("idempotencyKey") as string) || undefined;

    if (!restaurantId) {
      return { success: false, error: "Restaurant ID is required" };
    }

    const result = await adminLifecycleService.reactivateRestaurant(restaurantId, {
      reason,
      idempotencyKey,
    });
    revalidatePath(ROUTES.ADMIN);
    return { success: true, data: result };
  } catch (err: unknown) {
    console.error("reactivateRestaurantAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to reactivate restaurant") };
  }
}

// ==============================================================================
// BACKWARD COMPATIBILITY WRAPPERS
// ==============================================================================

/**
 * Backward compatible wrapper for activateAnnualAction.
 */
export async function activateAnnualAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  formData.set("planId", formData.get("planId") || "STANDARD_ANNUAL");
  if (!formData.get("durationDays")) {
    formData.set("durationDays", "365");
  }
  return activatePlanAction(formData);
}

/**
 * Backward compatible wrapper for extendAnnualAction.
 */
export async function extendAnnualAction(formData: FormData): Promise<ActionResult<LifecycleActionResult>> {
  if (!formData.get("durationDays")) {
    formData.set("durationDays", "365");
  }
  return extendSubscriptionAction(formData);
}
