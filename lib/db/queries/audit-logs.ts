import "server-only";
import { getDb, type DatabaseAdapter } from "../client";
import type {
  AdminAuditLog,
  CreateAdminAuditLogPayload,
  AdminAuditListOptions,
  AdminAuditListResult,
  AdminAuditListRow,
  AdminAuditAction,
  AdminAuditStateSnapshot,
} from "@/types/audit";

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
  async record(
    payload: CreateAdminAuditLogPayload,
    dbOrTx?: DatabaseAdapter
  ): Promise<AdminAuditLog> {
    const db = dbOrTx || getDb();
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
   * Finds a recent audit log by restaurant and idempotency key (DB-persistent idempotency).
   */
  async findRecentByIdempotencyKey(
    restaurantId: string,
    idempotencyKey: string,
    dbOrTx?: DatabaseAdapter
  ): Promise<AdminAuditLog | null> {
    const db = dbOrTx || getDb();
    return db.queryOne<AdminAuditLog>(
      `SELECT ${AUDIT_LOG_SELECT_COLUMNS}
       FROM admin_audit_logs
       WHERE target_restaurant_id = $1
         AND metadata->>'idempotencyKey' = $2
         AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 1`,
      [restaurantId, idempotencyKey]
    );
  },

  /**
   * Retrieves full audit log detail by primary key UUID (used for inspection drawer).
   */
  async getDetailById(id: string, dbOrTx?: DatabaseAdapter): Promise<AdminAuditLog | null> {
    const db = dbOrTx || getDb();
    const row = await db.queryOne<{
      id: string;
      actorId: string | null;
      actorEmail: string;
      actorName: string | null;
      action: AdminAuditAction;
      targetRestaurantId: string | null;
      targetRestaurantName: string;
      targetRestaurantSlug: string | null;
      previousState: unknown;
      newState: unknown;
      reason: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: string | Date;
    }>(
      `SELECT 
         a.id,
         a.actor_id AS "actorId",
         a.actor_email AS "actorEmail",
         u.full_name AS "actorName",
         a.action,
         a.target_restaurant_id AS "targetRestaurantId",
         a.target_restaurant_name AS "targetRestaurantName",
         r.slug AS "targetRestaurantSlug",
         a.previous_state AS "previousState",
         a.new_state AS "newState",
         a.reason,
         a.metadata,
         a.created_at AS "createdAt"
       FROM admin_audit_logs a
       LEFT JOIN restaurants r ON r.id = a.target_restaurant_id
       LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.id = $1`,
      [id]
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      actorName: row.actorName || null,
      action: row.action,
      targetRestaurantId: row.targetRestaurantId,
      targetRestaurantName: row.targetRestaurantName,
      targetRestaurantSlug: row.targetRestaurantSlug || null,
      previousState: (row.previousState as AdminAuditStateSnapshot) || null,
      newState: (row.newState as AdminAuditStateSnapshot) || null,
      reason: row.reason,
      metadata: row.metadata || {},
      createdAt: new Date(row.createdAt),
    };
  },

  /**
   * High-performance, parameterized paginated query for the Phase 6 Global Audit Table.
   * Uses lightweight projection (omitting full previous_state/new_state/metadata from list),
   * server-side search, multi-field filtering, allowlisted sorting, and COUNT(*) OVER().
   */
  async getPaginatedForAdmin(
    options: AdminAuditListOptions = {},
    dbOrTx?: DatabaseAdapter
  ): Promise<AdminAuditListResult> {
    const db = dbOrTx || getDb();

    // 1. Pagination Sanitization (Strict allowlist & clamping)
    const allowedPageSizes = [10, 25, 50];
    const rawPageSize = Number(options.pageSize) || 25;
    const pageSize = allowedPageSizes.includes(rawPageSize) ? rawPageSize : 25;
    const rawPage = Number(options.page) || 1;
    const page = Math.max(1, Math.floor(rawPage));
    const offset = (page - 1) * pageSize;

    // 2. Query Parameters & WHERE Clauses
    const whereClauses: string[] = ["1=1"];
    const params: unknown[] = [];

    // Search: case-insensitive match across restaurant name, slug, actor email, actor name, action, and reason
    if (options.search && options.search.trim()) {
      const sanitizedSearch = `%${options.search.trim().toLowerCase()}%`;
      params.push(sanitizedSearch);
      const pIdx = params.length;
      whereClauses.push(
        `(LOWER(a.target_restaurant_name) LIKE $${pIdx} OR LOWER(COALESCE(r.slug, '')) LIKE $${pIdx} OR LOWER(a.actor_email) LIKE $${pIdx} OR LOWER(COALESCE(u.full_name, '')) LIKE $${pIdx} OR LOWER(a.action) LIKE $${pIdx} OR LOWER(COALESCE(a.reason, '')) LIKE $${pIdx})`
      );
    }

    // Action Filter: Specific action filter
    if (options.action && options.action.trim().toUpperCase() !== "ALL") {
      const actionNorm = options.action.trim().toUpperCase();
      params.push(actionNorm);
      const pIdx = params.length;
      whereClauses.push(`a.action = $${pIdx}`);
    }

    // Restaurant Filter: Target specific restaurant ID or name
    if (options.restaurant && options.restaurant.trim() && options.restaurant.trim().toUpperCase() !== "ALL") {
      const restFilter = options.restaurant.trim();
      params.push(restFilter);
      const pIdx = params.length;
      whereClauses.push(`(a.target_restaurant_id::text = $${pIdx} OR LOWER(a.target_restaurant_name) = LOWER($${pIdx}) OR LOWER(COALESCE(r.slug, '')) = LOWER($${pIdx}))`);
    }

    // Actor Filter: Target specific actor email, ID, or name
    if (options.actor && options.actor.trim() && options.actor.trim().toUpperCase() !== "ALL") {
      const actorFilter = options.actor.trim().toLowerCase();
      params.push(actorFilter);
      const pIdx = params.length;
      whereClauses.push(`(LOWER(a.actor_email) = $${pIdx} OR a.actor_id::text = $${pIdx} OR LOWER(COALESCE(u.full_name, '')) = $${pIdx})`);
    }

    // Date Filter: Presets or Custom Range
    if (options.dateRange) {
      const range = options.dateRange.toString().toLowerCase();
      if (range === "today") {
        whereClauses.push(`a.created_at >= CURRENT_DATE`);
      } else if (range === "7d") {
        whereClauses.push(`a.created_at >= NOW() - INTERVAL '7 days'`);
      } else if (range === "30d") {
        whereClauses.push(`a.created_at >= NOW() - INTERVAL '30 days'`);
      } else if (range === "custom") {
        if (options.from) {
          const fromDate = new Date(options.from);
          if (!isNaN(fromDate.getTime())) {
            params.push(fromDate.toISOString());
            const pIdx = params.length;
            whereClauses.push(`a.created_at >= $${pIdx}::timestamptz`);
          }
        }
        if (options.to) {
          const toDate = new Date(options.to);
          if (!isNaN(toDate.getTime())) {
            // Include until end of day if only date is passed
            params.push(toDate.toISOString());
            const pIdx = params.length;
            whereClauses.push(`a.created_at <= $${pIdx}::timestamptz`);
          }
        }
      }
    } else if (options.from || options.to) {
      if (options.from) {
        const fromDate = new Date(options.from);
        if (!isNaN(fromDate.getTime())) {
          params.push(fromDate.toISOString());
          const pIdx = params.length;
          whereClauses.push(`a.created_at >= $${pIdx}::timestamptz`);
        }
      }
      if (options.to) {
        const toDate = new Date(options.to);
        if (!isNaN(toDate.getTime())) {
          params.push(toDate.toISOString());
          const pIdx = params.length;
          whereClauses.push(`a.created_at <= $${pIdx}::timestamptz`);
        }
      }
    }

    // 3. Sorting (Strict Server-Side Allowlist)
    let orderExpression = "a.created_at";
    const sortKey = options.sortBy || "time";
    const sortDirection = options.sortOrder?.toLowerCase() === "asc" ? "ASC" : "DESC";

    switch (sortKey) {
      case "action":
        orderExpression = "a.action";
        break;
      case "restaurant":
        orderExpression = "a.target_restaurant_name";
        break;
      case "actor":
        orderExpression = "a.actor_email";
        break;
      case "time":
      default:
        orderExpression = "a.created_at";
        break;
    }

    params.push(pageSize);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const sqlQuery = `
      SELECT 
        a.id,
        a.actor_id AS "actorId",
        a.actor_email AS "actorEmail",
        u.full_name AS "actorName",
        a.action,
        a.target_restaurant_id AS "targetRestaurantId",
        a.target_restaurant_name AS "targetRestaurantName",
        r.slug AS "targetRestaurantSlug",
        a.reason,
        a.created_at AS "createdAt",
        CASE 
          WHEN a.previous_state IS NOT NULL OR a.new_state IS NOT NULL THEN true 
          ELSE false 
        END AS "hasStateChange",
        COUNT(*) OVER() AS "fullCount"
      FROM admin_audit_logs a
      LEFT JOIN restaurants r ON r.id = a.target_restaurant_id
      LEFT JOIN users u ON u.id = a.actor_id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY ${orderExpression} ${sortDirection}, a.id ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    interface RawAuditRow {
      id: string;
      actorId: string | null;
      actorEmail: string;
      actorName: string | null;
      action: AdminAuditAction;
      targetRestaurantId: string | null;
      targetRestaurantName: string;
      targetRestaurantSlug: string | null;
      reason: string | null;
      createdAt: string | Date;
      hasStateChange: boolean;
      fullCount: string | number;
    }

    const rows = await db.query<RawAuditRow>(sqlQuery, params);
    const total = rows.length > 0 ? Number(rows[0].fullCount) : 0;
    const totalPages = Math.ceil(total / pageSize);

    const items: AdminAuditListRow[] = rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorEmail: r.actorEmail,
      actorName: r.actorName || null,
      action: r.action,
      targetRestaurantId: r.targetRestaurantId,
      targetRestaurantName: r.targetRestaurantName,
      targetRestaurantSlug: r.targetRestaurantSlug || null,
      reason: r.reason,
      createdAt: new Date(r.createdAt),
      hasStateChange: Boolean(r.hasStateChange),
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
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

