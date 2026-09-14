/**
 * DZMenu Theme System V2 — Core Theme Contract & Presentation View Models
 *
 * This file defines the decoupled, presentation-ready contracts consumed by themes.
 * Themes DO NOT import raw database models directly.
 */

import React from "react";
import type { MenuItemAvailability } from "@/types/menu";

// ============================================================================
// 1. MENU PRESENTATION VIEW MODELS
// ============================================================================

export interface MenuRestaurantContactView {
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  address: string | null;
  city: string | null;
  googleMapsUrl: string | null;
}

export interface OperatingHourDaySchedule {
  id?: string;
  day?: string;
  label?: string;
  defaultOpen?: string;
  defaultClose?: string;
  open?: string;
  close?: string;
  isOpen?: boolean;
}

export interface MenuRestaurantScheduleView {
  alwaysOpen: boolean;
  isOpenNow: boolean;
  formattedHours: string;
  operatingHours: OperatingHourDaySchedule[];
  notice: string | null;
}

export interface MenuRestaurantWifiView {
  ssid: string | null;
  password: string | null;
}

export interface MenuRestaurantView {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  currency: string;
  currencySymbol: string;
  locale: string;
  logoUrl: string | null;
  coverUrl: string | null;
  cuisineTypes: string[];
  status?: string;
  contact: MenuRestaurantContactView;
  schedule: MenuRestaurantScheduleView;
  wifi: MenuRestaurantWifiView;
}

export interface MenuItemDietaryView {
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
}

export interface MenuItemVariantView {
  name: string;
  price?: number | string;
  isDefault?: boolean;
}

export interface MenuItemSizeView {
  name: string;
  price: number | string;
}

export interface ImageFramingMetadata {
  x: number;        // Pan offset X normalized percentage
  y: number;        // Pan offset Y normalized percentage
  zoom: number;     // Zoom scale (1.0 to 3.0)
  rotation: number; // Degrees (0, 90, 180, 270)
  aspectRatio?: number | string;
}

export interface MenuItemExtraView {
  name: string;
  price: number | string;
}

export interface MenuItemView {
  id: string;
  categoryId: string | null;
  categoryName?: string | null;
  name: string;
  description: string | null;
  price: number;
  formattedPrice: string;
  originalPrice?: number | null;
  formattedOriginalPrice?: string | null;
  hasActiveDiscount: boolean;
  discountPercentage?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  imageUrl: string | null;
  framing?: ImageFramingMetadata | null;
  availability: MenuItemAvailability;
  isSoldOut: boolean;
  isVisible: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  variants: MenuItemVariantView[];
  sizes: MenuItemSizeView[];
  extras: MenuItemExtraView[];
  badges: string[];
  badge?: string | null;
  tags?: string[];
  ingredients: string[];
  dietary: MenuItemDietaryView;
}

export interface MenuCategoryView {
  id: string;
  name: string;
  shortName?: string | null;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  items: MenuItemView[];
}

export interface MenuPresentationModel {
  restaurant: MenuRestaurantView;
  categories: MenuCategoryView[];
  featuredItems: MenuItemView[];
  totalItemCount: number;
}

// ============================================================================
// 2. PRESENTATION MODES & CAPABILITIES
// ============================================================================

export type PresentationMode =
  | "fullscreen_page"
  | "bottom_sheet"
  | "dialog_modal"
  | "inlined"
  | "none";

export interface PageCapability {
  supported: boolean;
  presentationModes: PresentationMode[];
  defaultMode: PresentationMode;
}

export interface ThemeCapabilities {
  splash: PageCapability;
  main: PageCapability;
  category: PageCapability;
  item: PageCapability;
}

// ============================================================================
// 3. IMAGE SLOTS SPECIFICATION
// ============================================================================

export type ImageSlotAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "1.35:1" | "1.4:1" | "1.8:1" | "free" | string;

export interface ImageSlotDeclaration {
  id: string;
  label: string;
  description?: string;
  aspectRatio: ImageSlotAspectRatio;
  recommendedWidth?: number;
  recommendedHeight?: number;
  defaultUrl: string | null;
  optional: boolean;
}

export interface ImageSlotRecord {
  url: string;
  assetId?: string;
  updatedAt?: string;
  framing?: ImageFramingMetadata | null;
}

// ============================================================================
// 4. DECLARATIVE SERIALIZABLE EDITOR CONTROLS & CONDITIONS
// ============================================================================

