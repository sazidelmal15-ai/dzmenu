/**
 * Craving Theme — Zod Settings Schema & Safe Migration
 */

import { z } from "zod";
import type { CravingPaletteId } from "./palettes";

export const CRAVING_PALETTE_IDS = [
  "blaze_red",
  "mustard_gold",
  "flame_orange",
  "cream_vintage",
] as const;

export const CravingSettingsSchema = z.object({
  // Single Source of Truth for Craving Palettes
  paletteId: z.enum(CRAVING_PALETTE_IDS).catch("blaze_red").default("blaze_red"),

  typographySuiteId: z
    .enum(["punchy_street", "bebas_grill", "pizza_trattoria", "diner_classic"])
    .catch("punchy_street")
    .default("punchy_street"),

  typography: z
    .object({
      font_family: z.string().min(1).catch("Outfit").default("Outfit"),
      heading_weight: z.enum(["normal", "medium", "bold", "black"]).catch("black").default("black"),
      base_font_size: z.number().int().min(10).max(30).catch(16).default(16),
    })
    .catch({
      font_family: "Outfit",
      heading_weight: "black",
      base_font_size: 16,
    })
    .default({}),

  layout: z
    .object({
      category_style: z.string().catch("card_badges").default("card_badges"),
      card_style: z.string().catch("grid_2col").default("grid_2col"),
      card_radius: z.number().int().min(0).max(40).catch(18).default(18),
      show_hero_highlight: z.boolean().catch(true).default(true),
      show_featured: z.boolean().catch(true).default(true),
      show_category_icons: z.boolean().catch(true).default(true),
      show_deal_combo: z.boolean().catch(true).default(true),
      show_search: z.boolean().catch(true).default(true),
      hero_tagline: z.string().catch("HOT & FRESH • SMASH BURGERS DONE RIGHT").default("HOT & FRESH • SMASH BURGERS DONE RIGHT"),
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

export type CravingSettings = z.infer<typeof CravingSettingsSchema>;

/**
 * Deterministic legacy migration utility for Craving
 */
export function migrateLegacyCravingSettings(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const record = { ...(raw as Record<string, unknown>) };

  if (
    typeof record.paletteId === "string" &&
    CRAVING_PALETTE_IDS.includes(record.paletteId as CravingPaletteId)
  ) {
    return record;
  }

  const colors = record.colors as Record<string, string> | undefined;
  if (colors?.primary && typeof colors.primary === "string") {
    const primary = colors.primary.toLowerCase();
    if (primary.includes("ea580c") || primary.includes("orange") || primary.includes("flame")) {
      record.paletteId = "flame_orange";
    } else if (primary.includes("f59e0b") || primary.includes("f4b400") || primary.includes("amber") || primary.includes("yellow")) {
      record.paletteId = "mustard_gold";
    } else {
      record.paletteId = "blaze_red";
    }
  } else {
    record.paletteId = "blaze_red";
  }

  return record;
}

/**
 * Safe Runtime Fallback for Craving
 */
export function resolveCravingRuntimeSettings(raw: unknown): CravingSettings {
  const migrated = migrateLegacyCravingSettings(raw);
  const result = CravingSettingsSchema.safeParse(migrated);
  if (result.success) {
    return result.data;
  }

  console.warn(
    "[Craving Runtime Recovery] Warning during settings parsing:",
    result.error.issues
  );

  return CravingSettingsSchema.parse(migrated);
}
