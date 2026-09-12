/**
 * Noir Theme — CSS Design Tokens Generator
 */

import type { NoirSettings } from "./schema";
import { NOIR_PALETTES, NoirPaletteId } from "./palettes";

export function generateCssVariables(settings: NoirSettings): Record<string, string> {
  const paletteId = (settings.paletteId || "obsidian_gold") as NoirPaletteId;
  const palette = NOIR_PALETTES[paletteId] || NOIR_PALETTES.obsidian_gold;
  const colors = palette.colors;

  const typography = settings.typography || {};
  const fontFamily = typography.font_family
    ? `"${typography.font_family}", sans-serif`
    : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const weightMap: Record<string, string> = {
    normal: "400",
    medium: "500",
    bold: "700",
    black: "900",
  };
  const headingWeight = weightMap[typography.heading_weight || "bold"] || "700";
  const baseFontSize = `${typography.base_font_size || 16}px`;

  const layout = settings.layout || {};
  const cardRadius = `${layout.card_radius ?? 20}px`;

  return {
    "--dz-theme-primary": colors.primary,
    "--dz-theme-accent": colors.accent,
    "--dz-theme-secondary": colors.secondary,
    "--dz-theme-background": colors.background,
    "--dz-theme-surface": colors.surface,
    "--dz-theme-surface-raised": colors.surfaceRaised,
    "--dz-theme-text": colors.text,
    "--dz-theme-muted": colors.muted,
    "--dz-theme-border": colors.border,
    "--dz-theme-font-family": fontFamily,
    "--dz-theme-heading-weight": headingWeight,
    "--dz-theme-base-font-size": baseFontSize,
    "--dz-theme-card-radius": cardRadius,

    // Legacy V1 Aliases
    "--dz-primary": colors.primary,
    "--dz-accent": colors.accent,
    "--dz-secondary": colors.secondary,
    "--dz-bg": colors.background,
    "--dz-surface": colors.surface,
    "--dz-text": colors.text,
    "--dz-text-secondary": colors.muted,
    "--dz-font-family": fontFamily,
    "--dz-card-radius": cardRadius,
  };
}
