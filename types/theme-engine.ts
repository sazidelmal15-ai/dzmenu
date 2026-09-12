/**
 * Theme Engine Type Definitions
 * Shopify-Grade Data Architecture for DZMenu
 */

export type ThemePresetId = "gourmet" | "craving" | "crema" | "noir" | "basil";

export type ThemeStatus = "draft" | "published";

export interface ThemeColors {
  primary: string;
  accent: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  text_secondary: string;
}

export interface ThemeTypography {
  font_family: string;
  heading_weight: "normal" | "medium" | "bold" | "black";
}

export interface ThemeLayoutSettings {
  category_style: "stories" | "minimal_icons" | "banner" | "card_badges" | "glass";
  card_style: "hero" | "grid_2col" | "compact_row";
  show_header_banner: boolean;
  show_all_category: boolean;
  show_cart_bar: boolean;
  show_search: boolean;
}

export interface ThemeSettingsV1 {
  schema_version: 1;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayoutSettings;
  custom_css?: string;
}

export interface ThemeBlock {
  id: string;
  type: string;
  enabled?: boolean;
  settings: Record<string, unknown>;
}

export interface ThemeSection {
  id: string;
  type: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  blocks: ThemeBlock[];
}

export interface RestaurantThemeRecord {
  id: string;
  restaurantId: string;
  presetId: ThemePresetId;
  name: string;
  status: ThemeStatus;
  settings: Record<string, unknown>;
  sections: ThemeSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Data-Driven Schema Controls (Shopify settings_schema.json Model)
export type SettingControlType = "color" | "font" | "select" | "boolean" | "range";

export interface ThemeSettingControl {
  id: string;
  label: string;
  type: SettingControlType;
  category: "colors" | "typography" | "layout";
  defaultValue: string | number | boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface SectionBlockDefinition {
  type: string;
  name: string;
  maxBlocks?: number;
  settings: ThemeSettingControl[];
}

export interface SectionDefinition {
  type: string;
  name: string;
  isUnique?: boolean;
  supportedBlocks: string[];
  settings: ThemeSettingControl[];
}

export interface ThemePresetDefinition {
  presetId: ThemePresetId;
  name: string;
  tagline: string;
  description: string;
  author: string;
  previewImage: string;
  defaultSettings: Record<string, unknown>;
  defaultSections: ThemeSection[];
  controls: ThemeSettingControl[];
  supportedSections: SectionDefinition[];
  supportedBlocks: Record<string, SectionBlockDefinition>;
}

// Sanitized CSS Output
export interface SafeThemeVariables {
  "--dz-primary": string;
  "--dz-accent": string;
  "--dz-secondary": string;
  "--dz-bg": string;
  "--dz-surface": string;
  "--dz-text": string;
  "--dz-text-secondary": string;
  "--dz-font-family": string;
}
