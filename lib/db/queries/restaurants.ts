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
       LEFT JOIN restaurant_members rm ON rm.restaurant_id = r.id AND rm.role = 'RESTAURANT_OWNER'
       LEFT JOIN users u ON u.id = rm.user_id
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC`
    );
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
