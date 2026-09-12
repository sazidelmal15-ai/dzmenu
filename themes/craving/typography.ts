/**
 * Craving Theme — Curated Fast-Casual Typography Suites
 *
 * Bold, high-energy typography pairings designed for Burgers, Pizza, Tacos,
 * Fried Chicken, and Street Food restaurants.
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

export const CRAVING_TYPOGRAPHY_SUITES: Record<string, TypographySuite> = {
  punchy_street: {
    id: "punchy_street",
    name: "Smash & Street (Outfit Bold + Readex)",
    description: "High-impact modern fast casual: bold geometry and punchy headings",
    categoryTag: "Burgers & Street Food",
    headingFont: 'var(--font-outfit), "Outfit", var(--font-readex), "Readex Pro", sans-serif',
    bodyFont: 'var(--font-inter), "Inter", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(2rem, 7vw, 2.75rem)",
    heroTitleTracking: "-0.02em",
    heroTitleLeading: "1.0",
  },
  bebas_grill: {
    id: "bebas_grill",
    name: "Industrial Grill (Bebas Neue + Cairo)",
    description: "Smokehouses & BBQ: tall condensed impactful all-caps display",
    categoryTag: "Smokehouse & BBQ",
    headingFont: 'var(--font-bebas), "Bebas Neue", var(--font-cairo), "Cairo", sans-serif',
    bodyFont: 'var(--font-inter), "Inter", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(2.5rem, 9vw, 3.5rem)",
    heroTitleTracking: "0.02em",
    heroTitleLeading: "0.95",
  },
  pizza_trattoria: {
    id: "pizza_trattoria",
    name: "Woodfire Pizza (Alexandria + Inter)",
    description: "Artisan pizzerias & tacos: clean crisp contemporary display",
    categoryTag: "Pizza & Tacos",
    headingFont: 'var(--font-alexandria), "Alexandria", var(--font-outfit), "Outfit", sans-serif',
    bodyFont: 'var(--font-inter), "Inter", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(1.875rem, 6vw, 2.4rem)",
    heroTitleTracking: "-0.01em",
    heroTitleLeading: "1.05",
  },
  diner_classic: {
    id: "diner_classic",
    name: "Retro American Diner (Cinzel + Plus Jakarta)",
    description: "Classic shake & burger diner: bold vintage charisma",
    categoryTag: "Classic Diner",
    headingFont: 'var(--font-cinzel), "Cinzel", var(--font-alexandria), "Alexandria", serif',
    bodyFont: 'var(--font-jakarta), "Plus Jakarta Sans", var(--font-cairo), "Cairo", sans-serif',
    heroTitleSize: "clamp(2rem, 6.5vw, 2.5rem)",
    heroTitleTracking: "0.01em",
    heroTitleLeading: "1.05",
  },
};

export const CRAVING_TYPOGRAPHY_OPTIONS = Object.values(CRAVING_TYPOGRAPHY_SUITES).map((suite) => ({
  label: suite.name,
  value: suite.id,
  description: suite.description,
}));
