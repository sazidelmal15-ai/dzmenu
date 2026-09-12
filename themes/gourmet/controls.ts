/**
 * Gourmet Theme — Declarative Editor Controls Definition
 */

import type { EditorControlGroup } from "@/types/theme-contract";
import { GOURMET_PALETTE_OPTIONS } from "./palettes";
import { GOURMET_TYPOGRAPHY_OPTIONS } from "./typography";

export const GOURMET_EDITOR_CONTROLS: EditorControlGroup[] = [
  {
    id: "brand_palette",
    title: "Color Palette",
    description: "Choose a designer-crafted color harmony for your menu.",
    controls: [
      {
        id: "theme_palette",
        field: "paletteId",
        label: "Color Harmony",
        type: "palette",
        options: GOURMET_PALETTE_OPTIONS,
      },
    ],
  },
  {
    id: "brand_typography",
    title: "Typography Style",
    description: "Harmonious bilingual font pairings designed for luxury dining.",
    controls: [
      {
        id: "theme_typography_suite",
        field: "typographySuiteId",
        label: "Font Pairing",
        type: "select",
        options: GOURMET_TYPOGRAPHY_OPTIONS,
      },
    ],
  },
  {
    id: "brand_visuals",
    title: "Theme Visuals & Imagery",
    description: "Upload bespoke artwork and brand imagery specifically for this theme.",
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
        id: "slot_hero_cover",
        field: "image_slots.hero_cover",
        slotId: "hero_cover",
        label: "Hero Cover Photo",
        description: "16:9 Landscape (Displays at the top of main menu)",
        type: "image",
      },
      {
        id: "slot_info_ambience",
        field: "image_slots.info_ambience",
        slotId: "info_ambience",
        label: "Info & Ambience Photo",
        description: "16:9 Landscape (Displays at the top of Info & Story tab)",
        type: "image",
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
        description: "Display top interior ambience photo",
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
