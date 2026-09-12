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
    SELECT id, restaurant_id, name, sort_order, is_active, deleted_at, icon
    FROM categories
    ORDER BY sort_order ASC, name ASC;
  `);
  console.log(`Total categories in DB: ${res.rows.length}`);
  console.table(res.rows.map(r => ({
    name: r.name,
    sort_order: r.sort_order,
    is_active: r.is_active,
    deleted_at: r.deleted_at ? 'DELETED' : 'ACTIVE',
    icon: r.icon?.substring(0, 10)
  })));
  await client.end();
}

main().catch(console.error);
