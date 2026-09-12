/**
 * DZMenu Theme System V2 — Theme Registry
 *
 * Central catalog of all registered themes, their declarative manifests,
 * and their lazy-loaded package modules.
 */

import type {
  ThemeManifest,
  ThemeRegistration,
  ThemePackage,
  ThemeRenderContext,
} from "@/types/theme-contract";
import React from "react";

// ============================================================================
// 1. STATIC THEME MANIFESTS
// ============================================================================

import { GOURMET_MANIFEST } from "./gourmet/manifest";
export { GOURMET_MANIFEST };

import { CRAVING_MANIFEST } from "./craving/manifest";
export { CRAVING_MANIFEST };


import { CREMA_MANIFEST } from "./crema/manifest";
export { CREMA_MANIFEST };


import { NOIR_MANIFEST } from "./noir/manifest";
export { NOIR_MANIFEST };


import { BASIL_MANIFEST } from "./basil/manifest";
export { BASIL_MANIFEST };


// ============================================================================
// 2. DEFAULT PACKAGE GENERATOR (Foundation Adapter for Milestone 2)
// ============================================================================

/**
 * Generates CSS custom properties from settings dictionary.
 */
function defaultGenerateCssVariables(settings: Record<string, unknown>): Record<string, string> {
  const colors = (settings.colors as Record<string, string>) || {};
  const typography = (settings.typography as Record<string, string>) || {};

  return {
    "--dz-theme-primary": colors.primary || "#D97706",
    "--dz-theme-accent": colors.accent || "#F59E0B",
    "--dz-theme-secondary": colors.secondary || "#78350F",
    "--dz-theme-background": colors.background || "#FAF9F5",
    "--dz-theme-surface": colors.surface || "#FFFFFF",
    "--dz-theme-text": colors.text || "#18181B",
    "--dz-theme-text-secondary": colors.text_secondary || "#71717A",
    "--dz-theme-font-family": typography.font_family ? `"${typography.font_family}", sans-serif` : "Outfit, sans-serif",
  };
}

/**
 * Creates a theme package wrapper around a manifest.
 */
export function createThemePackage(
  manifest: ThemeManifest,
  MainTemplate: React.ComponentType<ThemeRenderContext>
): ThemePackage {
  return {
    manifest,
    validateSettings: (raw: unknown) => {
      if (typeof raw === "object" && raw !== null) {
        return { ...manifest.defaultSettings, ...(raw as Record<string, unknown>) };
      }
      return manifest.defaultSettings;
    },
    generateCssVariables: defaultGenerateCssVariables,
    editorControls: [],
    templates: {
      main: MainTemplate,
    },
  };
}

// ============================================================================
// 3. STATIC THEME PACKAGES & REGISTRY CATALOG
// ============================================================================

import gourmetPackage from "./gourmet";
import cravingPackage from "./craving";
import cremaPackage from "./crema";
import noirPackage from "./noir";
import basilPackage from "./basil";

export const STATIC_THEME_PACKAGES: Record<string, ThemePackage> = {
  gourmet: gourmetPackage,
  craving: cravingPackage,
  crema: cremaPackage,
  noir: noirPackage,
  basil: basilPackage,
};

export const THEME_REGISTRY: Record<string, ThemeRegistration> = {
  gourmet: {
    manifest: GOURMET_MANIFEST,
    loadPackage: () => Promise.resolve({ default: gourmetPackage }),
  },
  craving: {
    manifest: CRAVING_MANIFEST,
    loadPackage: () => Promise.resolve({ default: cravingPackage }),
  },
  crema: {
    manifest: CREMA_MANIFEST,
    loadPackage: () => Promise.resolve({ default: cremaPackage }),
  },
  noir: {
    manifest: NOIR_MANIFEST,
    loadPackage: () => Promise.resolve({ default: noirPackage }),
  },
  basil: {
    manifest: BASIL_MANIFEST,
    loadPackage: () => Promise.resolve({ default: basilPackage }),
  },
};

/**
 * Returns the theme package synchronously for instant zero-latency rendering.
 */
export function getStaticThemePackage(themeId?: string | null): ThemePackage {
  const normalized = (themeId || "gourmet").toLowerCase();
  return STATIC_THEME_PACKAGES[normalized] || STATIC_THEME_PACKAGES.gourmet;
}

/**
 * Returns the manifest for a theme ID, falling back to gourmet.
 */
export function getThemeManifest(themeId?: string | null): ThemeManifest {
  const normalized = (themeId || "gourmet").toLowerCase();
  return THEME_REGISTRY[normalized]?.manifest || GOURMET_MANIFEST;
}