export type ComparisonOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "contains"
  | "truthy"
  | "falsy"
  | "greater_than"
  | "less_than";

export interface ConditionRule {
  field: string; // e.g. "hero.showBadge" or "header.sticky"
  operator: ComparisonOperator;
  value?: unknown;
}

export interface ConditionGroup {
  match: "all" | "any"; // AND / OR
  rules: (ConditionRule | ConditionGroup)[];
}

export type VisibilityCondition = ConditionRule | ConditionGroup;

export type ControlType =
  | "color"
  | "font"
  | "select"
  | "toggle"
  | "slider"
  | "text"
  | "image"
  | "segmented"
  | "palette";

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

export interface PaletteColorSwatches {
  primary: string;
  accent: string;
  secondary?: string;
  background: string;
  surface: string;
  surfaceRaised?: string;
  text?: string;
  muted?: string;
  border?: string;
}

export interface PaletteOption {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  colors: PaletteColorSwatches;
}

export interface BaseControl {
  id: string;
  field: string; // dot-notated path in settings, e.g. "layout.cardCornerRadius"
  label: string;
  description?: string;
  visibleIf?: VisibilityCondition;
  indent?: boolean;
}

export interface PaletteControl extends BaseControl {
  type: "palette";
  options: PaletteOption[];
}

export interface ColorControl extends BaseControl {
  type: "color";
  allowAlpha?: boolean;
}

export interface FontControl extends BaseControl {
  type: "font";
  category: "heading" | "body";
}

export interface SelectControl extends BaseControl {
  type: "select";
  options: SelectOption[];
}

export interface SegmentedControl extends BaseControl {
  type: "segmented";
  options: SelectOption[];
}

export interface ToggleControl extends BaseControl {
  type: "toggle";
  defaultValue?: boolean;
}

export interface SliderControl extends BaseControl {
  type: "slider";
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface TextControl extends BaseControl {
  type: "text";
  placeholder?: string;
}

export interface ImageSlotControl extends BaseControl {
  type: "image";
  slotId: string; // maps to declared ImageSlotDeclaration.id
}

export type EditorControl =
  | ColorControl
  | FontControl
  | SelectControl
  | SegmentedControl
  | ToggleControl
  | SliderControl
  | TextControl
  | ImageSlotControl
  | PaletteControl;

export interface EditorControlGroup {
  id: string;
  title: string;
  description?: string;
  controls: EditorControl[];
}

// ============================================================================
// 5. THEME MANIFEST (DECLARATIVE METADATA)
// ============================================================================

export interface ThemeManifest {
  id: string;
  name: string;
  description: string;
  author: string;
  themePackageVersion: string;   // SemVer: e.g. "2.0.0"
  settingsSchemaVersion: number; // Monotonic integer: e.g. 1
  capabilities: ThemeCapabilities;
  imageSlots: ImageSlotDeclaration[];
  defaultSettings: Record<string, unknown>;
}

// ============================================================================
// 6. THEME RENDER CONTEXT & PACKAGE STRUCTURE
// ============================================================================

export type ActiveThemeViewType = "splash" | "main" | "category" | "item";

export interface ActiveThemeViewState {
  view: ActiveThemeViewType;
  categoryId?: string;
  itemId?: string;
}

export interface ThemeNavigationActions {
  goToSplash: () => void;
  goToMain: () => void;
  goToCategory: (categoryId: string) => void;
  goToItem: (itemId: string) => void;
  closeModal: () => void;
}

export interface ThemeRenderContext<TSettings = Record<string, unknown>> {
  menu: MenuPresentationModel;
  settings: TSettings;
  imageSlots: Record<string, string | null>;
  activeView: ActiveThemeViewState;
  navigation: ThemeNavigationActions;
  isEditorPreview: boolean;
}

export type ThemeComponent<TSettings = Record<string, unknown>> =
  React.ComponentType<ThemeRenderContext<TSettings>>;

export interface ThemeTemplates {
  splash?: ThemeComponent;
  main: ThemeComponent;
  category?: ThemeComponent;
  item?: ThemeComponent;
}

export interface ThemePackage {
  manifest: ThemeManifest;
  validateSettings: (raw: unknown) => Record<string, unknown>;
  generateCssVariables: (settings: Record<string, unknown>) => Record<string, string>;
  editorControls: EditorControlGroup[];
  templates: ThemeTemplates;
}

export interface ThemeRegistration {
  manifest: ThemeManifest;
  loadPackage: () => Promise<{ default: ThemePackage }>;
}
