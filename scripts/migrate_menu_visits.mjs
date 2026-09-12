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
    console.log("Connecting to PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully.");

    await client.query("BEGIN;");

    // 1. Create menu_visits table
    console.log("Creating menu_visits table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        source VARCHAR(20) NOT NULL CHECK (source IN ('qr', 'share', 'direct')),
        table_number VARCHAR(50),
        session_id VARCHAR(100) NOT NULL,
        device_type VARCHAR(20) DEFAULT 'mobile' CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Create optimized performance indexes for multi-tenant analytics
    console.log("Creating indexes on menu_visits...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_menu_visits_rest_created 
        ON menu_visits(restaurant_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_menu_visits_rest_source_created 
        ON menu_visits(restaurant_id, source, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_menu_visits_rest_table 
        ON menu_visits(restaurant_id, table_number, created_at DESC) 
        WHERE table_number IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_menu_visits_rest_session_created 
        ON menu_visits(restaurant_id, session_id, created_at DESC);
    `);

    // 3. Create restaurant_qr_settings table
    console.log("Creating restaurant_qr_settings table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_qr_settings (
        restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query("COMMIT;");
    console.log("Migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
