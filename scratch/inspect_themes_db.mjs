import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const res = await pool.query("SELECT id, restaurant_id, preset_id, name, status, settings, updated_at FROM restaurant_themes ORDER BY updated_at DESC LIMIT 10;");
  console.log("Found rows:", res.rows.length);
  for (const r of res.rows) {
    console.log("=== Theme ID:", r.id, "Preset:", r.preset_id, "Name:", r.name, "Status:", r.status, "UpdatedAt:", r.updated_at);
    console.log("Settings in DB:", JSON.stringify(r.settings, null, 2));
  }
  await pool.end();
}

main().catch(console.error);
