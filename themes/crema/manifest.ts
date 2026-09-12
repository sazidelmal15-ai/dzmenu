/**
 * Crema Theme — Declarative Manifest
 */

import type { ThemeManifest } from "@/types/theme-contract";

export const CREMA_MANIFEST: ThemeManifest = {
  id: "crema",
  name: "Crema",
  description: "Earthy Warmth & Specialty Coffee designed for bakeries and artisan cafés.",
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
      description: "Custom logo tailored for Crema theme. Falls back to default restaurant profile logo if not set.",
      aspectRatio: "1:1",
      recommendedWidth: 512,
      recommendedHeight: 512,
      defaultUrl: null,
      optional: true,
    },
  ],
  defaultSettings: {
    paletteId: "rose_patisserie",
    splash: {
      enabled: true,
      title: "Sweet Moments",
      subtitle: "DESSERTS & CAFÉ",
      auto_dismiss_seconds: 2.5,
    },
    greeting: {
      title: "Hello",
      morning_subtitle: "Good Morning",
      evening_subtitle: "Good Evening",
    },
    footer: {
      show_info_card: true,
      directions_button_text: "Get Directions",
      show_social_links: true,
      show_phone: true,
      show_whatsapp: true,
      show_instagram: true,
      show_tiktok: true,
      show_facebook: true,
      show_share: true,
      show_operating_hours: true,
      show_wifi_info: true,
    },
    typography: {
      font_family: "Playfair Display",
      heading_weight: "bold",
      base_font_size: 16,
    },
    layout: {
      category_style: "minimal_icons",
      card_style: "cafe_grid",
      card_radius: 22,
      show_header_banner: true,
      show_all_category: false,
      show_search: true,
    },
    image_slots: {},
  },
};
