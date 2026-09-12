import { getDb } from "@/lib/db/client";
import type { SafeThemeVariables, ThemePresetId, ThemeSection } from "@/types/theme-engine";
import { THEME_DEFINITIONS } from "./definitions";
import { migrateThemeSettings, migrateThemeSections } from "./migrator";
import { sanitizeThemeForCss } from "./sanitizer";

export interface ResolvedTheme {
  themeId: string | null;
  presetId: ThemePresetId;
  name: string;
  status: "draft" | "published";
  isPreview: boolean;
  settings: Record<string, unknown>;
  sections: ThemeSection[];
  cssVariables: SafeThemeVariables;
}

/**
 * Resolves the theme for a restaurant.
 * Strictly separates presentation from restaurant business data.
 * Supports authorized preview mode without altering restaurants.active_theme_id.
 */
export async function resolveRestaurantTheme(
  restaurantId: string,
  options?: {
    previewThemeId?: string | null;
    isAuthorizedPreview?: boolean;
  }
): Promise<ResolvedTheme> {
  const db = getDb();

  let targetThemeId: string | null = null;
  let isPreview = false;

  // 1. Authorized Preview Check
  if (options?.previewThemeId && options.isAuthorizedPreview) {
    targetThemeId = options.previewThemeId;
    isPreview = true;
  }

  // 2. Fall back to the Single Source of Truth on restaurants table
  if (!targetThemeId) {
    const restaurant = await db.queryOne<{ active_theme_id: string | null }>(
      `SELECT active_theme_id FROM restaurants WHERE id = $1 AND deleted_at IS NULL`,
      [restaurantId]
    );
    targetThemeId = restaurant?.active_theme_id || null;
  }

  // 3. Fetch Theme Instance Record
  let themeRow: {
    id: string;
    preset_id: string;
    name: string;
    status: string;
    settings: unknown;
    sections: unknown;
  } | null = null;

  if (targetThemeId) {
    themeRow = await db.queryOne(
      `SELECT id, preset_id, name, status, settings, sections 
       FROM restaurant_themes 
       WHERE id = $1 AND restaurant_id = $2`,
      [targetThemeId, restaurantId]
    );
  }

  // 4. Self-Healing Fallback if no theme found
  if (!themeRow) {
    const defaultDef = THEME_DEFINITIONS.gourmet;
    const safeCss = sanitizeThemeForCss(defaultDef.defaultSettings);
    return {
      themeId: null,
      presetId: "gourmet",
      name: defaultDef.name,
      status: "published",
      isPreview: false,
      settings: defaultDef.defaultSettings as unknown as Record<string, unknown>,
      sections: defaultDef.defaultSections,
      cssVariables: safeCss,
    };
  }

  const presetId = (themeRow.preset_id in THEME_DEFINITIONS
    ? themeRow.preset_id
    : "gourmet") as ThemePresetId;

  // 5. Version Migration & Sanitization
  const settings = migrateThemeSettings(themeRow.settings, presetId);
  const sections = migrateThemeSections(themeRow.sections, presetId);
  const cssVariables = sanitizeThemeForCss(settings);

  return {
    themeId: themeRow.id,
    presetId,
    name: themeRow.name,
    status: isPreview ? "draft" : "published",
    isPreview,
    settings,
    sections,
    cssVariables,
  };
}
