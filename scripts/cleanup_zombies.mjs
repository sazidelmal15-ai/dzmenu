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

  // Delete orphaned soft-deleted duplicate categories
  const delRes = await client.query(`
    DELETE FROM categories
    WHERE deleted_at IS NOT NULL
      AND id NOT IN (SELECT DISTINCT category_id FROM menu_items WHERE category_id IS NOT NULL);
  `);
  console.log(`Deleted ${delRes.rowCount} stale deleted duplicate categories.`);

  // Also rename "Main Course" to "Main Dishes" if needed or ensure it has proper name
  await client.query(`
    UPDATE categories
    SET name = 'Main Dishes'
    WHERE restaurant_id = 'd90cadcc-305a-4057-aeba-3dc50ddba1a3' AND name = 'Main Course'
  `);

  const res = await client.query(`
    SELECT id, sort_order, name, is_active, deleted_at, icon
    FROM categories
    WHERE restaurant_id = 'd90cadcc-305a-4057-aeba-3dc50ddba1a3'
    ORDER BY sort_order ASC, name ASC;
  `);

  console.log(`Total categories for active restaurant: ${res.rows.length}`);
  console.table(res.rows.map(r => ({
    sort_order: r.sort_order,
    name: r.name,
    is_active: r.is_active,
    deleted_at: r.deleted_at ? 'DELETED' : 'ACTIVE',
    icon: r.icon?.substring(0, 15)
  })));

  await client.end();
}

main().catch(console.error);
