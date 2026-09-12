/**
 * Crema Theme — CSS Design Tokens Generator
 */

import type { CremaSettings } from "./schema";
import { CREMA_PALETTES, CremaPaletteId } from "./palettes";

export function generateCssVariables(settings: CremaSettings): Record<string, string> {
  const paletteId = (settings.paletteId || "rose_patisserie") as CremaPaletteId;
  const palette = CREMA_PALETTES[paletteId] || CREMA_PALETTES.rose_patisserie;
  const colors = palette.colors;

  const typography = settings.typography || {};
  const fontFamily = typography.font_family
    ? `"${typography.font_family}", serif`
    : '"Playfair Display", Georgia, serif';

  const weightMap: Record<string, string> = {
    normal: "400",
    medium: "600",
    bold: "700",
  };
  const headingWeight = weightMap[typography.heading_weight || "bold"] || "700";
  const baseFontSize = `${typography.base_font_size || 16}px`;

  const layout = settings.layout || {};
  const cardRadius = `${layout.card_radius ?? 16}px`;

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
    "--dz-theme-pill-active-bg": colors.pillActiveBg,
    "--dz-theme-pill-active-text": colors.pillActiveText,
    "--dz-theme-pill-inactive-bg": colors.pillInactiveBg,
    "--dz-theme-pill-inactive-text": colors.pillInactiveText,
    "--dz-theme-pill-inactive-border": colors.pillInactiveBorder,
    "--dz-theme-search-bg": colors.searchBg,
    "--dz-theme-search-border": colors.searchBorder,
    "--dz-theme-price": colors.priceColor,
    "--dz-theme-splash-from": colors.splashGradFrom,
    "--dz-theme-splash-via": colors.splashGradVia,
    "--dz-theme-splash-to": colors.splashGradTo,
    "--dz-theme-splash-glow1": colors.splashGlow1,
    "--dz-theme-splash-glow2": colors.splashGlow2,
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
