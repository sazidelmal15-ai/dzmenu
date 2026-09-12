import type { ThemeSection } from "@/types/theme-engine";
import { resolveGourmetRuntimeSettings } from "@/themes/gourmet/schema";
import { resolveCravingRuntimeSettings } from "@/themes/craving/schema";
import { resolveCremaRuntimeSettings } from "@/themes/crema/schema";
import { resolveNoirRuntimeSettings } from "@/themes/noir/schema";
import { resolveBasilRuntimeSettings } from "@/themes/basil/schema";
import { THEME_DEFINITIONS } from "./definitions";
import { themeSectionSchema } from "./sanitizer";

/**
 * Ensures any raw settings payload from DB is safely migrated and hydrated into a valid settings object.
 * Guarantees zero runtime crashes and 100% preservation of customized V2 settings.
 */
export function migrateThemeSettings(rawSettings: unknown, presetId: string = "gourmet"): Record<string, unknown> {
  const normalizedPreset = (presetId || "gourmet").toLowerCase();

  switch (normalizedPreset) {
    case "crema":
      return resolveCremaRuntimeSettings(rawSettings) as unknown as Record<string, unknown>;
    case "craving":
      return resolveCravingRuntimeSettings(rawSettings) as unknown as Record<string, unknown>;
    case "noir":
      return resolveNoirRuntimeSettings(rawSettings) as unknown as Record<string, unknown>;
    case "basil":
      return resolveBasilRuntimeSettings(rawSettings) as unknown as Record<string, unknown>;
    case "gourmet":
    default:
      return resolveGourmetRuntimeSettings(rawSettings) as unknown as Record<string, unknown>;
  }
}

/**
 * Hydrates and validates theme sections and blocks.
 */
export function migrateThemeSections(rawSections: unknown, presetId: string = "gourmet"): ThemeSection[] {
  const fallback = (THEME_DEFINITIONS[presetId as keyof typeof THEME_DEFINITIONS] || THEME_DEFINITIONS.gourmet).defaultSections;

  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return fallback;
  }

  const validSections: ThemeSection[] = [];
  for (const s of rawSections) {
    const res = themeSectionSchema.safeParse(s);
    if (res.success) {
      validSections.push(res.data as ThemeSection);
    }
  }

  return validSections.length > 0 ? validSections : fallback;
}
