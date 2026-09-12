/**
 * Gourmet Theme — CSS Design Tokens Generator
 *
 * Resolves the active designer palette and generates semantic CSS custom properties.
 * Components consume semantic tokens only; zero palette branching in templates.
 */

import type { GourmetSettings } from "./schema";
import { GOURMET_PALETTES, GourmetPaletteId } from "./palettes";
import { GOURMET_TYPOGRAPHY_SUITES } from "./typography";

export function generateCssVariables(settings: GourmetSettings): Record<string, string> {
  // 1. Resolve Palette (Single Source of Truth for Colors)
  const paletteId = (settings.paletteId || "maison_olive") as GourmetPaletteId;
  const palette = GOURMET_PALETTES[paletteId] || GOURMET_PALETTES.maison_olive;
  const colors = palette.colors;

  // 2. Resolve Typography Suite (Curated Bilingual Font Pairings)
  const suiteId = settings.typographySuiteId || "classic_heritage";
  const suite = GOURMET_TYPOGRAPHY_SUITES[suiteId] || GOURMET_TYPOGRAPHY_SUITES.classic_heritage;

  // 3. Resolve Layout Tokens
  const layout = settings.layout || {};
  const cardRadius = `${layout.card_radius ?? 16}px`;

  return {
    // V2 Standard Semantic Tokens (Primary Theme Contract)
    "--dz-theme-primary": colors.primary,
    "--dz-theme-accent": colors.accent,
    "--dz-theme-secondary": colors.secondary,
    "--dz-theme-background": colors.background,
    "--dz-theme-surface": colors.surface,
    "--dz-theme-surface-raised": colors.surfaceRaised,
    "--dz-theme-text": colors.text,
    "--dz-theme-muted": colors.muted,
    "--dz-theme-border": colors.border,
    "--dz-theme-font-family": suite.bodyFont,
    "--dz-theme-font-serif": suite.headingFont,
    "--dz-theme-hero-title-size": suite.heroTitleSize || "clamp(1.875rem, 6vw, 2.25rem)",
    "--dz-theme-hero-title-tracking": suite.heroTitleTracking || "-0.01em",
    "--dz-theme-hero-title-leading": suite.heroTitleLeading || "1.1",
    "--dz-theme-heading-weight": "700",
    "--dz-theme-base-font-size": "16px",
    "--dz-theme-card-radius": cardRadius,

    // Temporary V1 Compatibility Aliases (To be removed after all themes migrate to V2)
    "--dz-primary": colors.primary,
    "--dz-accent": colors.accent,
    "--dz-secondary": colors.secondary,
    "--dz-bg": colors.background,
    "--dz-surface": colors.surface,
    "--dz-text": colors.text,
    "--dz-text-secondary": colors.muted,
    "--dz-font-family": suite.bodyFont,
    "--dz-card-radius": cardRadius,
  };
}
