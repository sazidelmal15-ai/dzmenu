/**
 * Craving Theme — CSS Design Tokens Generator
 */

import type { CravingSettings } from "./schema";
import { CRAVING_PALETTES, CravingPaletteId } from "./palettes";
import { CRAVING_TYPOGRAPHY_SUITES } from "./typography";

export function generateCssVariables(settings: CravingSettings): Record<string, string> {
  const paletteId = (settings.paletteId || "blaze_red") as CravingPaletteId;
  const palette = CRAVING_PALETTES[paletteId] || CRAVING_PALETTES.blaze_red;
  const colors = palette.colors;

  const suiteId = settings.typographySuiteId || "punchy_street";
  const suite = CRAVING_TYPOGRAPHY_SUITES[suiteId] || CRAVING_TYPOGRAPHY_SUITES.punchy_street;

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
    "--dz-theme-font-family": suite.bodyFont,
    "--dz-theme-font-serif": suite.headingFont,
    "--dz-theme-hero-title-size": suite.heroTitleSize || "clamp(2rem, 7vw, 2.75rem)",
    "--dz-theme-hero-title-tracking": suite.heroTitleTracking || "-0.02em",
    "--dz-theme-hero-title-leading": suite.heroTitleLeading || "1.0",
    "--dz-theme-heading-weight": "900",
    "--dz-theme-base-font-size": "16px",
    "--dz-theme-card-radius": cardRadius,

    // Legacy V1 Fallback Aliases
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
