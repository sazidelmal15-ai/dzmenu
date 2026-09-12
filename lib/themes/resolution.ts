/**
 * DZMenu Theme System V2 — Template & Presentation Mode Resolution
 *
 * Resolves the active template and presentation mode based on the theme's
 * declared capabilities and the requested navigation view.
 */

import type {
  ThemeCapabilities,
  ActiveThemeViewType,
  PresentationMode,
} from "@/types/theme-contract";

export interface ResolvedTemplateTarget {
  target: ActiveThemeViewType;
  mode: PresentationMode;
}

/**
 * Resolves which template to render and what presentation mode to apply.
 *
 * Rules:
 * 1. Splash: If supported, renders splash with its defaultMode. If unsupported, delegates to Main.
 * 2. Category: If supported and defaultMode is 'fullscreen_page', renders Category template.
 *    If inlined or unsupported, renders Main with the active category filtered/scrolled into view.
 * 3. Item: If supported, renders Item with its defaultMode ('bottom_sheet', 'dialog_modal', or 'fullscreen_page').
 *    If unsupported, falls back to Main inlined.
 * 4. Main: Always supported. Every theme MUST provide a Main template.
 */
export function resolveActiveTemplate(
  capabilities: ThemeCapabilities,
  activeView: ActiveThemeViewType
): ResolvedTemplateTarget {
  switch (activeView) {
    case "splash":
      if (capabilities.splash?.supported) {
        return {
          target: "splash",
          mode: capabilities.splash.defaultMode || "fullscreen_page",
        };
      }
      return {
        target: "main",
        mode: capabilities.main?.defaultMode || "inlined",
      };

    case "category":
      if (
        capabilities.category?.supported &&
        capabilities.category.defaultMode === "fullscreen_page"
      ) {
        return {
          target: "category",
          mode: "fullscreen_page",
        };
      }
      // If inlined or unsupported, Main renders the category list
      return {
        target: "main",
        mode: capabilities.main?.defaultMode || "inlined",
      };

    case "item":
      if (capabilities.item?.supported) {
        return {
          target: "item",
          mode: capabilities.item.defaultMode || "bottom_sheet",
        };
      }
      return {
        target: "main",
        mode: capabilities.main?.defaultMode || "inlined",
      };

    case "main":
    default:
      return {
        target: "main",
        mode: capabilities.main?.defaultMode || "inlined",
      };
  }
}

/**
 * Checks if a specific view type is natively supported by the theme capabilities.
 */
export function isViewSupported(
  capabilities: ThemeCapabilities,
  view: ActiveThemeViewType
): boolean {
  if (view === "main") return true;
  return Boolean(capabilities[view]?.supported);
}

/**
 * Returns the default presentation mode for a view type in the given capabilities.
 */
export function getPresentationMode(
  capabilities: ThemeCapabilities,
  view: ActiveThemeViewType
): PresentationMode {
  return capabilities[view]?.defaultMode || "inlined";
}
