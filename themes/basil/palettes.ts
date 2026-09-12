/**
 * Basil Theme — Designer Color Palettes
 *
 * Fresh organic, botanical green, and sun-drenched rustic Italian harmonies
 * tailored for farm-to-table bistros, woodfired pizzerias, and trattorias.
 */

import type { PaletteOption } from "@/types/theme-contract";

export type BasilPaletteId =
  | "toscana_olive"
  | "sun_terracotta"
  | "fresh_basil"
  | "mediterranean_azure"
  | "botanical_dark";

export interface BasilPaletteColorTokens {
  primary: string;
  accent: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  muted: string;
  border: string;
}

export interface BasilPaletteDefinition {
  id: BasilPaletteId;
  name: string;
  nameAr: string;
  description: string;
  colors: BasilPaletteColorTokens;
}

export const BASIL_PALETTES: Record<BasilPaletteId, BasilPaletteDefinition> = {
  toscana_olive: {
    id: "toscana_olive",
    name: "Toscana Olive",
    nameAr: "زيتون توسكانا",
    description: "Rustic olive grove green with sunlit Italian stone warmth",
    colors: {
      primary: "#15803D",
      accent: "#16A34A",
      secondary: "#14532D",
      background: "#F4FBF7",
      surface: "#FFFFFF",
      surfaceRaised: "#EBF7F0",
      text: "#064E3B",
      muted: "#047857",
      border: "rgba(21, 128, 61, 0.2)",
    },
  },
  sun_terracotta: {
    id: "sun_terracotta",
    name: "Woodfired Terracotta",
    nameAr: "تراكوتا حطبية",
    description: "Warm brick oven terracotta with fresh garden herb tones",
    colors: {
      primary: "#C2410C",
      accent: "#EA580C",
      secondary: "#7C2D12",
      background: "#FFF8F3",
      surface: "#FFFFFF",
      surfaceRaised: "#FDF0E6",
      text: "#431407",
      muted: "#9A3412",
      border: "rgba(194, 65, 12, 0.2)",
    },
  },
  fresh_basil: {
    id: "fresh_basil",
    name: "Garden Basil",
    nameAr: "ريحان طازج",
    description: "Crisp emerald garden basil with refreshing botanical brightness",
    colors: {
      primary: "#059669",
      accent: "#10B981",
      secondary: "#064E3B",
      background: "#F0FDF4",
      surface: "#FFFFFF",
      surfaceRaised: "#DCFCE7",
      text: "#064E3B",
      muted: "#047857",
      border: "rgba(5, 150, 105, 0.2)",
    },
  },
  mediterranean_azure: {
    id: "mediterranean_azure",
    name: "Amalfi Azure",
    nameAr: "أزرق أمالفي",
    description: "Amalfi coast sea breeze cyan with lemon grove yellow highlights",
    colors: {
      primary: "#0284C7",
      accent: "#F59E0B",
      secondary: "#075985",
      background: "#F0F9FF",
      surface: "#FFFFFF",
      surfaceRaised: "#E0F2FE",
      text: "#0C4A6E",
      muted: "#0369A1",
      border: "rgba(2, 132, 199, 0.2)",
    },
  },
  botanical_dark: {
    id: "botanical_dark",
    name: "Night Herbarium",
    nameAr: "حديقة ليلية",
    description: "Atmospheric dark pine and cedar canvas with vibrant herbal glow",
    colors: {
      primary: "#10B981",
      accent: "#34D399",
      secondary: "#064E3B",
      background: "#0A110D",
      surface: "#131F18",
      surfaceRaised: "#1C2E24",
      text: "#F0FDF4",
      muted: "#9CA3AF",
      border: "rgba(16, 185, 129, 0.22)",
    },
  },
};

export const BASIL_PALETTE_OPTIONS: PaletteOption[] = Object.values(BASIL_PALETTES).map(
  (p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    description: p.description,
    colors: {
      primary: p.colors.primary,
      accent: p.colors.accent,
      secondary: p.colors.secondary,
      background: p.colors.background,
      surface: p.colors.surface,
      surfaceRaised: p.colors.surfaceRaised,
      text: p.colors.text,
      muted: p.colors.muted,
      border: p.colors.border,
    },
  })
);
