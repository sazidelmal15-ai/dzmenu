import pg from "pg";
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

async function run() {
  if (!connectionString) {
    console.error("DATABASE_URL is required to run migration.");
    process.exit(1);
  }
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Applying migration to Supabase...");
    await pool.query(`
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) NULL;
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_starts_at TIMESTAMPTZ NULL;
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_ends_at TIMESTAMPTZ NULL;
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);
    console.log("Successfully migrated menu_items table!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
