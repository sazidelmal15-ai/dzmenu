/**
 * Supported administrative lifecycle actions for Mission Control.
 */
export type AdminAuditAction =
  | "ACTIVATE_PLAN"
  | "EXTEND_SUBSCRIPTION"
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
  status?: string | null;
  restaurantStatus?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: string | Date | null;
  currentPeriodStart?: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  [key: string]: unknown;
}

/**
 * Structured Admin Audit Log entity (full detail projection).
 */
export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string;
  actorName?: string | null;
  action: AdminAuditAction;
  targetRestaurantId: string | null;
  targetRestaurantName: string;
  targetRestaurantSlug?: string | null;
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
  targetRestaurantId?: string | null;
  targetRestaurantName: string;
  previousState?: AdminAuditStateSnapshot | null;
  newState?: AdminAuditStateSnapshot | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Date range filter presets for Audit Explorer.
 */
export type AuditDateRangePreset = "all" | "today" | "7d" | "30d" | "custom";

/**
 * Options for paginated administrative audit log queries.
 */
export interface AdminAuditListOptions {
  search?: string;
  action?: string;
  restaurant?: string; // target_restaurant_id or name
  actor?: string; // actor_email or actor_id
  dateRange?: AuditDateRangePreset | string;
  from?: string | Date;
  to?: string | Date;
  page?: number | string;
  pageSize?: number | string;
  sortBy?: "time" | "action" | "restaurant" | "actor";
  sortOrder?: "asc" | "desc";
}

/**
 * Lightweight row projection for the Global Audit Table.
 */
export interface AdminAuditListRow {
  id: string;
  actorId: string | null;
  actorEmail: string;
  actorName: string | null;
  action: AdminAuditAction;
  targetRestaurantId: string | null;
  targetRestaurantName: string;
  targetRestaurantSlug: string | null;
  reason: string | null;
  createdAt: Date;
  hasStateChange: boolean;
}

/**
 * Paginated result returned by auditLogQueries.getPaginatedForAdmin.
 */
export interface AdminAuditListResult {
  items: AdminAuditListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Represents a single human-readable field difference between previousState and newState.
 */
export interface AuditDiffItem {
  field: string;
  label: string;
  changeType: "MODIFIED" | "ADDED" | "REMOVED";
  previousValue: unknown;
  newValue: unknown;
  formattedPrevious: string;
  formattedNew: string;
}

/**
 * Summary of structured state differences.
 */
export interface AuditDiffSummary {
  items: AuditDiffItem[];
  hasChanges: boolean;
}

