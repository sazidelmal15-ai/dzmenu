/**
 * Craving Theme — Declarative Manifest
 */

import type { ThemeManifest } from "@/types/theme-contract";

export const CRAVING_MANIFEST: ThemeManifest = {
  id: "craving",
  name: "Craving",
  description: "Bold High Energy & Fast Casual for Burgers, Pizza, Tacos & Street Food.",
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
      id: "logo",
      label: "Theme Logo",
      description: "Custom logo tailored for Craving theme. Falls back to default restaurant profile logo.",
      aspectRatio: "1:1",
      recommendedWidth: 512,
      recommendedHeight: 512,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "hero_burger",
      label: "Hero Smash Burger Artwork",
      description: "Appetizing hero photo displayed on the main top showcase banner.",
      aspectRatio: "1:1",
      recommendedWidth: 800,
      recommendedHeight: 800,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "deal_combo",
      label: "Today's Craving Deal Combo",
      description: "Combo photo displayed on the Today's Craving promotional deal banner.",
      aspectRatio: "16:9",
      recommendedWidth: 1000,
      recommendedHeight: 600,
      defaultUrl: null,
      optional: true,
    },
    {
      id: "info_ambience",
      label: "Info Ambience Photo",
      description: "Interior / kitchen photo displayed across the top of the restaurant Info tab.",
      aspectRatio: "16:9",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      defaultUrl: null,
      optional: true,
    },
  ],
  defaultSettings: {
    paletteId: "blaze_red",
    typographySuiteId: "punchy_street",
    typography: {
      font_family: "Outfit",
      heading_weight: "black",
      base_font_size: 16,
    },
    layout: {
      category_style: "card_badges",
      card_style: "grid_2col",
      card_radius: 20,
      show_hero_highlight: true,
      show_featured: true,
      show_category_icons: true,
      show_deal_combo: true,
      show_search: true,
      hero_tagline: "HOT & FRESH • SMASH BURGERS DONE RIGHT",
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
    image_slots: {},
  },
};
