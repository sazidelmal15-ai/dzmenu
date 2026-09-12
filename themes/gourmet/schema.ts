/**
 * Gourmet Theme — Zod Settings Schema & Safe Migration
 */

import { z } from "zod";
import type { GourmetPaletteId } from "./palettes";

export const GOURMET_PALETTE_IDS = [
  "maison_olive",
  "original",
  "rose",
  "midnight",
] as const;

export const GourmetSettingsSchema = z.object({
  // Single Source of Truth for Theme Colors (Designer-Defined)
  paletteId: z.enum(GOURMET_PALETTE_IDS).catch("maison_olive").default("maison_olive"),

  // Curated Bilingual Typography Suite
  typographySuiteId: z
    .enum([
      "classic_heritage",
      "burger_grill_punchy",
      "modern_bistro_italian",
      "minimalist_lounge_cafe",
      "mediterranean_heritage",
      "artisan_bakery_cafe",
      "oriental_traditional",
    ])
    .catch("classic_heritage")
    .default("classic_heritage"),

  typography: z
    .object({
      font_family: z.string().min(1).catch("Outfit").default("Outfit"),
      heading_weight: z.enum(["normal", "medium", "bold", "black"]).catch("bold").default("bold"),
      base_font_size: z.number().int().min(10).max(30).catch(16).default(16),
    })
    .catch({
      font_family: "Outfit",
      heading_weight: "bold",
      base_font_size: 16,
    })
    .default({}),

  layout: z
    .object({
      category_style: z.string().catch("stories").default("stories"),
      card_style: z.string().catch("hero").default("hero"),
      show_header_banner: z.boolean().catch(true).default(true),
      show_all_category: z.boolean().catch(true).default(true),
      show_cart_bar: z.boolean().catch(true).default(true),
      show_search: z.boolean().catch(true).default(true),
      card_radius: z.number().int().min(0).max(40).catch(16).default(16),
    })
    .passthrough()
    .default({}),
  info: z
    .object({
      show_ambience_photo: z.boolean().catch(true).default(true),
      show_hours: z.boolean().catch(true).default(true),
      show_location: z.boolean().catch(true).default(true),
      show_contact: z.boolean().catch(true).default(true),
      show_whatsapp: z.boolean().catch(true).default(true),
      show_social_links: z.boolean().catch(true).default(true),
      show_wifi: z.boolean().catch(true).default(true),
      show_about: z.boolean().catch(true).default(true),
    })
    .passthrough()
    .default({}),
  image_slots: z.record(z.string(), z.string().nullable()).catch({}).default({}),
  image_framing: z.record(z.string(), z.any()).catch({}).default({}),
}).passthrough();

export type GourmetSettings = z.infer<typeof GourmetSettingsSchema>;

/**
 * Deterministic legacy migration utility:
 * Converts legacy free-form color settings into a validated V2 paletteId.
 */
export function migrateLegacyGourmetSettings(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const record = { ...(raw as Record<string, unknown>) };

  // If already has a valid paletteId, keep it
  if (
    typeof record.paletteId === "string" &&
    GOURMET_PALETTE_IDS.includes(record.paletteId as GourmetPaletteId)
  ) {
    return record;
  }

  // Attempt to map from legacy colors.primary
  const colors = record.colors as Record<string, string> | undefined;
  if (colors?.primary && typeof colors.primary === "string") {
    const primary = colors.primary.toLowerCase();
    if (primary.includes("f43f5e") || primary.includes("pink") || primary.includes("rose")) {
      record.paletteId = "rose";
    } else if (primary.includes("38bdf8") || primary.includes("blue") || primary.includes("cyan")) {
      record.paletteId = "midnight";
    } else {
      record.paletteId = "maison_olive";
    }
  } else {
    record.paletteId = "maison_olive";
  }

  return record;
}

/**
 * Safe Runtime Fallback
 */
export function resolveGourmetRuntimeSettings(raw: unknown): GourmetSettings {
  const migrated = migrateLegacyGourmetSettings(raw);
  const result = GourmetSettingsSchema.safeParse(migrated);
  if (result.success) {
    return result.data;
  }

  console.warn(
    "[Gourmet Runtime Recovery] Warning during settings parsing:",
    result.error.issues
  );

  return GourmetSettingsSchema.parse(migrated);
}
