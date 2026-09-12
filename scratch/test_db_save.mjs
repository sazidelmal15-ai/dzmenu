import pg from "pg";
import { THEME_REGISTRY } from "../themes/registry.ts";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const themeId = "ccf35b82-5846-4e4d-b91f-82a3ff9d1841"; // Crema theme
  
  // 1. Get current row
  const current = await pool.query("SELECT * FROM restaurant_themes WHERE id = $1", [themeId]);
  console.log("Current row settings in DB:", current.rows[0].settings);

  // 2. Validate using Crema package
  const reg = THEME_REGISTRY["crema"];
  const mod = await reg.loadPackage();
  const pkg = mod.default || mod.cremaPackage;

  // Suppose user changes greeting.title to "Hello Salem" and paletteId to "velvet_crema"
  const newSettings = {
    paletteId: "velvet_crema",
    splash: {
      enabled: true,
      title: "Sweet Moments Special",
      subtitle: "DESSERTS & CAFÉ",
      auto_dismiss_seconds: 3
    },
    greeting: {
      title: "Hello Salem",
      subtitle: "Good Morning"
    },
    typography: {
      font_family: "Playfair Display",
      heading_weight: "bold",
      base_font_size: 16
    },
    layout: {
      category_style: "minimal_icons",
      card_style: "cafe_grid",
      card_radius: 22,
      show_header_banner: true,
      show_all_category: false,
      show_search: true
    },
    image_slots: {}
  };

  const validated = pkg.validateSettings(newSettings);
  console.log("Validated settings:", validated);

  // Test updating in DB
  await pool.query(
    "UPDATE restaurant_themes SET settings = $1::jsonb, updated_at = NOW() WHERE id = $2",
    [JSON.stringify(validated), themeId]
  );

  // Read back
  const readBack = await pool.query("SELECT * FROM restaurant_themes WHERE id = $1", [themeId]);
  console.log("Read back from DB:", readBack.rows[0].settings);

  await pool.end();
}

main().catch(console.error);
