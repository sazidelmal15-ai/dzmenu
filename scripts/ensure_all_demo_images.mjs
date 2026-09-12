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
    SELECT mi.id, mi.restaurant_id, mi.name, mi.price, mi.image_url, c.name as category_name
    FROM menu_items mi
    LEFT JOIN categories c ON c.id = mi.category_id
    ORDER BY mi.created_at ASC;
  `);

  console.log("All menu items in entire DB:");
  console.table(res.rows);

  // Update any items matching Burger or Pizza across all restaurants if image_url is null
  await client.query(`
    UPDATE menu_items
    SET image_url = '/images/demo/double_classic_burger.jpg'
    WHERE name ILIKE '%Burger%' AND (image_url IS NULL OR image_url = '');
  `);

  await client.query(`
    UPDATE menu_items
    SET image_url = '/images/demo/margherita_special_pizza.jpg'
    WHERE name ILIKE '%Pizza%' AND (image_url IS NULL OR image_url = '');
  `);

  const updatedRes = await client.query(`
    SELECT mi.id, mi.restaurant_id, mi.name, mi.price, mi.image_url, c.name as category_name
    FROM menu_items mi
    LEFT JOIN categories c ON c.id = mi.category_id
    ORDER BY mi.created_at ASC;
  `);

  console.log("\nAfter update across all restaurants:");
  console.table(updatedRes.rows);

  await client.end();
}

main().catch(console.error);
