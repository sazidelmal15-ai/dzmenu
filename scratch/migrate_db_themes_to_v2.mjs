import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_V2_SETTINGS = {
  gourmet: {
    paletteId: "original",
    typography: { font_family: "Outfit", heading_weight: "bold", base_font_size: 16 },
    layout: { category_style: "stories", card_style: "hero", show_header_banner: true, show_all_category: true, show_cart_bar: true, show_search: true, card_radius: 16 },
    image_slots: {}
  },
  craving: {
    paletteId: "blaze_red",
    typography: { font_family: "Outfit", heading_weight: "black", base_font_size: 16 },
    layout: { category_style: "card_badges", card_style: "grid_2col", card_radius: 18, show_header_banner: true, show_all_category: true, show_cart_bar: true, show_search: true, show_promo_banner: true },
    image_slots: {}
  },
  crema: {
    paletteId: "rose_patisserie",
    splash: { enabled: true, title: "Sweet Moments", subtitle: "DESSERTS & CAFÉ", auto_dismiss_seconds: 2.5 },
    greeting: { title: "Hello", subtitle: "Good Morning" },
    typography: { font_family: "Playfair Display", heading_weight: "bold", base_font_size: 16 },
    layout: { category_style: "minimal_icons", card_style: "cafe_grid", card_radius: 22, show_header_banner: true, show_all_category: false, show_search: true },
    image_slots: {}
  },
  noir: {
    paletteId: "obsidian_gold",
    typography: { font_family: "Inter", heading_weight: "bold", base_font_size: 16 },
    layout: { category_style: "glass", card_style: "cinematic_hero", card_radius: 20, show_header_banner: true, show_all_category: true, show_cart_bar: true, show_search: true },
    image_slots: {}
  },
  basil: {
    paletteId: "toscana_olive",
    typography: { font_family: "Outfit", heading_weight: "bold", base_font_size: 16 },
    layout: { category_style: "banner", card_style: "artisan_card", card_radius: 18, show_header_banner: true, show_all_category: true, show_cart_bar: true, show_search: true },
    image_slots: {}
  }
};

async function main() {
  const themes = await pool.query("SELECT id, preset_id, settings FROM restaurant_themes");
  console.log(`Migrating ${themes.rows.length} themes in DB...`);

  for (const t of themes.rows) {
    const preset = (t.preset_id || "gourmet").toLowerCase();
    const defaults = DEFAULT_V2_SETTINGS[preset] || DEFAULT_V2_SETTINGS.gourmet;
    const current = t.settings || {};

    // Merge defaults with existing settings if already V2
    const v2Settings = {
      ...defaults,
      ...current,
      typography: {
        ...defaults.typography,
        ...(current.typography || {})
      },
      layout: {
        ...defaults.layout,
        ...(current.layout || {})
      },
      image_slots: {
        ...(defaults.image_slots || {}),
        ...(current.image_slots || {})
      }
    };

    if (preset === "crema") {
      v2Settings.splash = { ...defaults.splash, ...(current.splash || {}) };
      v2Settings.greeting = { ...defaults.greeting, ...(current.greeting || {}) };
      if (!v2Settings.paletteId || v2Settings.paletteId === "original") {
        v2Settings.paletteId = "rose_patisserie";
      }
    }

    delete v2Settings.colors;
    delete v2Settings.schema_version;

    await pool.query(
      "UPDATE restaurant_themes SET settings = $1::jsonb, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(v2Settings), t.id]
    );

    console.log(`✅ Migrated theme ${t.id} (${preset})`);
  }

  console.log("Migration complete!");
  await pool.end();
}

main().catch(console.error);
