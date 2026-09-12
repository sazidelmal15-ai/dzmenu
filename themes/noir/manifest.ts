/**
 * Noir Theme — Declarative Manifest
 */

import type { ThemeManifest } from "@/types/theme-contract";

export const NOIR_MANIFEST: ThemeManifest = {
  id: "noir",
  name: "Noir",
  description: "Sleek Glassmorphism & Cocktail Lounges with dark obsidian reflections.",
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
      presentationModes: ["fullscreen_page", "bottom_sheet"],
      defaultMode: "fullscreen_page",
    },
  },
  imageSlots: [
    {
      id: "hero_cover",
      label: "Lounge Hero Artwork",
      description: "Atmospheric panoramic showcase of venue or signature dish.",
      aspectRatio: "16:9",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "ambient_cover",
      label: "Ambient Background Artwork",
      description: "Subtle dark texture or ambient lighting background.",
      aspectRatio: "9:16",
      recommendedWidth: 1080,
      recommendedHeight: 1920,
      defaultUrl: null,
      optional: true,
    },
  ],
  defaultSettings: {
    paletteId: "obsidian_gold",
    typography: {
      font_family: "Inter",
      heading_weight: "bold",
      base_font_size: 16,
    },
    layout: {
      category_style: "glass",
      card_style: "cinematic_hero",
      card_radius: 20,
      show_header_banner: true,
      show_all_category: true,
      show_cart_bar: true,
      show_search: true,
    },
    image_slots: {},
  },
};
