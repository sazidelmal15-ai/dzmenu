import "server-only";
import { getDb, type DatabaseAdapter } from "../client";
import type { Restaurant, RestaurantProfileUpdatePayload, RestaurantStatus } from "@/types/restaurant";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";

export interface AdminRestaurantOverview {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerEmail: string | null;
  ownerName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
}

export interface PlatformKpiStats {
  totalRestaurants: number;
  activeCount: number;
  trialCount: number;
  expiredCount: number;
  suspendedCount: number;
}

export type AdminEffectiveStatus = "ACTIVE" | "TRIAL" | "EXPIRED" | "SUSPENDED";

export interface AdminRestaurantRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  restaurantStatus: string;
  ownerEmail: string | null;
  ownerName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionExpiresAt: Date | null;
  effectiveStatus: AdminEffectiveStatus;
  createdAt: Date;
}

export interface AdminRestaurantDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  status: string;
  currency: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  subscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: SubscriptionPlan | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  effectiveStatus: AdminEffectiveStatus;
  isTrial: boolean;
  totalCategories: number;
  totalMenuItems: number;
}

export interface AdminRestaurantListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  plan?: string;
  sortBy?: "name" | "created" | "expiry" | "status";
  sortOrder?: "asc" | "desc";
}


export interface AdminRestaurantListResult {
  items: AdminRestaurantRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Standard Restaurant SELECT columns mapping snake_case DB columns to camelCase domain model.
 */
export const RESTAURANT_SELECT_COLUMNS = `
  id, name, slug, logo_url AS "logoUrl", cover_url AS "coverUrl", 
  tagline, description, is_subdomain_locked AS "isSubdomainLocked",
  cuisine_types AS "cuisineTypes", phone, whatsapp, city, address,
  google_maps_url AS "googleMapsUrl", always_open AS "alwaysOpen",
  operating_hours AS "operatingHours", tiktok_url AS "tiktokUrl",
  instagram_url AS "instagramUrl", facebook_url AS "facebookUrl",
  wifi_ssid AS "wifiSsid", wifi_password AS "wifiPassword",
  currency, status, active_theme_id AS "activeThemeId", deleted_at AS "deletedAt",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

/**
 * Tenant-Isolated Restaurant Query Helpers.
 */
export const restaurantQueries = {
  /**
   * Creates a new restaurant record.
   */
  async create(name: string, slug: string, currency = "DZD"): Promise<Restaurant> {
    const db = getDb();
    const row = await db.queryOne<Restaurant>(
      `INSERT INTO restaurants (name, slug, currency, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())
       RETURNING id, name, slug, logo_url AS "logoUrl", cover_url AS "coverUrl",
                 description, phone, address, currency, status, deleted_at AS "deletedAt",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name.trim(), slug.toLowerCase().trim(), currency]
    );

    if (!row) {
      throw new Error("Failed to create restaurant record");
    }

    return row;
  },

  /**
   * Attaches a user to a restaurant membership.
   */
  async addMember(
    userId: string,
    restaurantId: string,
    role: "RESTAURANT_OWNER" | "MANAGER" = "RESTAURANT_OWNER"
  ): Promise<void> {
    const db = getDb();
    await db.query(
      `INSERT INTO restaurant_members (user_id, restaurant_id, role, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
      [userId, restaurantId, role]
    );
  },

  /**
   * Resolves a restaurant by its UUID primary key.
   */
  async findById(id: string, dbOrTx?: DatabaseAdapter): Promise<Restaurant | null> {
    const db = dbOrTx || getDb();
    return db.queryOne<Restaurant>(
      `SELECT ${RESTAURANT_SELECT_COLUMNS}
       FROM restaurants
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
  },

  /**
   * Locks restaurant row with FOR UPDATE inside a database transaction to serialize concurrent updates.
   */
  async lockForUpdate(id: string, dbOrTx: DatabaseAdapter): Promise<Restaurant | null> {
    return dbOrTx.queryOne<Restaurant>(
      `SELECT ${RESTAURANT_SELECT_COLUMNS}
       FROM restaurants
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [id]
    );
  },

  /**
   * Resolves a restaurant by its public slug for public QR menus.
   */
  async findBySlug(slug: string): Promise<Restaurant | null> {
    const db = getDb();
    return db.queryOne<Restaurant>(
      `SELECT ${RESTAURANT_SELECT_COLUMNS}
       FROM restaurants
       WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
  },

  /**
   * Retrieves all active restaurants accessible by a specific user.
   */
  async findByUserId(userId: string): Promise<Restaurant[]> {
    const db = getDb();
    return db.query<Restaurant>(
      `SELECT r.id, r.name, r.slug, r.logo_url AS "logoUrl", r.cover_url AS "coverUrl", 
              r.tagline, r.description, r.is_subdomain_locked AS "isSubdomainLocked",
              r.cuisine_types AS "cuisineTypes", r.phone, r.whatsapp, r.city, r.address,
              r.google_maps_url AS "googleMapsUrl", r.always_open AS "alwaysOpen",
              r.operating_hours AS "operatingHours", r.tiktok_url AS "tiktokUrl",
              r.instagram_url AS "instagramUrl", r.facebook_url AS "facebookUrl",
              r.wifi_ssid AS "wifiSsid", r.wifi_password AS "wifiPassword",
              r.currency, r.status, r.active_theme_id AS "activeThemeId", r.deleted_at AS "deletedAt",
              r.created_at AS "createdAt", r.updated_at AS "updatedAt"
       FROM restaurants r
       INNER JOIN restaurant_members rm ON rm.restaurant_id = r.id
       WHERE rm.user_id = $1 AND r.deleted_at IS NULL`,
      [userId]
    );
  },

  /**
   * Updates profile details for a restaurant tenant dynamically.
   */
  async updateProfile(id: string, data: RestaurantProfileUpdatePayload): Promise<Restaurant> {
    const db = getDb();
    const sets: string[] = [];
    const values: unknown[] = [id];
    let paramIdx = 2;

    if (data.name !== undefined) {
      sets.push(`name = $${paramIdx++}`);
      values.push(data.name ? data.name.trim() : null);
    }
    if (data.slug !== undefined) {
      sets.push(`slug = $${paramIdx++}`);
      values.push(data.slug ? data.slug.toLowerCase().trim() : null);
    }
    if (data.isSubdomainLocked !== undefined) {
      sets.push(`is_subdomain_locked = $${paramIdx++}`);
      values.push(data.isSubdomainLocked);
    }
    if (data.logoUrl !== undefined) {
      sets.push(`logo_url = $${paramIdx++}`);
      values.push(data.logoUrl || null);
    }
    if (data.coverUrl !== undefined) {
      sets.push(`cover_url = $${paramIdx++}`);
      values.push(data.coverUrl || null);
    }
    if (data.tagline !== undefined) {
      sets.push(`tagline = $${paramIdx++}`);
      values.push(data.tagline ? data.tagline.trim() : null);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${paramIdx++}`);
      values.push(data.description ? data.description.trim() : null);
    }
    if (data.cuisineTypes !== undefined) {
      sets.push(`cuisine_types = $${paramIdx++}::jsonb`);
      values.push(JSON.stringify(data.cuisineTypes));
    }
    if (data.phone !== undefined) {
      sets.push(`phone = $${paramIdx++}`);
      values.push(data.phone ? data.phone.trim() : null);
    }
    if (data.whatsapp !== undefined) {
      sets.push(`whatsapp = $${paramIdx++}`);
      values.push(data.whatsapp ? data.whatsapp.trim() : null);
    }
    if (data.city !== undefined) {
      sets.push(`city = $${paramIdx++}`);
      values.push(data.city ? data.city.trim() : null);
    }
    if (data.address !== undefined) {
      sets.push(`address = $${paramIdx++}`);
      values.push(data.address ? data.address.trim() : null);
    }
    if (data.googleMapsUrl !== undefined) {
      sets.push(`google_maps_url = $${paramIdx++}`);
      values.push(data.googleMapsUrl ? data.googleMapsUrl.trim() : null);
    }
    if (data.alwaysOpen !== undefined) {
      sets.push(`always_open = $${paramIdx++}`);
      values.push(data.alwaysOpen);
    }
    if (data.operatingHours !== undefined) {
      sets.push(`operating_hours = $${paramIdx++}::jsonb`);
      values.push(JSON.stringify(data.operatingHours));
    }
    if (data.tiktokUrl !== undefined) {
      sets.push(`tiktok_url = $${paramIdx++}`);
      values.push(data.tiktokUrl ? data.tiktokUrl.trim() : null);
    }
    if (data.instagramUrl !== undefined) {
      sets.push(`instagram_url = $${paramIdx++}`);
      values.push(data.instagramUrl ? data.instagramUrl.trim() : null);
    }
    if (data.facebookUrl !== undefined) {
      sets.push(`facebook_url = $${paramIdx++}`);
      values.push(data.facebookUrl ? data.facebookUrl.trim() : null);
    }
    if (data.wifiSsid !== undefined) {
      sets.push(`wifi_ssid = $${paramIdx++}`);
      values.push(data.wifiSsid ? data.wifiSsid.trim() : null);
    }
    if (data.wifiPassword !== undefined) {
      sets.push(`wifi_password = $${paramIdx++}`);
      values.push(data.wifiPassword ? data.wifiPassword.trim() : null);
    }
    if (data.currency !== undefined) {
      sets.push(`currency = $${paramIdx++}`);
      values.push(data.currency);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${paramIdx++}`);
      values.push(data.status);
    }

    if (sets.length === 0) {
      return (await this.findById(id))!;
    }

    sets.push(`updated_at = NOW()`);

    const query = `
      UPDATE restaurants
      SET ${sets.join(", ")}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, name, slug, logo_url AS "logoUrl", cover_url AS "coverUrl",
                tagline, description, is_subdomain_locked AS "isSubdomainLocked",
                cuisine_types AS "cuisineTypes", phone, whatsapp, city, address,
                google_maps_url AS "googleMapsUrl", always_open AS "alwaysOpen",
                operating_hours AS "operatingHours", tiktok_url AS "tiktokUrl",
                instagram_url AS "instagramUrl", facebook_url AS "facebookUrl",
                wifi_ssid AS "wifiSsid", wifi_password AS "wifiPassword",
                currency, status, deleted_at AS "deletedAt",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    const row = await db.queryOne<Restaurant>(query, values);
    if (!row) {
      throw new Error("Failed to update restaurant profile record");
    }
    return row;
  },

  /**
   * Updates status for a restaurant tenant (e.g., ACTIVE, SUSPENDED).
   */
  async updateStatus(
    id: string,
    status: RestaurantStatus,
    dbOrTx?: DatabaseAdapter
  ): Promise<Restaurant> {
    const db = dbOrTx || getDb();
    const row = await db.queryOne<Restaurant>(
      `UPDATE restaurants
       SET status = $2, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING ${RESTAURANT_SELECT_COLUMNS}`,
      [id, status]
    );
    if (!row) {
      throw new Error(`Failed to update status for restaurant ${id}`);
    }
    return row;
  },

  /**
   * Retrieves all registered restaurants for Platform Administration overview.
   */
  async getAllForAdmin(dbOrTx?: DatabaseAdapter): Promise<AdminRestaurantOverview[]> {
    const db = dbOrTx || getDb();
    return db.query<AdminRestaurantOverview>(
      `SELECT r.id, r.name, r.slug, r.status,
              u.email AS "ownerEmail", u.full_name AS "ownerName",
              s.status AS "subscriptionStatus", s.plan AS "subscriptionPlan",
              s.current_period_end AS "subscriptionExpiresAt",
              r.created_at AS "createdAt"
       FROM restaurants r
       LEFT JOIN (
         SELECT DISTINCT ON (restaurant_id) restaurant_id, user_id
         FROM restaurant_members
         WHERE role = 'RESTAURANT_OWNER'
         ORDER BY restaurant_id, created_at ASC
       ) rm ON rm.restaurant_id = r.id
       LEFT JOIN users u ON u.id = rm.user_id
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC`
    );
  },

  /**
   * High-performance, parameterized paginated query for the Phase 4 Restaurants Smart Table.
   * Supports server-side search, status & plan filtering, safe allowlist sorting, and windowed total count.
   */
  async getPaginatedForAdmin(
    options: AdminRestaurantListOptions = {},
    dbOrTx?: DatabaseAdapter
  ): Promise<AdminRestaurantListResult> {
    const db = dbOrTx || getDb();

    // 1. Pagination Sanitization (Strict allowlist & clamping)
    const allowedPageSizes = [10, 25, 50];
    const rawPageSize = Number(options.pageSize) || 10;
    const pageSize = allowedPageSizes.includes(rawPageSize) ? rawPageSize : 10;
    const rawPage = Number(options.page) || 1;
    const page = Math.max(1, Math.floor(rawPage));
    const offset = (page - 1) * pageSize;

    // 2. Query Parameters & WHERE Clauses
    const whereClauses: string[] = ["r.deleted_at IS NULL"];
    const params: unknown[] = [];

    // Search: case-insensitive match across name, slug, owner email, owner name
    if (options.search && options.search.trim()) {
      const sanitizedSearch = `%${options.search.trim().toLowerCase()}%`;
      params.push(sanitizedSearch);
      const pIdx = params.length;
      whereClauses.push(
        `(LOWER(r.name) LIKE $${pIdx} OR LOWER(r.slug) LIKE $${pIdx} OR LOWER(COALESCE(u.email, '')) LIKE $${pIdx} OR LOWER(COALESCE(u.full_name, '')) LIKE $${pIdx})`
      );
    }

    // Status Filter: Semantic lifecycle filter
    if (options.status && options.status.trim().toUpperCase() !== "ALL") {
      const statusNorm = options.status.trim().toUpperCase();
      if (statusNorm === "SUSPENDED") {
        whereClauses.push(`(r.status = 'SUSPENDED' OR s.status = 'SUSPENDED')`);
      } else if (statusNorm === "ACTIVE") {
        whereClauses.push(`(s.status = 'ACTIVE' AND s.current_period_end > NOW() AND r.status != 'SUSPENDED')`);
      } else if (statusNorm === "TRIAL" || statusNorm === "TRIALING") {
        whereClauses.push(`((s.status = 'TRIALING' OR s.status = 'TRIAL') AND s.current_period_end > NOW() AND r.status != 'SUSPENDED')`);
      } else if (statusNorm === "EXPIRED") {
        whereClauses.push(`((s.current_period_end <= NOW() OR s.status = 'EXPIRED' OR s.status = 'INACTIVE' OR s.status IS NULL) AND r.status != 'SUSPENDED')`);
      }
    }

    // Plan Filter: Plan identifier filter
    if (options.plan && options.plan.trim().toUpperCase() !== "ALL") {
      const planNorm = options.plan.trim().toUpperCase();
      params.push(planNorm);
      const pIdx = params.length;
      whereClauses.push(`(UPPER(COALESCE(s.plan, '')) = $${pIdx} OR UPPER(COALESCE(s.plan, '')) LIKE $${pIdx} || '_%')`);
    }

    // 3. Sorting (Strict Server-Side Allowlist)
    let orderExpression = "r.created_at";
    const sortKey = options.sortBy || "created";
    const sortDirection = options.sortOrder?.toLowerCase() === "asc" ? "ASC" : "DESC";

    switch (sortKey) {
      case "name":
        orderExpression = "r.name";
        break;
      case "expiry":
        orderExpression = "COALESCE(s.current_period_end, '1970-01-01'::timestamptz)";
        break;
      case "status":
        orderExpression = `CASE 
          WHEN r.status = 'SUSPENDED' OR s.status = 'SUSPENDED' THEN 4
          WHEN (s.current_period_end <= NOW() OR s.status = 'EXPIRED' OR s.status = 'INACTIVE' OR s.status IS NULL) THEN 3
          WHEN (s.status = 'TRIALING' OR s.status = 'TRIAL') THEN 2
          ELSE 1 
        END`;
        break;
      case "created":
      default:
        orderExpression = "r.created_at";
        break;
    }

    // Append limit & offset as parameterized inputs
    params.push(pageSize);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const sqlQuery = `
      SELECT 
        r.id,
        r.name,
        r.slug,
        r.logo_url AS "logoUrl",
        r.status AS "restaurantStatus",
        u.email AS "ownerEmail",
        u.full_name AS "ownerName",
        s.status AS "subscriptionStatus",
        s.plan AS "subscriptionPlan",
        s.current_period_end AS "subscriptionExpiresAt",
        r.created_at AS "createdAt",
        CASE
          WHEN r.status = 'SUSPENDED' OR s.status = 'SUSPENDED' THEN 'SUSPENDED'
          WHEN (s.status = 'TRIALING' OR s.status = 'TRIAL') AND s.current_period_end > NOW() THEN 'TRIAL'
          WHEN s.status = 'ACTIVE' AND s.current_period_end > NOW() THEN 'ACTIVE'
          ELSE 'EXPIRED'
        END AS "effectiveStatus",
        COUNT(*) OVER() AS "fullCount"
      FROM restaurants r
      LEFT JOIN (
        SELECT DISTINCT ON (restaurant_id) restaurant_id, user_id
        FROM restaurant_members
        WHERE role = 'RESTAURANT_OWNER'
        ORDER BY restaurant_id, created_at ASC
      ) rm ON rm.restaurant_id = r.id
      LEFT JOIN users u ON u.id = rm.user_id
      LEFT JOIN subscriptions s ON s.restaurant_id = r.id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY ${orderExpression} ${sortDirection}, r.id ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    interface RawAdminRow extends AdminRestaurantRow {
      fullCount: string | number;
    }

    const rows = await db.query<RawAdminRow>(sqlQuery, params);
    const total = rows.length > 0 ? Number(rows[0].fullCount) : 0;
    const totalPages = Math.ceil(total / pageSize);

    const items: AdminRestaurantRow[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      restaurantStatus: r.restaurantStatus,
      ownerEmail: r.ownerEmail,
      ownerName: r.ownerName,
      subscriptionStatus: r.subscriptionStatus,
      subscriptionPlan: r.subscriptionPlan,
      subscriptionExpiresAt: r.subscriptionExpiresAt ? new Date(r.subscriptionExpiresAt) : null,
      effectiveStatus: r.effectiveStatus as AdminEffectiveStatus,
      createdAt: new Date(r.createdAt),
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
   * Retrieves comprehensive restaurant tenant details for Platform Admin Drawer.
   */
  async getDetailForAdmin(
    id: string,
    dbOrTx?: DatabaseAdapter
  ): Promise<AdminRestaurantDetail | null> {
    const db = dbOrTx || getDb();
    const row = await db.queryOne<{
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      coverUrl: string | null;
      status: string;
      currency: string;
      phone: string | null;
      whatsapp: string | null;
      city: string | null;
      address: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
      ownerId: string | null;
      ownerName: string | null;
      ownerEmail: string | null;
      ownerPhone: string | null;
      subscriptionId: string | null;
      subscriptionStatus: SubscriptionStatus | null;
      subscriptionPlan: SubscriptionPlan | null;
      currentPeriodStart: string | Date | null;
      currentPeriodEnd: string | Date | null;
      effectiveStatus: string;
      isTrial: boolean;
      totalCategories: string | number;
      totalMenuItems: string | number;
    }>(
      `SELECT 
         r.id,
         r.name,
         r.slug,
         r.logo_url AS "logoUrl",
         r.cover_url AS "coverUrl",
         r.status,
         r.currency,
         r.phone,
         r.whatsapp,
         r.city,
         r.address,
         r.created_at AS "createdAt",
         r.updated_at AS "updatedAt",
         u.id AS "ownerId",
         u.full_name AS "ownerName",
         u.email AS "ownerEmail",
         s.id AS "subscriptionId",
         s.status AS "subscriptionStatus",
         s.plan AS "subscriptionPlan",
         s.current_period_start AS "currentPeriodStart",
         s.current_period_end AS "currentPeriodEnd",
         CASE
           WHEN r.status = 'SUSPENDED' OR s.status = 'SUSPENDED' THEN 'SUSPENDED'
           WHEN (s.status = 'TRIALING' OR s.status = 'TRIAL') AND s.current_period_end > NOW() THEN 'TRIAL'
           WHEN s.status = 'ACTIVE' AND s.current_period_end > NOW() THEN 'ACTIVE'
           ELSE 'EXPIRED'
         END AS "effectiveStatus",
         CASE
           WHEN s.status = 'TRIALING' OR s.status = 'TRIAL' OR UPPER(COALESCE(s.plan, '')) LIKE '%TRIAL%' THEN true
           ELSE false
         END AS "isTrial",
         COALESCE((SELECT COUNT(*)::int FROM categories c WHERE c.restaurant_id = r.id AND c.deleted_at IS NULL), 0) AS "totalCategories",
         COALESCE((SELECT COUNT(*)::int FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.deleted_at IS NULL), 0) AS "totalMenuItems"
       FROM restaurants r
       LEFT JOIN (
         SELECT DISTINCT ON (restaurant_id) restaurant_id, user_id
         FROM restaurant_members
         WHERE role = 'RESTAURANT_OWNER'
         ORDER BY restaurant_id, created_at ASC
       ) rm ON rm.restaurant_id = r.id
       LEFT JOIN users u ON u.id = rm.user_id
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [id]
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logoUrl,
      coverUrl: row.coverUrl,
      status: row.status,
      currency: row.currency || "DZD",
      phone: row.phone,
      whatsapp: row.whatsapp,
      city: row.city,
      address: row.address,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      ownerId: row.ownerId,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      ownerPhone: null,
      subscriptionId: row.subscriptionId,
      subscriptionStatus: row.subscriptionStatus,
      subscriptionPlan: row.subscriptionPlan,
      currentPeriodStart: row.currentPeriodStart ? new Date(row.currentPeriodStart) : null,
      currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
      effectiveStatus: row.effectiveStatus as AdminEffectiveStatus,
      isTrial: Boolean(row.isTrial),
      totalCategories: Number(row.totalCategories),
      totalMenuItems: Number(row.totalMenuItems),
    };
  },

  /**
   * Retrieves live aggregated KPI metrics for Mission Control.
   */
  async getPlatformKpiStats(dbOrTx?: DatabaseAdapter): Promise<PlatformKpiStats> {
    const db = dbOrTx || getDb();
    const row = await db.queryOne<{
      totalRestaurants: string | number;
      activeCount: string | number;
      trialCount: string | number;
      expiredCount: string | number;
      suspendedCount: string | number;
    }>(
      `SELECT 
         COUNT(r.id)::int AS "totalRestaurants",
         COUNT(CASE WHEN (s.status = 'ACTIVE') AND s.current_period_end > NOW() AND r.status != 'SUSPENDED' THEN 1 END)::int AS "activeCount",
         COUNT(CASE WHEN (s.status = 'TRIALING' OR s.status = 'TRIAL') AND s.current_period_end > NOW() AND r.status != 'SUSPENDED' THEN 1 END)::int AS "trialCount",
         COUNT(CASE WHEN (s.current_period_end <= NOW() OR s.status = 'EXPIRED' OR s.status = 'INACTIVE' OR s.status IS NULL) AND r.status != 'SUSPENDED' THEN 1 END)::int AS "expiredCount",
         COUNT(CASE WHEN r.status = 'SUSPENDED' OR s.status = 'SUSPENDED' THEN 1 END)::int AS "suspendedCount"
       FROM restaurants r
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       WHERE r.deleted_at IS NULL`
    );

    return {
      totalRestaurants: row ? Number(row.totalRestaurants) : 0,
      activeCount: row ? Number(row.activeCount) : 0,
      trialCount: row ? Number(row.trialCount) : 0,
      expiredCount: row ? Number(row.expiredCount) : 0,
      suspendedCount: row ? Number(row.suspendedCount) : 0,
    };
  },
};


