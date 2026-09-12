/**
 * Noir Theme — Designer Color Palettes
 *
 * Sleek glassmorphism, luminous neon reflections, and deep obsidian canvases
 * tailored for fine dining, omakase, and cocktail lounges.
 */

import type { PaletteOption } from "@/types/theme-contract";

export type NoirPaletteId =
  | "obsidian_gold"
  | "neon_cyan"
  | "royal_amethyst"
  | "emerald_lounge"
  | "crimson_velvet";

export interface NoirPaletteColorTokens {
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

export interface NoirPaletteDefinition {
  id: NoirPaletteId;
  name: string;
  nameAr: string;
  description: string;
  colors: NoirPaletteColorTokens;
}

export const NOIR_PALETTES: Record<NoirPaletteId, NoirPaletteDefinition> = {
  obsidian_gold: {
    id: "obsidian_gold",
    name: "Obsidian Gold",
    nameAr: "أوبسيديان ذهبي",
    description: "Deep nocturne canvas with luminous champagne gold glow",
    colors: {
      primary: "#F59E0B",
      accent: "#FBBF24",
      secondary: "#78350F",
      background: "#080B11",
      surface: "#111622",
      surfaceRaised: "#182030",
      text: "#F8FAFC",
      muted: "#94A3B8",
      border: "rgba(245, 158, 11, 0.25)",
    },
  },
  neon_cyan: {
    id: "neon_cyan",
    name: "Cyber Lounge Cyan",
    nameAr: "نيون سايان لاونج",
    description: "Electric cyan reflections over frosted midnight glass",
    colors: {
      primary: "#06B6D4",
      accent: "#38BDF8",
      secondary: "#0E7490",
      background: "#070D18",
      surface: "#0F172A",
      surfaceRaised: "#1E293B",
      text: "#F8FAFC",
      muted: "#94A3B8",
      border: "rgba(6, 182, 212, 0.25)",
    },
  },
  royal_amethyst: {
    id: "royal_amethyst",
    name: "Royal Amethyst",
    nameAr: "جمشت ملكي",
    description: "Rich velvet plum and violet luminescence over pure noir",
    colors: {
      primary: "#A855F7",
      accent: "#C084FC",
      secondary: "#581C87",
      background: "#0F0A17",
      surface: "#1A1226",
      surfaceRaised: "#261B38",
      text: "#FDF4FF",
      muted: "#A8A29E",
      border: "rgba(168, 85, 247, 0.25)",
    },
  },
  emerald_lounge: {
    id: "emerald_lounge",
    name: "Emerald Lounge",
    nameAr: "لاونج الزمرد",
    description: "Dark pine forest and polished jade highlights with frosted depth",
    colors: {
      primary: "#10B981",
      accent: "#34D399",
      secondary: "#064E3B",
      background: "#081310",
      surface: "#10221B",
      surfaceRaised: "#173328",
      text: "#F0FDF4",
      muted: "#9CA3AF",
      border: "rgba(16, 185, 129, 0.25)",
    },
  },
  crimson_velvet: {
    id: "crimson_velvet",
    name: "Crimson Velvet",
    nameAr: "مخمل قرمزي",
    description: "Dramatic Baccarat red crystal glow over pitch black obsidian",
    colors: {
      primary: "#EF4444",
      accent: "#F43F5E",
      secondary: "#7F1D1D",
      background: "#0A0A0C",
      surface: "#141418",
      surfaceRaised: "#202026",
      text: "#FFFFFF",
      muted: "#A1A1AA",
      border: "rgba(239, 68, 68, 0.25)",
    },
  },
};

export const NOIR_PALETTE_OPTIONS: PaletteOption[] = Object.values(NOIR_PALETTES).map(
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
