import { migrateThemeSettings } from "@/lib/themes/migrator";
import { resolveCremaRuntimeSettings } from "@/themes/crema/schema";

const userSettings = {
  paletteId: "matcha_latte",
  greeting: {
    title: "Bonjour",
    subtitle: "Bienvenue"
  },
  splash: {
    enabled: true,
    title: "Special Moments",
    subtitle: "CAFÉ",
    auto_dismiss_seconds: 3
  },
  typography: {
    font_family: "Outfit",
    heading_weight: "bold",
    base_font_size: 18
  },
  layout: {
    card_style: "cafe_grid",
    category_style: "minimal_icons",
    card_radius: 20,
    show_header_banner: true,
    show_all_category: false,
    show_search: true
  },
  image_slots: {
    splash_background: "https://example.com/pic.jpg"
  }
};

console.log("Input:", userSettings);
const migrated = resolveCremaRuntimeSettings(userSettings);
console.log("Migrated Crema:", JSON.stringify(migrated, null, 2));

const generalMigrated = migrateThemeSettings(userSettings, "crema");
console.log("General Migrated:", JSON.stringify(generalMigrated, null, 2));
