/**
 * Basil Theme — Zod Settings Schema & Safe Migration
 */

import { z } from "zod";
import type { BasilPaletteId } from "./palettes";

export const BASIL_PALETTE_IDS = [
  "toscana_olive",
  "sun_terracotta",
  "fresh_basil",
  "mediterranean_azure",
  "botanical_dark",
] as const;

export const BasilSettingsSchema = z.object({
  paletteId: z.enum(BASIL_PALETTE_IDS).catch("toscana_olive").default("toscana_olive"),

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
      category_style: z.string().catch("banner").default("banner"),
      card_style: z.string().catch("artisan_card").default("artisan_card"),
      card_radius: z.number().int().min(0).max(40).catch(18).default(18),
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

export type BasilSettings = z.infer<typeof BasilSettingsSchema>;

export function migrateLegacyBasilSettings(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const record = { ...(raw as Record<string, unknown>) };

  if (
    typeof record.paletteId === "string" &&
    BASIL_PALETTE_IDS.includes(record.paletteId as BasilPaletteId)
  ) {
    return record;
  }

  const colors = record.colors as Record<string, string> | undefined;
  if (colors?.primary && typeof colors.primary === "string") {
    const primary = colors.primary.toLowerCase();
    if (primary.includes("c2410c") || primary.includes("terracotta") || primary.includes("orange")) {
      record.paletteId = "sun_terracotta";
    } else if (primary.includes("059669") || primary.includes("basil")) {
      record.paletteId = "fresh_basil";
    } else if (primary.includes("0284c7") || primary.includes("blue") || primary.includes("azure")) {
      record.paletteId = "mediterranean_azure";
    } else if (primary.includes("0a110d") || primary.includes("dark")) {
      record.paletteId = "botanical_dark";
    } else {
      record.paletteId = "toscana_olive";
    }
  } else {
    record.paletteId = "toscana_olive";
  }

  return record;
}

export function resolveBasilRuntimeSettings(raw: unknown): BasilSettings {
  const migrated = migrateLegacyBasilSettings(raw);
  const result = BasilSettingsSchema.safeParse(migrated);
  if (result.success) {
    return result.data;
  }

  console.warn(
    "[Basil Runtime Recovery] Warning during settings parsing:",
    result.error.issues
  );

  return BasilSettingsSchema.parse(migrated);
}
