import pg from 'pg';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const connectionString = process.env.DATABASE_URL.replace(':6543', ':5432');
const client = new pg.Client({ connectionString });

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL. Running availability migration...');

  await client.query(`
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS availability VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE';

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_menu_items_availability'
      ) THEN
        ALTER TABLE menu_items ADD CONSTRAINT chk_menu_items_availability CHECK (availability IN ('AVAILABLE', 'SOLD_OUT', 'HIDDEN'));
      END IF;
    END $$;

    -- Backfill existing data
    UPDATE menu_items SET availability = 'HIDDEN' WHERE is_visible = FALSE OR is_available = FALSE;
    UPDATE menu_items SET availability = 'AVAILABLE' WHERE is_visible = TRUE AND (is_available IS TRUE OR is_available IS NULL);

    CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON menu_items(restaurant_id, availability) WHERE deleted_at IS NULL;
  `);

  console.log('✅ Migration applied successfully!');

  const res = await client.query(`
    SELECT availability, is_visible, is_available, (deleted_at IS NOT NULL) AS is_deleted, COUNT(*) 
    FROM menu_items 
    GROUP BY availability, is_visible, is_available, (deleted_at IS NOT NULL)
  `);
  console.table(res.rows);

  await client.end();
}

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
