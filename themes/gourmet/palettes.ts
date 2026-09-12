/**
 * Gourmet Theme — Designer Color Palettes
 *
 * All palettes are immutable, human-designed color harmonies crafted
 * specifically for the Gourmet luxury dining theme.
 *
 * Restaurant merchants select a palette identity, but cannot freely
 * alter individual hex codes.
 */

import type { PaletteOption } from "@/types/theme-contract";

export type GourmetPaletteId =
  | "maison_olive"
  | "original"
  | "rose"
  | "midnight";

export interface GourmetPaletteColorTokens {
  primary: string;       // Primary brand color (buttons, active pills, badges)
  accent: string;        // Accent / highlight tone (rating stars, price highlights)
  secondary: string;     // Deep secondary tone (subtle gradients, badges)
  background: string;    // Canvas background
  surface: string;       // Card and modal surface
  surfaceRaised: string; // Elevated cards, input backgrounds
  text: string;          // Primary text (headings, dish titles)
  muted: string;         // Secondary text, descriptions, icons
  border: string;        // Hairline card/section borders
}

export interface GourmetPaletteDefinition {
  id: GourmetPaletteId;
  name: string;
  nameAr: string;
  description: string;
  colors: GourmetPaletteColorTokens;
}

export const GOURMET_PALETTES: Record<GourmetPaletteId, GourmetPaletteDefinition> = {
  maison_olive: {
    id: "maison_olive",
    name: "Maison Olive (Warm Ivory & Bronze)",
    nameAr: "ميزون أوليف (عاجي و برونزي)",
    description: "Mediterranean warm linen canvas with olive herbal accents and bronze typography",
    colors: {
      primary: "#5A6B48",
      accent: "#A47148",
      secondary: "#3A4A2D",
      background: "#FAF8F5",
      surface: "#FFFFFF",
      surfaceRaised: "#F3EFE8",
      text: "#1C1917",
      muted: "#78716C",
      border: "rgba(0, 0, 0, 0.07)",
    },
  },
  original: {
    id: "original",
    name: "Velvet Obsidian & Royal Gold",
    nameAr: "الأسود الملكي والذهب العتيق",
    description: "Deep obsidian velvet noir canvas with brushed champagne gold and warm satin stone highlights",
    colors: {
      primary: "#C5A059",
      accent: "#E2C37C",
      secondary: "#6B5325",
      background: "#0E0E10",
      surface: "#17171A",
      surfaceRaised: "#212126",
      text: "#FAF8F5",
      muted: "#9E9992",
      border: "rgba(197, 160, 89, 0.14)",
    },
  },
  rose: {
    id: "rose",
    name: "Rose Bordeaux",
    nameAr: "روز نوار",
    description: "Romantic blush rose with velvety bordeaux plum surface",
    colors: {
      primary: "#BE185D",
      accent: "#FB7185",
      secondary: "#881337",
      background: "#FAF7F8",
      surface: "#FFFFFF",
      surfaceRaised: "#F5EFF2",
      text: "#1E1216",
      muted: "#8A7980",
      border: "rgba(190, 24, 93, 0.10)",
    },
  },
  midnight: {
    id: "midnight",
    name: "Midnight Sapphire",
    nameAr: "أزرق منتصف الليل",
    description: "Celestial cyan and sapphire glow over deep oceanic navy",
    colors: {
      primary: "#0284C7",
      accent: "#38BDF8",
      secondary: "#0C4A6E",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surfaceRaised: "#F0F4F8",
      text: "#0F172A",
      muted: "#64748B",
      border: "rgba(2, 132, 199, 0.10)",
    },
  },
};

/**
 * Pre-formatted options ready for consumption by generic PaletteControl
 */
export const GOURMET_PALETTE_OPTIONS: PaletteOption[] = Object.values(GOURMET_PALETTES).map(
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
