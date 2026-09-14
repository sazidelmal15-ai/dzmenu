/**
 * Supported administrative lifecycle actions for Mission Control.
 */
export type AdminAuditAction =
  | "ACTIVATE_ANNUAL"
  | "EXTEND_ANNUAL"
  | "GRANT_TRIAL"
  | "SUSPEND_RESTAURANT"
  | "REACTIVATE_RESTAURANT"
  | "CHANGE_PLAN"
  | "MANUAL_OVERRIDE";

/**
 * Snapshot of subscription / tenant state before and after an administrative action.
 */
export interface AdminAuditStateSnapshot {
  status?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  [key: string]: unknown;
}

/**
 * Structured Admin Audit Log entity.
 */
export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: AdminAuditAction;
  targetRestaurantId: string;
  targetRestaurantName: string;
  previousState: AdminAuditStateSnapshot | null;
  newState: AdminAuditStateSnapshot | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Payload to record a new administrative audit log.
 */
export interface CreateAdminAuditLogPayload {
  actorId: string | null;
  actorEmail: string;
  action: AdminAuditAction;
  targetRestaurantId: string;
  targetRestaurantName: string;
  previousState?: AdminAuditStateSnapshot | null;
  newState?: AdminAuditStateSnapshot | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}
