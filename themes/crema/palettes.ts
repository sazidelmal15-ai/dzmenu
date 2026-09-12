/**
 * Crema Theme — Designer Color Palettes
 *
 * Distinctive, immersive artisan atmospheres.
 * Changing the palette transforms the entire menu experience.
 */

import type { PaletteOption } from "@/types/theme-contract";

export type CremaPaletteId =
  | "rose_patisserie"
  | "matcha_latte"
  | "velvet_crema"
  | "vanilla_bean";

export interface CremaPaletteColorTokens {
  primary: string;
  accent: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  muted: string;
  border: string;
  pillActiveBg: string;
  pillActiveText: string;
  pillInactiveBg: string;
  pillInactiveText: string;
  pillInactiveBorder: string;
  searchBg: string;
  searchBorder: string;
  priceColor: string;
  splashGradFrom: string;
  splashGradVia: string;
  splashGradTo: string;
  splashGlow1: string;
  splashGlow2: string;
}

export interface CremaPaletteDefinition {
  id: CremaPaletteId;
  name: string;
  nameAr: string;
  description: string;
  colors: CremaPaletteColorTokens;
}

export const CREMA_PALETTES: Record<CremaPaletteId, CremaPaletteDefinition> = {
  // 1. French Pastry & Rose Cream
  rose_patisserie: {
    id: "rose_patisserie",
    name: "Rose Pâtisserie",
    nameAr: "سويت مومنتس",
    description: "Pastry rose & raspberry cream",
    colors: {
      primary: "#E86BA3",
      accent: "#C94F8A",
      secondary: "#FAD7E6",
      background: "#FFF5F8",
      surface: "#FFFFFF",
      surfaceRaised: "#FFEBF2",
      text: "#381B26",
      muted: "#9E6B7C",
      border: "rgba(232, 107, 163, 0.22)",
      pillActiveBg: "#E86BA3",
      pillActiveText: "#FFFFFF",
      pillInactiveBg: "#FFFFFF",
      pillInactiveText: "#8A4B62",
      pillInactiveBorder: "#FAD7E6",
      searchBg: "#FFF0F4",
      searchBorder: "#FAD7E6",
      priceColor: "#E86BA3",
      splashGradFrom: "#FAD7E6",
      splashGradVia: "#FFF5F8",
      splashGradTo: "rgba(232, 107, 163, 0.25)",
      splashGlow1: "rgba(232, 107, 163, 0.20)",
      splashGlow2: "rgba(201, 79, 138, 0.18)",
    },
  },

  // 2. Ceremonial Matcha Sanctuary
  matcha_latte: {
    id: "matcha_latte",
    name: "Ceremonial Matcha",
    nameAr: "ماتشا احتفالية",
    description: "Japanese green & oat milk",
    colors: {
      primary: "#2D6A4F",
      accent: "#40916C",
      secondary: "#D8F3DC",
      background: "#F3F8F2",
      surface: "#FFFFFF",
      surfaceRaised: "#E8F4E6",
      text: "#1B4332",
      muted: "#4D775E",
      border: "rgba(45, 106, 79, 0.20)",
      pillActiveBg: "#2D6A4F",
      pillActiveText: "#FFFFFF",
      pillInactiveBg: "#FFFFFF",
      pillInactiveText: "#2D6A4F",
      pillInactiveBorder: "#D8F3DC",
      searchBg: "#EBF5EA",
      searchBorder: "#D0E8CE",
      priceColor: "#2D6A4F",
      splashGradFrom: "#D8F3DC",
      splashGradVia: "#F3F8F2",
      splashGradTo: "rgba(64, 145, 108, 0.25)",
      splashGlow1: "rgba(45, 106, 79, 0.20)",
      splashGlow2: "rgba(82, 183, 136, 0.18)",
    },
  },

  // 3. Velvet Crema & Specialty Coffee
  velvet_crema: {
    id: "velvet_crema",
    name: "Velvet Crema",
    nameAr: "كريمة مخملية",
    description: "Rich espresso & warm cream",
    colors: {
      primary: "#6F4E37",
      accent: "#B07D54",
      secondary: "#EADDCF",
      background: "#FAF5EE",
      surface: "#FFFFFF",
      surfaceRaised: "#F3E8DC",
      text: "#332014",
      muted: "#785843",
      border: "rgba(111, 78, 55, 0.20)",
      pillActiveBg: "#6F4E37",
      pillActiveText: "#FFFFFF",
      pillInactiveBg: "#FFFFFF",
      pillInactiveText: "#6F4E37",
      pillInactiveBorder: "#EADDCF",
      searchBg: "#F3E8DC",
      searchBorder: "#E2D0BE",
      priceColor: "#6F4E37",
      splashGradFrom: "#EADDCF",
      splashGradVia: "#FAF5EE",
      splashGradTo: "rgba(176, 125, 84, 0.25)",
      splashGlow1: "rgba(111, 78, 55, 0.20)",
      splashGlow2: "rgba(198, 139, 89, 0.18)",
    },
  },

  // 4. Vanilla Bean & Golden Caramel
  vanilla_bean: {
    id: "vanilla_bean",
    name: "Vanilla Bean",
    nameAr: "فانيليا كراميل",
    description: "Custard cream & golden caramel",
    colors: {
      primary: "#A65A12",
      accent: "#CF7B21",
      secondary: "#FCE7C8",
      background: "#FFFBF2",
      surface: "#FFFFFF",
      surfaceRaised: "#FAF0DC",
      text: "#361D04",
      muted: "#8C5E28",
      border: "rgba(166, 90, 18, 0.20)",
      pillActiveBg: "#A65A12",
      pillActiveText: "#FFFFFF",
      pillInactiveBg: "#FFFFFF",
      pillInactiveText: "#A65A12",
      pillInactiveBorder: "#FCE7C8",
      searchBg: "#FAF0DC",
      searchBorder: "#F5DEC0",
      priceColor: "#A65A12",
      splashGradFrom: "#FCE7C8",
      splashGradVia: "#FFFBF2",
      splashGradTo: "rgba(207, 123, 33, 0.25)",
      splashGlow1: "rgba(166, 90, 18, 0.20)",
      splashGlow2: "rgba(207, 123, 33, 0.18)",
    },
  },
};

export const CREMA_PALETTE_OPTIONS: PaletteOption[] = Object.values(CREMA_PALETTES).map(
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
