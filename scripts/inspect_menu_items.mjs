import pg from "pg";
import fs from "fs";
import path from "path";

const { Client } = pg;

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          let val = trimmed.substring("DATABASE_URL=".length).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          return val;
        }
      }
    }
  }
  return null;
}

const connectionString = loadEnv();
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  const restRes = await client.query(`
    SELECT r.id, r.name, r.slug, COUNT(mi.id) as item_count
    FROM restaurants r
    LEFT JOIN menu_items mi ON mi.restaurant_id = r.id AND mi.deleted_at IS NULL
    GROUP BY r.id, r.name, r.slug;
  `);
  console.log("Restaurants and their item counts:");
  console.table(restRes.rows);

  const itemsRes = await client.query(`
    SELECT mi.id, mi.name, mi.price, mi.badge, mi.tags, r.name as restaurant_name
    FROM menu_items mi
    JOIN restaurants r ON r.id = mi.restaurant_id
    WHERE mi.deleted_at IS NULL
    LIMIT 20;
  `);
  console.log("Sample Active Items:");
  console.table(itemsRes.rows);

  await client.end();
}

run().catch(console.error);
