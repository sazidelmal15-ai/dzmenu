/**
 * Basil Theme — Declarative Manifest
 */

import type { ThemeManifest } from "@/types/theme-contract";

export const BASIL_MANIFEST: ThemeManifest = {
  id: "basil",
  name: "Basil",
  description: "Fresh Organic & Woodfired Italian with rich botanical tones and banner category showcases.",
  author: "by DZMenu",
  themePackageVersion: "2.1.0",
  settingsSchemaVersion: 1,
  capabilities: {
    splash: {
      supported: true,
      presentationModes: ["fullscreen_page"],
      defaultMode: "fullscreen_page",
    },
    main: {
      supported: true,
      presentationModes: ["inlined"],
      defaultMode: "inlined",
    },
    category: {
      supported: true,
      presentationModes: ["inlined", "fullscreen_page"],
      defaultMode: "inlined",
    },
    item: {
      supported: true,
      presentationModes: ["bottom_sheet", "fullscreen_page"],
      defaultMode: "bottom_sheet",
    },
  },
  imageSlots: [
    {
      id: "hero_cover",
      label: "Farm Hero Artwork",
      description: "Organic farm-to-table or woodfired pizza oven display banner.",
      aspectRatio: "16:9",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "farm_story",
      label: "Farm Provenance Artwork",
      description: "Photo of local harvests, artisan producers, or heritage oven.",
      aspectRatio: "16:9",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      defaultUrl: null,
      optional: true,
    },
  ],
  defaultSettings: {
    paletteId: "toscana_olive",
    typography: {
      font_family: "Outfit",
      heading_weight: "bold",
      base_font_size: 16,
    },
    layout: {
      category_style: "banner",
      card_style: "artisan_card",
      card_radius: 18,
      show_header_banner: true,
      show_all_category: true,
      show_cart_bar: true,
      show_search: true,
    },
    image_slots: {},
  },
};
