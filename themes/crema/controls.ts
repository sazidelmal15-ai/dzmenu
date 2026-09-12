/**
 * Crema Theme — Declarative Editor Controls Definition
 */

import type { EditorControlGroup } from "@/types/theme-contract";
import { CREMA_PALETTE_OPTIONS } from "./palettes";

export const CREMA_EDITOR_CONTROLS: EditorControlGroup[] = [
  {
    id: "brand_palette",
    title: "Color Palette",
    description: "Choose an artisan color harmony for your bakery or café.",
    controls: [
      {
        id: "theme_palette",
        field: "paletteId",
        label: "Color Harmony",
        type: "palette",
        options: CREMA_PALETTE_OPTIONS,
      },
    ],
  },
  {
    id: "brand_logo",
    title: "Brand Logo & Identity",
    description: "Customize or override your restaurant logo specifically for Crema.",
    controls: [
      {
        id: "theme_logo_slot",
        field: "image_slots.logo",
        label: "Theme Logo",
        description: "1:1 Square (Falls back to default profile logo)",
        type: "image",
        slotId: "logo",
      },
    ],
  },
  {
    id: "splash_screen",
    title: "Splash Screen",
    description: "Opening animation and brand tagline.",
    controls: [
      {
        id: "splash_enabled",
        field: "splash.enabled",
        label: "Enable Splash Screen",
        type: "toggle",
      },
      {
        id: "splash_title",
        field: "splash.title",
        label: "Main Title",
        placeholder: "Sweet Moments",
        type: "text",
      },
      {
        id: "splash_subtitle",
        field: "splash.subtitle",
        label: "Subtitle",
        placeholder: "DESSERTS & CAFÉ",
        type: "text",
      },
    ],
  },
  {
    id: "greeting_header",
    title: "Header Greeting",
    description: "Greeting banner displayed at the top of the menu.",
    controls: [
      {
        id: "greet_title",
        field: "greeting.title",
        label: "Greeting Title",
        placeholder: "Hello",
        type: "text",
      },
      {
        id: "greet_morning",
        field: "greeting.morning_subtitle",
        label: "Morning Subtitle (AM)",
        placeholder: "Good Morning",
        type: "text",
      },
      {
        id: "greet_evening",
        field: "greeting.evening_subtitle",
        label: "Evening Subtitle (PM)",
        placeholder: "Good Evening",
        type: "text",
      },
    ],
  },
  {
    id: "footer_info",
    title: "Footer & Restaurant Info",
    description: "Configure bottom restaurant card, map directions, and contact links.",
    controls: [
      {
        id: "footer_show_card",
        field: "footer.show_info_card",
        label: "Show Restaurant Info Card",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "footer_show_directions",
        field: "footer.show_directions",
        label: "Show Directions Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_info_card", operator: "truthy" },
      },
      {
        id: "footer_directions_text",
        field: "footer.directions_button_text",
        label: "Directions Button Label",
        placeholder: "Get Directions",
        type: "text",
        visibleIf: { field: "footer.show_directions", operator: "truthy" },
        indent: true,
      },
      {
        id: "footer_show_hours",
        field: "footer.show_operating_hours",
        label: "Show Weekly Hours Accordion",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_info_card", operator: "truthy" },
      },
      {
        id: "footer_show_wifi",
        field: "footer.show_wifi_info",
        label: "Show Guest Wi-Fi Card",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_info_card", operator: "truthy" },
      },
      {
        id: "footer_show_social",
        field: "footer.show_social_links",
        label: "Show Social Media Links",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_info_card", operator: "truthy" },
      },
      {
        id: "footer_show_phone",
        field: "footer.show_phone",
        label: "Phone Call Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_social_links", operator: "truthy" },
        indent: true,
      },
      {
        id: "footer_show_whatsapp",
        field: "footer.show_whatsapp",
        label: "WhatsApp Chat Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_social_links", operator: "truthy" },
        indent: true,
      },
      {
        id: "footer_show_instagram",
        field: "footer.show_instagram",
        label: "Instagram Page Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_social_links", operator: "truthy" },
        indent: true,
      },
      {
        id: "footer_show_tiktok",
        field: "footer.show_tiktok",
        label: "TikTok Profile Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_social_links", operator: "truthy" },
        indent: true,
      },
      {
        id: "footer_show_facebook",
        field: "footer.show_facebook",
        label: "Facebook Page Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_social_links", operator: "truthy" },
        indent: true,
      },
      {
        id: "footer_show_share",
        field: "footer.show_share",
        label: "Share Menu Button",
        type: "toggle",
        defaultValue: true,
        visibleIf: { field: "footer.show_social_links", operator: "truthy" },
        indent: true,
      },
    ],
  },
];

