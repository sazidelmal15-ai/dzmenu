/**
 * Noir Theme — Declarative Editor Controls Definition
 */

import type { EditorControlGroup } from "@/types/theme-contract";
import { NOIR_PALETTE_OPTIONS } from "./palettes";

export const NOIR_EDITOR_CONTROLS: EditorControlGroup[] = [
  {
    id: "brand_palette",
    title: "Color Palette",
    description: "Choose a deep obsidian & luminous glow harmony for your luxury lounge.",
    controls: [
      {
        id: "theme_palette",
        field: "paletteId",
        label: "Color Harmony",
        type: "palette",
        options: NOIR_PALETTE_OPTIONS,
      },
    ],
  },
  {
    id: "typography",
    title: "Typography",
    description: "Select clean modern or editorial fonts for a high-end luxury menu.",
    controls: [
      {
        id: "type_font_family",
        field: "typography.font_family",
        label: "Font Family",
        type: "font",
        category: "heading",
      },
      {
        id: "type_heading_weight",
        field: "typography.heading_weight",
        label: "Heading Weight",
        type: "select",
        options: [
          { label: "Medium (500)", value: "medium" },
          { label: "Bold (700)", value: "bold" },
          { label: "Black (900)", value: "black" },
        ],
      },
      {
        id: "type_base_size",
        field: "typography.base_font_size",
        label: "Base Font Size",
        type: "slider",
        min: 14,
        max: 20,
        step: 1,
        unit: "px",
      },
    ],
  },
  {
    id: "layout_styles",
    title: "Layout & Presentation",
    description: "Configure frosted glass navigation tabs and cinematic hero cards.",
    controls: [
      {
        id: "layout_cat_style",
        field: "layout.category_style",
        label: "Category Navigation Style",
        type: "select",
        options: [
          { label: "Frosted Glass Tabs", value: "glass" },
          { label: "Minimalist Line", value: "minimalist_line" },
          { label: "Story Avatars", value: "stories" },
        ],
      },
      {
        id: "layout_card_style",
        field: "layout.card_style",
        label: "Dish Card Structure",
        type: "select",
        options: [
          { label: "Cinematic Hero Cards", value: "cinematic_hero" },
          { label: "Luxury Editorial Row", value: "luxury_row" },
        ],
      },
      {
        id: "layout_card_radius",
        field: "layout.card_radius",
        label: "Card Corner Radius",
        type: "slider",
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
      },
      {
        id: "layout_header_banner",
        field: "layout.show_header_banner",
        label: "Show Lounge Cover Banner",
        type: "toggle",
      },
      {
        id: "layout_search",
        field: "layout.show_search",
        label: "Show Search Bar",
        type: "toggle",
      },
      {
        id: "layout_all_cat",
        field: "layout.show_all_category",
        label: "Show 'All Menu' Tab",
        type: "toggle",
      },
    ],
  },
  {
    id: "media_slots",
    title: "Custom Artwork",
    description: "Upload bespoke ambient photography for your lounge.",
    controls: [
      {
        id: "slot_hero_cover",
        field: "image_slots.hero_cover",
        slotId: "hero_cover",
        label: "Lounge Hero Artwork",
        description: "Panoramic artwork behind lounge branding (16:9)",
        type: "image",
      },
      {
        id: "slot_ambient_cover",
        field: "image_slots.ambient_cover",
        slotId: "ambient_cover",
        label: "Ambient Background Artwork",
        description: "Atmospheric full-bleed dark artwork (9:16)",
        type: "image",
      },
    ],
  },
];
