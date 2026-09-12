/**
 * Noir Theme — Zod Settings Schema & Safe Migration
 */

import { z } from "zod";
import type { NoirPaletteId } from "./palettes";

export const NOIR_PALETTE_IDS = [
  "obsidian_gold",
  "neon_cyan",
  "royal_amethyst",
  "emerald_lounge",
  "crimson_velvet",
] as const;

export const NoirSettingsSchema = z.object({
  paletteId: z.enum(NOIR_PALETTE_IDS).catch("obsidian_gold").default("obsidian_gold"),

  typography: z
    .object({
      font_family: z.string().min(1).catch("Inter").default("Inter"),
      heading_weight: z.enum(["normal", "medium", "bold", "black"]).catch("bold").default("bold"),
      base_font_size: z.number().int().min(10).max(30).catch(16).default(16),
    })
    .catch({
      font_family: "Inter",
      heading_weight: "bold",
      base_font_size: 16,
    })
    .default({}),

  layout: z
    .object({
      category_style: z.string().catch("glass").default("glass"),
      card_style: z.string().catch("cinematic_hero").default("cinematic_hero"),
      card_radius: z.number().int().min(0).max(40).catch(20).default(20),
      show_header_banner: z.boolean().catch(true).default(true),
      show_all_category: z.boolean().catch(true).default(true),
      show_cart_bar: z.boolean().catch(true).default(true),
      show_search: z.boolean().catch(true).default(true),
    })
    .passthrough()
    .default({}),
  image_slots: z.record(z.string(), z.string().nullable()).catch({}).default({}),
  image_framing: z.record(z.string(), z.any()).catch({}).default({}),
}).passthrough();

export type NoirSettings = z.infer<typeof NoirSettingsSchema>;

export function migrateLegacyNoirSettings(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const record = { ...(raw as Record<string, unknown>) };

  if (
    typeof record.paletteId === "string" &&
    NOIR_PALETTE_IDS.includes(record.paletteId as NoirPaletteId)
  ) {
    return record;
  }

  const colors = record.colors as Record<string, string> | undefined;
  if (colors?.primary && typeof colors.primary === "string") {
    const primary = colors.primary.toLowerCase();
    if (primary.includes("06b6d4") || primary.includes("cyan") || primary.includes("blue")) {
      record.paletteId = "neon_cyan";
    } else if (primary.includes("a855f7") || primary.includes("purple") || primary.includes("plum")) {
      record.paletteId = "royal_amethyst";
    } else if (primary.includes("10b981") || primary.includes("emerald") || primary.includes("green")) {
      record.paletteId = "emerald_lounge";
    } else if (primary.includes("ef4444") || primary.includes("crimson") || primary.includes("red")) {
      record.paletteId = "crimson_velvet";
    } else {
      record.paletteId = "obsidian_gold";
    }
  } else {
    record.paletteId = "obsidian_gold";
  }

  return record;
}

export function resolveNoirRuntimeSettings(raw: unknown): NoirSettings {
  const migrated = migrateLegacyNoirSettings(raw);
  const result = NoirSettingsSchema.safeParse(migrated);
  if (result.success) {
    return result.data;
  }

  console.warn(
    "[Noir Runtime Recovery] Warning during settings parsing:",
    result.error.issues
  );

  return NoirSettingsSchema.parse(migrated);
}
