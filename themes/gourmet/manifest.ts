/**
 * Gourmet Theme — Declarative Manifest
 */

import type { ThemeManifest } from "@/types/theme-contract";

export const GOURMET_MANIFEST: ThemeManifest = {
  id: "gourmet",
  name: "Gourmet",
  description: "Warm Luxury & Fine Dining with story avatars and gold amber accents.",
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
      id: "logo",
      label: "Theme Logo",
      description: "Custom logo tailored for Gourmet theme. Falls back to default restaurant profile logo if not set.",
      aspectRatio: "1:1",
      recommendedWidth: 512,
      recommendedHeight: 512,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "hero_cover",
      label: "Hero Cover Artwork",
      description: "Atmospheric banner displayed across the top of the main menu.",
      aspectRatio: "16:9",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "info_ambience",
      label: "Info Ambience Photo",
      description: "Interior ambience photo displayed across the top of the restaurant Info & Story tab.",
      aspectRatio: "16:9",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      defaultUrl: null,
      optional: true,
    },
  ],
  defaultSettings: {
    paletteId: "maison_olive",
    typographySuiteId: "classic_heritage",
    typography: {
      font_family: "Outfit",
      heading_weight: "bold",
      base_font_size: 16,
    },
    layout: {
      category_style: "stories",
      card_style: "hero",
      show_header_banner: true,
      show_all_category: true,
      show_cart_bar: true,
      show_search: true,
      card_radius: 16,
    },
    info: {
      show_ambience_photo: true,
      show_hours: true,
      show_location: true,
      show_contact: true,
      show_whatsapp: true,
      show_social_links: true,
      show_wifi: true,
      show_about: true,
    },
  },
};
