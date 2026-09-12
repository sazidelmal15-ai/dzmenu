/**
 * Craving Theme — Declarative Editor Controls Definition
 */

import type { EditorControlGroup } from "@/types/theme-contract";
import { CRAVING_PALETTE_OPTIONS } from "./palettes";
import { CRAVING_TYPOGRAPHY_OPTIONS } from "./typography";

export const CRAVING_EDITOR_CONTROLS: EditorControlGroup[] = [
  {
    id: "brand_palette",
    title: "Color Palette",
    description: "Choose an appetite-stimulating high-energy palette for your menu.",
    controls: [
      {
        id: "theme_palette",
        field: "paletteId",
        label: "Color Harmony",
        type: "palette",
        options: CRAVING_PALETTE_OPTIONS,
      },
    ],
  },
  {
    id: "brand_typography",
    title: "Typography Style",
    description: "Punchy bold bilingual typography designed for fast casual & burgers.",
    controls: [
      {
        id: "theme_typography_suite",
        field: "typographySuiteId",
        label: "Font Pairing",
        type: "select",
        options: CRAVING_TYPOGRAPHY_OPTIONS,
      },
    ],
  },
  {
    id: "brand_visuals",
    title: "Theme Visuals & Imagery",
    description: "Upload mouth-watering fast-casual food photography for banners and deals.",
    controls: [
      {
        id: "slot_theme_logo",
        field: "image_slots.logo",
        slotId: "logo",
        label: "Theme Logo",
        description: "1:1 Square (Falls back to restaurant profile logo)",
        type: "image",
      },
      {
        id: "slot_hero_burger",
        field: "image_slots.hero_burger",
        slotId: "hero_burger",
        label: "Hero Highlight Burger Artwork",
        description: "1:1 / 4:3 (Displays on top smash burger banner)",
        type: "image",
      },
      {
        id: "slot_deal_combo",
        field: "image_slots.deal_combo",
        slotId: "deal_combo",
        label: "Today's Craving Deal Combo",
        description: "16:9 / 4:3 (Displays on Today's Craving deal card)",
        type: "image",
      },
      {
        id: "slot_info_ambience",
        field: "image_slots.info_ambience",
        slotId: "info_ambience",
        label: "Info & Kitchen Photo",
        description: "16:9 Landscape (Displays on Info & Story tab)",
        type: "image",
      },
    ],
  },
  {
    id: "layout_sections",
    title: "Menu Showcase Sections",
    description: "Configure promo banners, featured specials, and category bars.",
    controls: [
      {
        id: "layout_hero_highlight",
        field: "layout.show_hero_highlight",
        label: "Hero Highlight Banner",
        description: "Display top Smash Burgers / Hot & Fresh showcase card",
        type: "toggle",
      },
      {
        id: "layout_featured",
        field: "layout.show_featured",
        label: "Featured Dishes Section",
        description: "Display top 3 bestseller / popular dishes carousel",
        type: "toggle",
      },
      {
        id: "layout_category_icons",
        field: "layout.show_category_icons",
        label: "Circular Category Avatars",
        description: "Display circular icon badges for quick food navigation",
        type: "toggle",
      },
      {
        id: "layout_deal_combo",
        field: "layout.show_deal_combo",
        label: "Today's Craving Deal Card",
        description: "Display promotional daily combo deal card",
        type: "toggle",
      },
      {
        id: "layout_search",
        field: "layout.show_search",
        label: "Search Bar",
        description: "Enable typo-tolerant fast food search",
        type: "toggle",
      },
    ],
  },
  {
    id: "info_settings",
    title: "Restaurant Info & Story",
    description: "Customize which details and sections appear on the Info tab.",
    controls: [
      {
        id: "info_show_ambience_photo",
        field: "info.show_ambience_photo",
        label: "Ambience Photo Banner",
        description: "Display top restaurant kitchen & venue photo",
        type: "toggle",
      },
      {
        id: "info_show_hours",
        field: "info.show_hours",
        label: "Opening Hours",
        description: "Display operating schedule and live open status",
        type: "toggle",
      },
      {
        id: "info_show_location",
        field: "info.show_location",
        label: "Address & Maps",
        description: "Display location address and Google Maps button",
        type: "toggle",
      },
      {
        id: "info_show_contact",
        field: "info.show_contact",
        label: "Phone Contact",
        description: "Display direct phone number and call button",
        type: "toggle",
      },
      {
        id: "info_show_whatsapp",
        field: "info.show_whatsapp",
        label: "WhatsApp Chat",
        description: "Display direct WhatsApp chat button",
        type: "toggle",
      },
      {
        id: "info_show_social_links",
        field: "info.show_social_links",
        label: "Social Media Channels",
        description: "Display Instagram, Facebook, and TikTok channels",
        type: "toggle",
      },
      {
        id: "info_show_wifi",
        field: "info.show_wifi",
        label: "Guest Wi-Fi Details",
        description: "Display Wi-Fi network and copyable password",
        type: "toggle",
      },
      {
        id: "info_show_about",
        field: "info.show_about",
        label: "About Us Story",
        description: "Display restaurant description and brand story",
        type: "toggle",
      },
    ],
  },
];
