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
    SELECT r.id, r.name, COUNT(c.id) as cat_count
    FROM restaurants r
    LEFT JOIN categories c ON c.restaurant_id = r.id
    GROUP BY r.id, r.name;
  `);
  console.log("Restaurants in DB:");
  console.table(res.rows);

  const activeRes = await client.query(`
    SELECT id, restaurant_id, name, sort_order, is_active, deleted_at, icon
    FROM categories
    WHERE restaurant_id = 'd90cadcc-305a-4057-aeba-3dc50ddba1a3'
    ORDER BY sort_order ASC, name ASC;
  `);
  console.log("Categories for active restaurant d90cadcc-305a-4057-aeba-3dc50ddba1a3:");
  console.table(activeRes.rows.map(r => ({
    id: r.id,
    name: r.name,
    sort_order: r.sort_order,
    is_active: r.is_active,
    deleted_at: r.deleted_at ? 'DELETED' : 'ACTIVE',
    icon: r.icon?.substring(0, 15)
  })));

  await client.end();
}

main().catch(console.error);
