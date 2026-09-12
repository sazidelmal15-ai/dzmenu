import pg from 'pg';
import fs from 'fs';
import { performance } from 'perf_hooks';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  }
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("Testing direct Database Query Speeds (3 rounds)...");

  for (let r = 1; r <= 3; r++) {
    console.log(`\n--- Round ${r} ---`);
    // Test 1: Fetch Restaurant by slug
    const t0 = performance.now();
    const restRes = await pool.query("SELECT * FROM restaurants WHERE slug = $1 LIMIT 1", ["salem"]);
    const t1 = performance.now();
    console.log(`1. Fetch Restaurant: ${Math.round((t1 - t0) * 10) / 10} ms`);

    // Test 2: Fetch Categories
    const restaurantId = restRes.rows[0]?.id;
    const t2 = performance.now();
    const catRes = await pool.query("SELECT * FROM categories WHERE restaurant_id = $1 ORDER BY sort_order ASC", [restaurantId]);
    const t3 = performance.now();
    console.log(`2. Fetch Categories (${catRes.rows.length} categories): ${Math.round((t3 - t2) * 10) / 10} ms`);

    // Test 3: Fetch Menu Items
    const t4 = performance.now();
    const itemRes = await pool.query("SELECT * FROM menu_items WHERE restaurant_id = $1 AND deleted_at IS NULL", [restaurantId]);
    const t5 = performance.now();
    console.log(`3. Fetch Menu Items (${itemRes.rows.length} items): ${Math.round((t5 - t4) * 10) / 10} ms`);

    const totalDb = (t1 - t0) + (t3 - t2) + (t5 - t4);
    console.log(`-> Round ${r} Total DB Execution Time: ${Math.round(totalDb * 10) / 10} ms`);
  }

  await pool.end();
}

run();
