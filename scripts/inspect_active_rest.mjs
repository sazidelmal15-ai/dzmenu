import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const client = new Client({
  connectionString
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT id, name, sort_order, is_active, deleted_at, icon
    FROM categories
    WHERE restaurant_id = 'd90cadcc-305a-4057-aeba-3dc50ddba1a3'
    ORDER BY sort_order ASC, created_at ASC;
  `);
  console.log(`Active restaurant has ${res.rows.length} categories:`);
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
