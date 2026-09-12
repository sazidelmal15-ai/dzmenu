/**
 * Craving Theme — Designer Color Palettes
 *
 * Fast casual, high-energy, appetite-stimulating palettes.
 */

import type { PaletteOption } from "@/types/theme-contract";

export type CravingPaletteId =
  | "blaze_red"
  | "mustard_gold"
  | "flame_orange"
  | "cream_vintage";

export interface CravingPaletteColorTokens {
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

export interface CravingPaletteDefinition {
  id: CravingPaletteId;
  name: string;
  nameAr: string;
  description: string;
  colors: CravingPaletteColorTokens;
}

export const CRAVING_PALETTES: Record<CravingPaletteId, CravingPaletteDefinition> = {
  blaze_red: {
    id: "blaze_red",
    name: "Burger Red & Charcoal",
    nameAr: "أحمر البرجر والفحم الداكن",
    description: "Iconic burger red with mustard yellow accents over rich charcoal noir",
    colors: {
      primary: "#C5221F",
      accent: "#F4B400",
      secondary: "#7A1210",
      background: "#121214",
      surface: "#1A1A1E",
      surfaceRaised: "#24242A",
      text: "#FAF7F2",
      muted: "#A19E9A",
      border: "rgba(255, 255, 255, 0.08)",
    },
  },
  mustard_gold: {
    id: "mustard_gold",
    name: "Mustard Gold & Obsidian",
    nameAr: "الأصفر الخردلي والأوبسيديان",
    description: "High-energy mustard yellow with burger red accents over dark obsidian",
    colors: {
      primary: "#F4B400",
      accent: "#C5221F",
      secondary: "#855F00",
      background: "#101012",
      surface: "#18181C",
      surfaceRaised: "#222228",
      text: "#FAF7F2",
      muted: "#A19E9A",
      border: "rgba(244, 180, 0, 0.15)",
    },
  },
  flame_orange: {
    id: "flame_orange",
    name: "Flame Orange & Smoke",
    nameAr: "برتقالي ناري ودخاني",
    description: "Vibrant high-energy tangerine flame with warm ember highlights",
    colors: {
      primary: "#FF6B2E",
      accent: "#F59E0B",
      secondary: "#A33600",
      background: "#110F0E",
      surface: "#1B1614",
      surfaceRaised: "#26201D",
      text: "#FAF7F2",
      muted: "#A8A09C",
      border: "rgba(255, 107, 46, 0.15)",
    },
  },
  cream_vintage: {
    id: "cream_vintage",
    name: "Vintage Cream & Red",
    nameAr: "كريمي عاجي وأحمر كلاسيكي",
    description: "Warm linen cream canvas with iconic fast-casual burger red and yellow",
    colors: {
      primary: "#C5221F",
      accent: "#F4B400",
      secondary: "#8B1412",
      background: "#FAF7F2",
      surface: "#FFFFFF",
      surfaceRaised: "#F3ECE2",
      text: "#1C1917",
      muted: "#78716C",
      border: "rgba(0, 0, 0, 0.08)",
    },
  },
};

export const CRAVING_PALETTE_OPTIONS: PaletteOption[] = Object.values(CRAVING_PALETTES).map(
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
