/**
 * Crema Theme — Zod Settings Schema & Safe Migration
 */

import { z } from "zod";
import type { CremaPaletteId } from "./palettes";

export const CREMA_PALETTE_IDS = [
  "rose_patisserie",
  "matcha_latte",
  "velvet_crema",
  "vanilla_bean",
] as const;

export const CremaSettingsSchema = z.object({
  paletteId: z.enum(CREMA_PALETTE_IDS).catch("rose_patisserie").default("rose_patisserie"),

  // 1. Splash / Loading Screen Customization (Page 1)
  splash: z
    .object({
      enabled: z.boolean().catch(true).default(true),
      title: z.string().catch("Sweet Moments").default("Sweet Moments"),
      subtitle: z.string().catch("DESSERTS & CAFÉ").default("DESSERTS & CAFÉ"),
      auto_dismiss_seconds: z.number().min(1).max(10).catch(2.5).default(2.5),
    })
    .catch({
      enabled: true,
      title: "Sweet Moments",
      subtitle: "DESSERTS & CAFÉ",
      auto_dismiss_seconds: 2.5,
    })
    .default({}),

  // 2. Story / Editorial Header (Page 2 Header)
  story: z
    .object({
      show_banner: z.boolean().catch(true).default(true),
      title_prefix: z.string().catch("Sweet Indulgence:").default("Sweet Indulgence:"),
      title_suffix: z.string().catch("Your Dessert, Your Way").default("Your Dessert, Your Way"),
      description: z
        .string()
        .catch(
          "From delicate cakes to handcrafted pastries, experience the essence of sweetness — beautifully designed for your perfect treat."
        )
        .default(
          "From delicate cakes to handcrafted pastries, experience the essence of sweetness — beautifully designed for your perfect treat."
        ),
    })
    .catch({
      show_banner: true,
      title_prefix: "Sweet Indulgence:",
      title_suffix: "Your Dessert, Your Way",
      description:
        "From delicate cakes to handcrafted pastries, experience the essence of sweetness — beautifully designed for your perfect treat.",
    })
    .default({}),

  // 3. Greeting Section (Dynamic AM / PM based on local timezone)
  greeting: z
    .object({
      title: z.string().catch("Hello").default("Hello"),
      morning_subtitle: z.string().catch("Good Morning").default("Good Morning"),
      evening_subtitle: z.string().catch("Good Evening").default("Good Evening"),
      subtitle: z.string().optional(),
    })
    .catch({
      title: "Hello",
      morning_subtitle: "Good Morning",
      evening_subtitle: "Good Evening",
    })
    .default({}),

  // 4. Footer & Restaurant Info Card Customization
  footer: z
    .object({
      show_info_card: z.boolean().catch(true).default(true),
      show_directions: z.boolean().catch(true).default(true),
      directions_button_text: z.string().catch("Get Directions").default("Get Directions"),
      show_social_links: z.boolean().catch(true).default(true),
      show_phone: z.boolean().catch(true).default(true),
      show_whatsapp: z.boolean().catch(true).default(true),
      show_instagram: z.boolean().catch(true).default(true),
      show_tiktok: z.boolean().catch(true).default(true),
      show_facebook: z.boolean().catch(true).default(true),
      show_share: z.boolean().catch(true).default(true),
      show_operating_hours: z.boolean().catch(true).default(true),
      show_wifi_info: z.boolean().catch(true).default(true),
    })
    .catch({
      show_info_card: true,
      show_directions: true,
      directions_button_text: "Get Directions",
      show_social_links: true,
      show_phone: true,
      show_whatsapp: true,
      show_instagram: true,
      show_tiktok: true,
      show_facebook: true,
      show_share: true,
      show_operating_hours: true,
      show_wifi_info: true,
    })
    .default({}),

  typography: z
    .object({
      font_family: z.string().min(1).catch("Playfair Display").default("Playfair Display"),
      heading_weight: z.enum(["normal", "medium", "bold", "black"]).catch("bold").default("bold"),
      base_font_size: z.number().int().min(10).max(30).catch(16).default(16),
    })
    .catch({
      font_family: "Playfair Display",
      heading_weight: "bold",
      base_font_size: 16,
    })
    .default({}),

  layout: z
    .object({
      category_style: z.string().catch("minimal_icons").default("minimal_icons"),
      card_style: z.string().catch("cafe_grid").default("cafe_grid"),
      card_radius: z.number().int().min(0).max(40).catch(22).default(22),
      show_header_banner: z.boolean().catch(true).default(true),
      show_all_category: z.boolean().catch(false).default(false),
      show_search: z.boolean().catch(true).default(true),
    })
    .passthrough()
    .default({}),
  image_slots: z.record(z.string(), z.string().nullable()).catch({}).default({}),
  image_framing: z.record(z.string(), z.any()).catch({}).default({}),
}).passthrough();

export type CremaSettings = z.infer<typeof CremaSettingsSchema>;

export function migrateLegacyCremaSettings(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const record = { ...(raw as Record<string, unknown>) };

  if (
    typeof record.paletteId === "string" &&
    CREMA_PALETTE_IDS.includes(record.paletteId as CremaPaletteId)
  ) {
    return record;
  }

  const colors = record.colors as Record<string, string> | undefined;
  if (colors?.primary && typeof colors.primary === "string") {
    const primary = colors.primary.toLowerCase();
    if (primary.includes("e86ba3") || primary.includes("pink") || primary.includes("rose")) {
      record.paletteId = "rose_patisserie";
    } else if (primary.includes("3f6212") || primary.includes("green") || primary.includes("matcha")) {
      record.paletteId = "matcha_latte";
    } else if (primary.includes("b45309") || primary.includes("vanilla")) {
      record.paletteId = "vanilla_bean";
    } else if (primary.includes("6f4e37") || primary.includes("brown") || primary.includes("crema")) {
      record.paletteId = "velvet_crema";
    } else {
      record.paletteId = "rose_patisserie";
    }
  } else {
    record.paletteId = "rose_patisserie";
  }

  return record;
}

export function resolveCremaRuntimeSettings(raw: unknown): CremaSettings {
  const migrated = migrateLegacyCremaSettings(raw);
  const result = CremaSettingsSchema.safeParse(migrated);
  if (result.success) {
    return result.data;
  }

  console.warn(
    "[Crema Runtime Recovery] Corrupted settings detected, applying fallback while preserving valid fields:",
    result.error.issues
  );

  return CremaSettingsSchema.parse(migrated);
}
