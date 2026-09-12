import "server-only";
import { getDb } from "../client";
import type { ThemePresetId, RestaurantThemeRecord, ThemeSection } from "@/types/theme-engine";
import type { Restaurant } from "@/types/restaurant";
import type { OperatingHourDaySchedule } from "@/types/theme-contract";
import { THEME_DEFINITIONS } from "@/lib/themes/definitions";
import { migrateThemeSettings, migrateThemeSections } from "@/lib/themes/migrator";

/**
 * Theme Queries (Shopify-Grade Multi-Tenant Architecture)
 * Strict separation of concerns: touches presentation records only.
 * Single source of truth: restaurants.active_theme_id.
 */
export const themeQueries = {
  /**
   * Lists all themes in the restaurant's library, marking which one is the live theme.
   */
  async listByRestaurantId(restaurantId: string): Promise<{
    activeThemeId: string | null;
    themes: Array<RestaurantThemeRecord & { isLive: boolean }>;
  }> {
    const db = getDb();

    // 1. Get the Single Source of Truth
    const restaurant = await db.queryOne<{ active_theme_id: string | null }>(
      `SELECT active_theme_id FROM restaurants WHERE id = $1 AND deleted_at IS NULL`,
      [restaurantId]
    );
    const activeThemeId = restaurant?.active_theme_id ?? null;

    // 2. Fetch all installed theme instances
    const rows = await db.query<{
      id: string;
      restaurant_id: string;
      preset_id: string;
      name: string;
      status: string;
      settings: unknown;
      sections: unknown;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, restaurant_id, preset_id, name, status, settings, sections, created_at, updated_at
       FROM restaurant_themes
       WHERE restaurant_id = $1
       ORDER BY created_at DESC`,
      [restaurantId]
    );

    const themes: Array<RestaurantThemeRecord & { isLive: boolean }> = rows.map((r) => {
      const presetId = r.preset_id as ThemePresetId;
      return {
        id: r.id,
        restaurantId: r.restaurant_id,
        presetId,
        name: r.name,
        status: (r.id === activeThemeId ? "published" : "draft") as "draft" | "published",
        settings: migrateThemeSettings(r.settings, presetId),
        sections: migrateThemeSections(r.sections, presetId),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        isLive: r.id === activeThemeId,
      };
    });

    return { activeThemeId, themes };
  },

  /**
   * Finds a specific theme by ID, strictly guarded by restaurant_id.
   */
  async findById(themeId: string, restaurantId: string): Promise<RestaurantThemeRecord | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(themeId) || !uuidRegex.test(restaurantId)) {
      return null;
    }

    const db = getDb();
    const row = await db.queryOne<{
      id: string;
      restaurant_id: string;
      preset_id: string;
      name: string;
      status: string;
      settings: unknown;
      sections: unknown;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, restaurant_id, preset_id, name, status, settings, sections, created_at, updated_at
       FROM restaurant_themes
       WHERE id = $1 AND restaurant_id = $2`,
      [themeId, restaurantId]
    );

    if (!row) return null;

    const presetId = row.preset_id as ThemePresetId;
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      presetId,
      name: row.name,
      status: row.status as "draft" | "published",
      settings: migrateThemeSettings(row.settings, presetId),
      sections: migrateThemeSections(row.sections, presetId),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Finds a theme instance and its owning restaurant for a specific authorized user.
   * Guarantees that the theme belongs to a restaurant the user is a member of.
   */
  async findThemeForUser(
    themeId: string,
    userId: string
  ): Promise<{ theme: RestaurantThemeRecord; restaurant: Restaurant } | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(themeId) || !uuidRegex.test(userId)) {
      return null;
    }

    const db = getDb();
    const row = await db.queryOne<{
      id: string;
      restaurant_id: string;
      preset_id: string;
      name: string;
      status: string;
      settings: unknown;
      sections: unknown;
      created_at: Date;
      updated_at: Date;
      rest_id: string;
      rest_name: string;
      rest_slug: string;
      rest_logo_url: string | null;
      rest_cover_url: string | null;
      rest_tagline: string | null;
      rest_description: string | null;
      rest_is_subdomain_locked: boolean;
      rest_cuisine_types: unknown;
      rest_phone: string | null;
      rest_whatsapp: string | null;
      rest_city: string | null;
      rest_address: string | null;
      rest_google_maps_url: string | null;
      rest_always_open: boolean;
      rest_operating_hours: unknown;
      rest_tiktok_url: string | null;
      rest_instagram_url: string | null;
      rest_facebook_url: string | null;
      rest_wifi_ssid: string | null;
      rest_wifi_password: string | null;
      rest_currency: string;
      rest_status: string;
      rest_active_theme_id: string | null;
      rest_deleted_at: Date | null;
      rest_created_at: Date;
      rest_updated_at: Date;
    }>(
      `SELECT t.id, t.restaurant_id, t.preset_id, t.name, t.status, t.settings, t.sections, t.created_at, t.updated_at,
              r.id AS rest_id, r.name AS rest_name, r.slug AS rest_slug, r.logo_url AS rest_logo_url, r.cover_url AS rest_cover_url,
              r.tagline AS rest_tagline, r.description AS rest_description, r.is_subdomain_locked AS rest_is_subdomain_locked,
              r.cuisine_types AS rest_cuisine_types, r.phone AS rest_phone, r.whatsapp AS rest_whatsapp, r.city AS rest_city,
              r.address AS rest_address, r.google_maps_url AS rest_google_maps_url, r.always_open AS rest_always_open,
              r.operating_hours AS rest_operating_hours, r.tiktok_url AS rest_tiktok_url, r.instagram_url AS rest_instagram_url,
              r.facebook_url AS rest_facebook_url, r.wifi_ssid AS rest_wifi_ssid, r.wifi_password AS rest_wifi_password,
              r.currency AS rest_currency, r.status AS rest_status, r.active_theme_id AS rest_active_theme_id,
              r.deleted_at AS rest_deleted_at, r.created_at AS rest_created_at, r.updated_at AS rest_updated_at
       FROM restaurant_themes t
       INNER JOIN restaurants r ON r.id = t.restaurant_id
       INNER JOIN restaurant_members rm ON rm.restaurant_id = r.id
       WHERE t.id = $1 AND rm.user_id = $2 AND r.deleted_at IS NULL`,
      [themeId, userId]
    );

    if (!row) return null;

    const presetId = row.preset_id as ThemePresetId;
    const theme: RestaurantThemeRecord = {
      id: row.id,
      restaurantId: row.restaurant_id,
      presetId,
      name: row.name,
      status: row.status as "draft" | "published",
      settings: migrateThemeSettings(row.settings, presetId),
      sections: migrateThemeSections(row.sections, presetId),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const restaurant: Restaurant = {
      id: row.rest_id,
      name: row.rest_name,
      slug: row.rest_slug,
      logoUrl: row.rest_logo_url,
      coverUrl: row.rest_cover_url,
      tagline: row.rest_tagline,
      description: row.rest_description,
      isSubdomainLocked: row.rest_is_subdomain_locked,
      cuisineTypes: Array.isArray(row.rest_cuisine_types) ? (row.rest_cuisine_types as string[]) : [],
      phone: row.rest_phone,
      whatsapp: row.rest_whatsapp,
      city: row.rest_city,
      address: row.rest_address,
      googleMapsUrl: row.rest_google_maps_url,
      alwaysOpen: row.rest_always_open,
      operatingHours: Array.isArray(row.rest_operating_hours) ? (row.rest_operating_hours as unknown as OperatingHourDaySchedule[]) : [],
      tiktokUrl: row.rest_tiktok_url,
      instagramUrl: row.rest_instagram_url,
      facebookUrl: row.rest_facebook_url,
      wifiSsid: row.rest_wifi_ssid,
      wifiPassword: row.rest_wifi_password,
      currency: row.rest_currency,
      status: row.rest_status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED",
      activeThemeId: row.rest_active_theme_id,
      deletedAt: row.rest_deleted_at,
      createdAt: row.rest_created_at,
      updatedAt: row.rest_updated_at,
    };

    return { theme, restaurant };
  },

  /**
   * Instantiates a new theme from a preset into the restaurant's library as draft.
   */
  async createFromPreset(
    restaurantId: string,
    presetId: ThemePresetId,
    customName?: string
  ): Promise<RestaurantThemeRecord> {
    const db = getDb();
    const definition = THEME_DEFINITIONS[presetId] || THEME_DEFINITIONS.gourmet;
    const name = customName?.trim() || `${definition.name} Theme`;

    const row = await db.queryOne<{
      id: string;
      restaurant_id: string;
      preset_id: string;
      name: string;
      status: string;
      settings: unknown;
      sections: unknown;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO restaurant_themes (
        restaurant_id, preset_id, name, status, settings, sections
      ) VALUES ($1, $2, $3, 'draft', $4::jsonb, $5::jsonb)
      RETURNING id, restaurant_id, preset_id, name, status, settings, sections, created_at, updated_at`,
      [
        restaurantId,
        presetId,
        name,
        JSON.stringify(definition.defaultSettings),
        JSON.stringify(definition.defaultSections),
      ]
    );

    if (!row) throw new Error("Failed to create theme instance");

    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      presetId,
      name: row.name,
      status: "draft",
      settings: migrateThemeSettings(row.settings, presetId),
      sections: migrateThemeSections(row.sections, presetId),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Updates settings and sections of a theme.
   */
  async update(
    themeId: string,
    restaurantId: string,
    payload: {
      name?: string;
      settings?: Record<string, unknown>;
      sections?: ThemeSection[];
    }
  ): Promise<RestaurantThemeRecord> {
    const db = getDb();

    // Verify existence & ownership
    const existing = await this.findById(themeId, restaurantId);
    if (!existing) throw new Error("Theme not found or does not belong to this restaurant");

    const newName = payload.name !== undefined ? payload.name.trim() : existing.name;
    const newSettings = payload.settings ? migrateThemeSettings(payload.settings, existing.presetId) : existing.settings;
    const newSections = payload.sections ? migrateThemeSections(payload.sections, existing.presetId) : existing.sections;

    const row = await db.queryOne<{
      id: string;
      restaurant_id: string;
      preset_id: string;
      name: string;
      status: string;
      settings: unknown;
      sections: unknown;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE restaurant_themes
       SET name = $1, settings = $2::jsonb, sections = $3::jsonb, updated_at = NOW()
       WHERE id = $4 AND restaurant_id = $5
       RETURNING id, restaurant_id, preset_id, name, status, settings, sections, created_at, updated_at`,
      [newName, JSON.stringify(newSettings), JSON.stringify(newSections), themeId, restaurantId]
    );

    if (!row) throw new Error("Failed to update theme");

    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      presetId: existing.presetId,
      name: row.name,
      status: row.status as "draft" | "published",
      settings: newSettings,
      sections: newSections,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Atomic Transactional Publish
   * Sets active_theme_id on restaurants (Single Source of Truth) with row-level lock.
   */
  async publishAtomic(themeId: string, restaurantId: string): Promise<{ success: boolean; activeThemeId: string }> {
    const db = getDb();

    return db.transaction(async (tx) => {
      // 1. Lock restaurant row to eliminate race conditions
      const restaurant = await tx.queryOne<{ id: string; active_theme_id: string | null }>(
        `SELECT id, active_theme_id FROM restaurants WHERE id = $1 FOR UPDATE`,
        [restaurantId]
      );
      if (!restaurant) throw new Error("Restaurant not found");

      // 2. Verify target theme exists and belongs strictly to this restaurant
      const targetTheme = await tx.queryOne<{ id: string; preset_id: string }>(
        `SELECT id, preset_id FROM restaurant_themes WHERE id = $1 AND restaurant_id = $2`,
        [themeId, restaurantId]
      );
      if (!targetTheme) throw new Error("Theme does not exist or does not belong to this restaurant");

      // 3. Mark previous active theme as draft and current as published
      await tx.query(
        `UPDATE restaurant_themes SET status = 'draft', updated_at = NOW()
         WHERE restaurant_id = $1 AND status = 'published'`,
        [restaurantId]
      );
      await tx.query(
        `UPDATE restaurant_themes SET status = 'published', updated_at = NOW()
         WHERE id = $1`,
        [themeId]
      );

      // 4. Update the Single Source of Truth
      await tx.query(
        `UPDATE restaurants SET active_theme_id = $1, updated_at = NOW() WHERE id = $2`,
        [themeId, restaurantId]
      );

      return { success: true, activeThemeId: themeId };
    });
  },

  /**
   * Duplicates an existing theme instance into an independent customizable draft.
   */
  async duplicate(themeId: string, restaurantId: string): Promise<RestaurantThemeRecord> {
    const db = getDb();
    const original = await this.findById(themeId, restaurantId);
    if (!original) throw new Error("Source theme not found");

    const copyName = `${original.name} (Copy)`;

    const row = await db.queryOne<{
      id: string;
      restaurant_id: string;
      preset_id: string;
      name: string;
      status: string;
      settings: unknown;
      sections: unknown;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO restaurant_themes (
        restaurant_id, preset_id, name, status, settings, sections
      ) VALUES ($1, $2, $3, 'draft', $4::jsonb, $5::jsonb)
      RETURNING id, restaurant_id, preset_id, name, status, settings, sections, created_at, updated_at`,
      [
        restaurantId,
        original.presetId,
        copyName,
        JSON.stringify(original.settings),
        JSON.stringify(original.sections),
      ]
    );

    if (!row) throw new Error("Failed to duplicate theme");

    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      presetId: original.presetId,
      name: row.name,
      status: "draft",
      settings: original.settings,
      sections: original.sections,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Deletes an unpublished draft theme.
   * Active-theme deletion protection: strictly prevents deleting the active live theme!
   */
  async delete(themeId: string, restaurantId: string): Promise<{ deleted: boolean }> {
    const db = getDb();

    // 1. Guard against deleting the active live theme
    const restaurant = await db.queryOne<{ active_theme_id: string | null }>(
      `SELECT active_theme_id FROM restaurants WHERE id = $1`,
      [restaurantId]
    );

    if (restaurant?.active_theme_id === themeId) {
      throw new Error("Cannot delete the active live theme. Please publish another theme first.");
    }

    const rows = await db.query(
      `DELETE FROM restaurant_themes WHERE id = $1 AND restaurant_id = $2`,
      [themeId, restaurantId]
    );

    return { deleted: rows.length > 0 };
  },
};
