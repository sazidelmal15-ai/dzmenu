export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  category: "all" | "trending" | "fastfood" | "cafe" | "luxury" | "healthy" | "italian";
  description: string;
  accentColor: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondary: string;
  isDark: boolean;
  categoryLayout: "pills" | "stories" | "glass" | "compact";
  cardLayout: "hero" | "compact-row" | "grid-2col";
  fontFamily: string;
  bannerImage: string;
  tags: string[];
  features: string[];
  popular?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "gourmet",
    name: "Gourmet",
    tagline: "Warm Luxury & Fine Dining",
    category: "luxury",
    description: "Tailored for upscale restaurants, steak houses, and bistros with warm golden hues, serif typography, and premium card layouts.",
    accentColor: "#F59E0B",
    primaryColor: "#D97706",
    secondaryColor: "#78350F",
    backgroundColor: "#FAF9F5",
    surfaceColor: "#FFFFFF",
    textColor: "#18181B",
    textSecondary: "#71717A",
    isDark: false,
    categoryLayout: "stories",
    cardLayout: "hero",
    fontFamily: "Outfit, sans-serif",
    bannerImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    tags: ["Fine Dining", "Luxury", "Golden Warmth"],
    features: ["Story Avatars", "Hero Dish Cards", "Gold Badges"],
    popular: true,
  },
  {
    id: "craving",
    name: "Craving",
    tagline: "Bold High Energy & Fast Casual",
    category: "fastfood",
    description: "Electric red & blazing yellow energy designed to trigger appetite. High-impact dual-column product cards with quick action badges.",
    accentColor: "#EF4444",
    primaryColor: "#DC2626",
    secondaryColor: "#F59E0B",
    backgroundColor: "#FFFDFB",
    surfaceColor: "#FFFFFF",
    textColor: "#111827",
    textSecondary: "#6B7280",
    isDark: false,
    categoryLayout: "pills",
    cardLayout: "grid-2col",
    fontFamily: "Outfit, sans-serif",
    bannerImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    tags: ["Fast Food", "Burgers", "Bold Red"],
    features: ["Fast Order Grid", "Promo Chips", "Vibrant Tags"],
    popular: true,
  },
  {
    id: "crema",
    name: "Crema",
    tagline: "Earthy Warmth & Specialty Coffee",
    category: "cafe",
    description: "Subtle terracotta, velvety cream backgrounds, and clean compact rows designed for bakeries, brunch spots, and artisan cafés.",
    accentColor: "#B45309",
    primaryColor: "#92400E",
    secondaryColor: "#D97706",
    backgroundColor: "#FDF8F0",
    surfaceColor: "#FFFFFF",
    textColor: "#291809",
    textSecondary: "#7C5D41",
    isDark: false,
    categoryLayout: "stories",
    cardLayout: "compact-row",
    fontFamily: "Playfair Display, serif",
    bannerImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    tags: ["Café", "Bakery", "Cozy Earth"],
    features: ["Compact Rows", "Specialty Badges", "Warm Palette"],
    popular: true,
  },
  {
    id: "noir",
    name: "Noir",
    tagline: "Sleek Glassmorphism & Cocktail Lounges",
    category: "luxury",
    description: "Deep obsidian backdrop with neon amber reflections, frosted glass category tabs, and high-contrast photography showcase.",
    accentColor: "#F59E0B",
    primaryColor: "#EAB308",
    secondaryColor: "#38BDF8",
    backgroundColor: "#090D16",
    surfaceColor: "#131C2E",
    textColor: "#F8FAFC",
    textSecondary: "#94A3B8",
    isDark: true,
    categoryLayout: "glass",
    cardLayout: "hero",
    fontFamily: "Inter, sans-serif",
    bannerImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    tags: ["Dark Mode", "Lounge", "Glassmorphism"],
    features: ["Frosted Glass", "Dark UI", "Vibrant Glow"],
    popular: true,
  },
  {
    id: "basil",
    name: "Basil",
    tagline: "Fresh Organic & Woodfired Italian",
    category: "healthy",
    description: "Crisp emerald botanical tones and rustic Italian warmth that celebrate organic bowls, salads, and authentic artisan pizza.",
    accentColor: "#10B981",
    primaryColor: "#059669",
    secondaryColor: "#C2410C",
    backgroundColor: "#F4FBF7",
    surfaceColor: "#FFFFFF",
    textColor: "#064E3B",
    textSecondary: "#047857",
    isDark: false,
    categoryLayout: "pills",
    cardLayout: "hero",
    fontFamily: "Inter, sans-serif",
    bannerImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    tags: ["Organic", "Salads", "Eco Green"],
    features: ["Calorie Tags", "Vegan Badges", "Minimal Layout"],
  },
];
