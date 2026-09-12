import { z } from "zod";
import type { ThemeSettingsV1, SafeThemeVariables } from "@/types/theme-engine";

export const SAFE_HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export const SAFE_FONTS_WHITELIST = new Set([
  "Outfit",
  "Inter",
  "Cairo",
  "Tajawal",
  "Playfair Display",
  "Roboto",
  "IBM Plex Sans Arabic",
]);

export const themeColorsSchema = z.object({
  primary: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid primary color format"),
  accent: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid accent color format"),
  secondary: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid secondary color format"),
  background: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid background color format"),
  surface: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid surface color format"),
  text: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid text color format"),
  text_secondary: z.string().regex(SAFE_HEX_COLOR_REGEX, "Invalid secondary text color format"),
});

export const themeTypographySchema = z.object({
  font_family: z.string().refine(
    (val) => SAFE_FONTS_WHITELIST.has(val),
    { message: "Font family is not in approved whitelist" }
  ),
  heading_weight: z.enum(["normal", "medium", "bold", "black"]),
});

export const themeLayoutSchema = z.object({
  category_style: z.enum(["stories", "minimal_icons", "banner", "card_badges", "glass"]),
  card_style: z.enum(["hero", "grid_2col", "compact_row"]),
  show_header_banner: z.boolean(),
  show_all_category: z.boolean().default(true),
  show_cart_bar: z.boolean().default(true),
  show_search: z.boolean(),
});

export const themeSettingsV1Schema = z.object({
  schema_version: z.literal(1),
  colors: themeColorsSchema,
  typography: themeTypographySchema,
  layout: themeLayoutSchema,
  custom_css: z.string().max(1000).optional(),
});

export const themeBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  enabled: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()),
});

export const themeSectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  enabled: z.boolean(),
  settings: z.record(z.string(), z.unknown()),
  blocks: z.array(themeBlockSchema),
});

/**
 * Validates theme settings against the strict Zod schema.
 */
export function validateThemeSettings(input: unknown): ThemeSettingsV1 {
  return themeSettingsV1Schema.parse(input);
}

/**
 * Sanitizes validated theme settings and outputs safe, injection-proof CSS variables.
 */
export function sanitizeThemeForCss(settings: unknown): SafeThemeVariables {
  const safe = (settings && typeof settings === "object" ? settings : {}) as Record<string, unknown>;
  const colors = (safe.colors && typeof safe.colors === "object" ? safe.colors : {}) as Record<string, string>;
  const typo = (safe.typography && typeof safe.typography === "object" ? safe.typography : {}) as Record<string, string>;

  const primary = colors.primary && SAFE_HEX_COLOR_REGEX.test(colors.primary)
    ? colors.primary
    : "#D97706";
  const accent = colors.accent && SAFE_HEX_COLOR_REGEX.test(colors.accent)
    ? colors.accent
    : "#F59E0B";
  const secondary = colors.secondary && SAFE_HEX_COLOR_REGEX.test(colors.secondary)
    ? colors.secondary
    : "#78350F";
  const bg = colors.background && SAFE_HEX_COLOR_REGEX.test(colors.background)
    ? colors.background
    : "#FAF9F5";
  const surface = colors.surface && SAFE_HEX_COLOR_REGEX.test(colors.surface)
    ? colors.surface
    : "#FFFFFF";
  const text = colors.text && SAFE_HEX_COLOR_REGEX.test(colors.text)
    ? colors.text
    : "#18181B";
  const textSec = colors.text_secondary && SAFE_HEX_COLOR_REGEX.test(colors.text_secondary)
    ? colors.text_secondary
    : "#71717A";

  const fontName = typo.font_family && SAFE_FONTS_WHITELIST.has(typo.font_family)
    ? typo.font_family
    : "Outfit";

  return {
    "--dz-primary": primary,
    "--dz-accent": accent,
    "--dz-secondary": secondary,
    "--dz-bg": bg,
    "--dz-surface": surface,
    "--dz-text": text,
    "--dz-text-secondary": textSec,
    "--dz-font-family": `"${fontName}", sans-serif`,
  };
}
