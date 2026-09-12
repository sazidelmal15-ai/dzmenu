import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required.");
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully.");

    await client.query("BEGIN;");

    // 1. Create restaurant_themes table
    console.log("Creating restaurant_themes table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_themes (
          id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
          restaurant_id UUID          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          preset_id     VARCHAR(50)   NOT NULL,
          name          VARCHAR(255)  NOT NULL,
          status        VARCHAR(20)   NOT NULL DEFAULT 'draft',
          settings      JSONB         NOT NULL DEFAULT '{
              "schema_version": 1,
              "colors": {
                  "primary": "#D97706",
                  "accent": "#F59E0B",
                  "secondary": "#78350F",
                  "background": "#FAF9F5",
                  "surface": "#FFFFFF",
                  "text": "#18181B",
                  "text_secondary": "#71717A"
              },
              "typography": {
                  "font_family": "Outfit",
                  "heading_weight": "bold"
              },
              "layout": {
                  "category_style": "stories",
                  "card_style": "hero",
                  "show_header_banner": true,
                  "show_cart_bar": true,
                  "show_search": true
              }
          }'::jsonb,
          sections      JSONB         NOT NULL DEFAULT '[
              {
                  "id": "header_01",
                  "type": "restaurant-header",
                  "enabled": true,
                  "settings": { "show_cover": true, "show_status_badge": true },
                  "blocks": [
                      { "id": "block_wifi_01", "type": "wifi-badge", "settings": { "style": "pill" } }
                  ]
              },
              {
                  "id": "categories_01",
                  "type": "category-bar",
                  "enabled": true,
                  "settings": { "style": "stories" },
                  "blocks": []
              },
              {
                  "id": "menu_body_01",
                  "type": "menu-body",
                  "enabled": true,
                  "settings": { "card_style": "hero" },
                  "blocks": []
              },
              {
                  "id": "cart_bar_01",
                  "type": "floating-cart",
                  "enabled": true,
                  "settings": { "accent": "brand" },
                  "blocks": []
              }
          ]'::jsonb,
          created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Indexes for restaurant_themes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurant_themes_restaurant 
          ON restaurant_themes(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_restaurant_themes_status 
          ON restaurant_themes(restaurant_id, status);
    `);

    // 3. Add active_theme_id to restaurants with ON DELETE RESTRICT (Active-Theme Deletion Protection)
    console.log("Adding active_theme_id to restaurants with ON DELETE RESTRICT...");
    await client.query(`
      ALTER TABLE restaurants 
          ADD COLUMN IF NOT EXISTS active_theme_id UUID NULL;
    `);

    // Check if foreign key constraint already exists before adding
    const fkCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'restaurants' 
        AND constraint_name = 'fk_restaurants_active_theme';
    `);

    if (fkCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE restaurants 
            ADD CONSTRAINT fk_restaurants_active_theme 
            FOREIGN KEY (active_theme_id) 
            REFERENCES restaurant_themes(id) 
            ON DELETE RESTRICT;
      `);
    }

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurants_active_theme 
          ON restaurants(active_theme_id);
    `);

    // 4. Backfill existing restaurants that lack an active_theme_id
    console.log("Backfilling existing restaurants without an active theme...");
    const existingRestaurants = await client.query(`
      SELECT id, name FROM restaurants WHERE active_theme_id IS NULL AND deleted_at IS NULL;
    `);

    console.log(`Found ${existingRestaurants.rows.length} restaurants requiring a default active theme.`);

    for (const r of existingRestaurants.rows) {
      // Create initial Gourmet theme instance
      const themeRes = await client.query(`
        INSERT INTO restaurant_themes (
          restaurant_id, preset_id, name, status, settings, sections
        ) VALUES (
          $1, 'gourmet', 'Gourmet Official', 'published',
          '{
            "schema_version": 1,
            "colors": {
              "primary": "#D97706",
              "accent": "#F59E0B",
              "secondary": "#78350F",
              "background": "#FAF9F5",
              "surface": "#FFFFFF",
              "text": "#18181B",
              "text_secondary": "#71717A"
            },
            "typography": {
              "font_family": "Outfit",
              "heading_weight": "bold"
            },
            "layout": {
              "category_style": "stories",
              "card_style": "hero",
              "show_header_banner": true,
              "show_cart_bar": true,
              "show_search": true
            }
          }'::jsonb,
          '[
            {
              "id": "header_01",
              "type": "restaurant-header",
              "enabled": true,
              "settings": { "show_cover": true, "show_status_badge": true },
              "blocks": [
                { "id": "block_wifi_01", "type": "wifi-badge", "settings": { "style": "pill" } }
              ]
            },
            {
              "id": "categories_01",
              "type": "category-bar",
              "enabled": true,
              "settings": { "style": "stories" },
              "blocks": []
            },
            {
              "id": "menu_body_01",
              "type": "menu-body",
              "enabled": true,
              "settings": { "card_style": "hero" },
              "blocks": []
            },
            {
              "id": "cart_bar_01",
              "type": "floating-cart",
              "enabled": true,
              "settings": { "accent": "brand" },
              "blocks": []
            }
          ]'::jsonb
        ) RETURNING id;
      `, [r.id]);

      const newThemeId = themeRes.rows[0].id;

      await client.query(`
        UPDATE restaurants SET active_theme_id = $1 WHERE id = $2;
      `, [newThemeId, r.id]);

      console.log(`Assigned default Gourmet theme (${newThemeId}) to restaurant ${r.name} (${r.id})`);
    }

    await client.query("COMMIT;");
    console.log("Theme migration completed successfully with 100% data integrity!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed, transaction rolled back:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
