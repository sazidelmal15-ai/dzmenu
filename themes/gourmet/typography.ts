/**
 * Gourmet Theme — Curated Typography Suites
 * 4 Distinct Restaurant Personalities: Fine Dining, Fast Casual / Burger, Artisan Café, Oriental Heritage.
 */

export interface TypographySuite {
  id: string;
  name: string;
  description: string;
  categoryTag: string;
  headingFont: string;       // Used for dish names, restaurant title, category titles (--dz-theme-font-serif)
  bodyFont: string;          // Used for descriptions, badges, meta info (--dz-theme-font-family)
  heroTitleSize?: string;    // Custom scale for main restaurant hero name
  heroTitleTracking?: string;// Letter spacing for hero name
  heroTitleLeading?: string; // Line height for hero name
}

export const GOURMET_TYPOGRAPHY_SUITES: Record<string, TypographySuite> = {
  classic_heritage: {
    id: "classic_heritage",
    name: "Classic Royal (Playfair + Amiri)",
    description: "Fine dining & luxury: elegant classic serif with royal harmony",
    categoryTag: "Fine Dining",
    headingFont: 'var(--font-playfair), "Playfair Display", var(--font-amiri), "Amiri", Georgia, serif',
    bodyFont: 'var(--font-outfit), "Outfit", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(1.875rem, 6vw, 2.25rem)",
    heroTitleTracking: "-0.01em",
    heroTitleLeading: "1.1",
  },
  burger_grill_punchy: {
    id: "burger_grill_punchy",
    name: "Street & Grill (Bebas Neue + Readex Pro)",
    description: "Burgers & smokehouses: bold, condensed, and energetic punchy font",
    categoryTag: "Fast Casual / Burgers",
    headingFont: 'var(--font-bebas), "Bebas Neue", var(--font-readex), "Readex Pro", sans-serif',
    bodyFont: 'var(--font-inter), "Inter", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(2.5rem, 9vw, 3.5rem)",
    heroTitleTracking: "0.02em",
    heroTitleLeading: "0.95",
  },
  modern_bistro_italian: {
    id: "modern_bistro_italian",
    name: "Modern Bistro (Cinzel + Alexandria)",
    description: "Italian trattorias & bistros: Roman luxury stone-carved serif with modern Arabic geometry",
    categoryTag: "Italian & Bistro",
    headingFont: 'var(--font-cinzel), "Cinzel", var(--font-alexandria), "Alexandria", serif',
    bodyFont: 'var(--font-jakarta), "Plus Jakarta Sans", var(--font-alexandria), "Alexandria", sans-serif',
    heroTitleSize: "clamp(1.875rem, 6vw, 2.35rem)",
    heroTitleTracking: "0.04em",
    heroTitleLeading: "1.05",
  },
  minimalist_lounge_cafe: {
    id: "minimalist_lounge_cafe",
    name: "Minimalist Lounge (Outfit + Alexandria)",
    description: "Specialty coffee & modern dining: ultra-clean modern geometric typography",
    categoryTag: "Café & Lounge",
    headingFont: 'var(--font-outfit), "Outfit", var(--font-alexandria), "Alexandria", sans-serif',
    bodyFont: 'var(--font-jakarta), "Plus Jakarta Sans", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(2rem, 6.5vw, 2.6rem)",
    heroTitleTracking: "-0.01em",
    heroTitleLeading: "1.05",
  },
  mediterranean_heritage: {
    id: "mediterranean_heritage",
    name: "Mediterranean Heritage (Cormorant + Cairo)",
    description: "Seafood & oriental grills: delicate poetic serif with clean clear Arabic",
    categoryTag: "Mediterranean & Grill",
    headingFont: 'var(--font-cormorant), "Cormorant Garamond", var(--font-cairo), "Cairo", serif',
    bodyFont: 'var(--font-inter), "Inter", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(2rem, 6.5vw, 2.5rem)",
    heroTitleTracking: "0",
    heroTitleLeading: "1.1",
  },
};

export const GOURMET_TYPOGRAPHY_OPTIONS = Object.values(GOURMET_TYPOGRAPHY_SUITES).map((suite) => ({
  label: suite.name,
  value: suite.id,
  description: suite.description,
}));
