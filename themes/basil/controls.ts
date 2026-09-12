/**
 * Basil Theme — Declarative Editor Controls Definition
 */

import type { EditorControlGroup } from "@/types/theme-contract";
import { BASIL_PALETTE_OPTIONS } from "./palettes";

export const BASIL_EDITOR_CONTROLS: EditorControlGroup[] = [
  {
    id: "brand_palette",
    title: "Color Palette",
    description: "Choose a fresh organic or rustic Italian harmony for your menu.",
    controls: [
      {
        id: "theme_palette",
        field: "paletteId",
        label: "Color Harmony",
        type: "palette",
        options: BASIL_PALETTE_OPTIONS,
      },
    ],
  },
  {
    id: "typography",
    title: "Typography",
    description: "Select warm humanist fonts for an organic trattoria feel.",
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
          { label: "Regular (400)", value: "normal" },
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
    description: "Configure banner showcase navigation and artisan dish cards.",
    controls: [
      {
        id: "layout_cat_style",
        field: "layout.category_style",
        label: "Category Navigation Style",
        type: "select",
        options: [
          { label: "Banner Showcase", value: "banner" },
          { label: "Rustic Pills", value: "rustic_pills" },
          { label: "Story Avatars", value: "stories" },
        ],
      },
      {
        id: "layout_card_style",
        field: "layout.card_style",
        label: "Dish Card Structure",
        type: "select",
        options: [
          { label: "Artisan Cards", value: "artisan_card" },
          { label: "Trattoria List", value: "trattoria_list" },
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
        label: "Show Farm Cover Banner",
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
    description: "Upload bespoke harvest and oven photography.",
    controls: [
      {
        id: "slot_hero_cover",
        field: "image_slots.hero_cover",
        slotId: "hero_cover",
        label: "Farm Hero Artwork",
        description: "Panoramic banner behind restaurant branding (16:9)",
        type: "image",
      },
      {
        id: "slot_farm_story",
        field: "image_slots.farm_story",
        slotId: "farm_story",
        label: "Farm Provenance Artwork",
        description: "Artisan harvest or woodfired oven photo (16:9)",
        type: "image",
      },
    ],
  },
];
