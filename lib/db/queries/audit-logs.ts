import "server-only";
import { getDb } from "../client";
import type { AdminAuditLog, CreateAdminAuditLogPayload } from "@/types/audit";

const AUDIT_LOG_SELECT_COLUMNS = `
  id,
  actor_id AS "actorId",
  actor_email AS "actorEmail",
  action,
  target_restaurant_id AS "targetRestaurantId",
  target_restaurant_name AS "targetRestaurantName",
  previous_state AS "previousState",
  new_state AS "newState",
  reason,
  metadata,
  created_at AS "createdAt"
`;

/**
 * Audit log query helpers for Super Admin Mission Control.
 */
export const auditLogQueries = {
  /**
   * Records an administrative action in the structured audit log.
   */
  async record(payload: CreateAdminAuditLogPayload): Promise<AdminAuditLog> {
    const db = getDb();
    const row = await db.queryOne<AdminAuditLog>(
      `INSERT INTO admin_audit_logs (
         actor_id, actor_email, action,
         target_restaurant_id, target_restaurant_name,
         previous_state, new_state, reason, metadata, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING ${AUDIT_LOG_SELECT_COLUMNS}`,
      [
        payload.actorId,
        payload.actorEmail,
        payload.action,
        payload.targetRestaurantId,
        payload.targetRestaurantName,
        payload.previousState ? JSON.stringify(payload.previousState) : null,
        payload.newState ? JSON.stringify(payload.newState) : null,
        payload.reason || null,
        JSON.stringify(payload.metadata || {}),
      ]
    );

    if (!row) {
      throw new Error("Failed to record admin audit log");
    }

    return row;
  },

  /**
   * Retrieves the most recent platform audit logs with pagination.
   */
  async getAll(limit = 100, offset = 0): Promise<AdminAuditLog[]> {
    const db = getDb();
    return db.query<AdminAuditLog>(
      `SELECT ${AUDIT_LOG_SELECT_COLUMNS}
       FROM admin_audit_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  },

  /**
   * Retrieves audit logs targeting a specific restaurant tenant.
   */
  async getByRestaurantId(restaurantId: string, limit = 50): Promise<AdminAuditLog[]> {
    const db = getDb();
    return db.query<AdminAuditLog>(
      `SELECT ${AUDIT_LOG_SELECT_COLUMNS}
       FROM admin_audit_logs
       WHERE target_restaurant_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [restaurantId, limit]
    );
  },

  /**
   * Returns total count of audit logs.
   */
  async count(): Promise<number> {
    const db = getDb();
    const row = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM admin_audit_logs`
    );
    return row ? parseInt(row.count, 10) : 0;
  },
};
