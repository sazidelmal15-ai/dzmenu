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

const CANONICAL_CATEGORIES = [
  { name: 'Burgers', icon: '🍔', description: 'Delicious burgers made with premium ingredients' },
  { name: 'Pizza', icon: '🍕', description: 'Freshly baked pizzas with authentic toppings' },
  { name: 'Drinks', icon: '🥤', description: 'Refreshing beverages and cold drinks' },
  { name: 'Coffee', icon: '☕', description: 'Hot and cold brewed coffees and espresso' },
  { name: 'Ice Cream', icon: '🍦', description: 'Sweet and creamy ice cream flavors' },
  { name: 'Desserts', icon: '🍰', description: 'Cakes, pastries, and sweet treats' },
  { name: 'Salads', icon: '🥗', description: 'Healthy and fresh tossed salads' },
  { name: 'Pasta', icon: '🍝', description: 'Classic Italian pasta dishes' },
  { name: 'Chicken', icon: '🍗', description: 'Fried, roasted, and grilled chicken' },
  { name: 'Grills', icon: '🥩', description: 'Premium grilled meats and steaks' },
  { name: 'Sandwiches', icon: '🥪', description: 'Freshly made sandwiches and subs' },
  { name: 'Main Dishes', icon: '🍽️', description: 'Hearty main dishes and platters' },
  { name: 'Tacos', icon: '🌮', description: 'Authentic Mexican tacos and burritos' },
  { name: 'Seafood', icon: '🦐', description: 'Fresh fish and seafood dishes' },
  { name: 'Soups', icon: '🥣', description: 'Warm and comforting soups' },
  { name: 'Appetizers', icon: '🥟', description: 'Starters and bite-sized snacks' },
  { name: 'Breakfast', icon: '🍳', description: 'Morning favorites and breakfast plates' },
  { name: 'Sides', icon: '🍟', description: 'Side dishes and extras' },
  { name: 'Hot Drinks', icon: '☕', description: 'Hot tea, coffee, and specialty drinks' },
  { name: 'Fresh Juices', icon: '🧃', description: 'Freshly squeezed natural juices' },
  { name: 'Kids Menu', icon: '🍟', description: 'Kid-friendly meals and combos' },
  { name: 'Specials', icon: '⭐', description: 'Chef specials and limited edition dishes' }
];

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL!');

  // 1. Update seed_default_categories() function and trigger
  console.log('Updating seed_default_categories() trigger function in Postgres...');
  const triggerSql = `
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  v_burger_id UUID;
  v_pizza_id UUID;
  v_drinks_id UUID;
BEGIN
  -- 1. Insert Categories in Exact Canonical Order (0 to 21)
  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES (NEW.id, 'Burgers', '🍔', 'Delicious burgers made with premium ingredients', 0, TRUE, NULL, NOW() + INTERVAL '1 millisecond', NOW())
  RETURNING id INTO v_burger_id;

  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES (NEW.id, 'Pizza', '🍕', 'Freshly baked pizzas with authentic toppings', 1, TRUE, NULL, NOW() + INTERVAL '2 millisecond', NOW())
  RETURNING id INTO v_pizza_id;

  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES (NEW.id, 'Drinks', '🥤', 'Refreshing beverages and cold drinks', 2, TRUE, NULL, NOW() + INTERVAL '3 millisecond', NOW())
  RETURNING id INTO v_drinks_id;

  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES
    (NEW.id, 'Coffee',       '☕', 'Hot and cold brewed coffees and espresso', 3,  TRUE, NULL, NOW() + INTERVAL '4 millisecond', NOW()),
    (NEW.id, 'Ice Cream',    '🍦', 'Sweet and creamy ice cream flavors', 4,  TRUE, NULL, NOW() + INTERVAL '5 millisecond', NOW()),
    (NEW.id, 'Desserts',     '🍰', 'Cakes, pastries, and sweet treats', 5,  TRUE, NULL, NOW() + INTERVAL '6 millisecond', NOW()),
    (NEW.id, 'Salads',       '🥗', 'Healthy and fresh tossed salads', 6,  TRUE, NULL, NOW() + INTERVAL '7 millisecond', NOW()),
    (NEW.id, 'Pasta',        '🍝', 'Classic Italian pasta dishes', 7,  TRUE, NULL, NOW() + INTERVAL '8 millisecond', NOW()),
    (NEW.id, 'Chicken',      '🍗', 'Fried, roasted, and grilled chicken', 8,  TRUE, NULL, NOW() + INTERVAL '9 millisecond', NOW()),
    (NEW.id, 'Grills',       '🥩', 'Premium grilled meats and steaks', 9,  TRUE, NULL, NOW() + INTERVAL '10 millisecond', NOW()),
    (NEW.id, 'Sandwiches',   '🥪', 'Freshly made sandwiches and subs', 10, TRUE, NULL, NOW() + INTERVAL '11 millisecond', NOW()),
    (NEW.id, 'Main Dishes',  '🍽️', 'Hearty main dishes and platters', 11, TRUE, NULL, NOW() + INTERVAL '12 millisecond', NOW()),
    (NEW.id, 'Tacos',        '🌮', 'Authentic Mexican tacos and burritos', 12, TRUE, NULL, NOW() + INTERVAL '13 millisecond', NOW()),
    (NEW.id, 'Seafood',      '🦐', 'Fresh fish and seafood dishes', 13, TRUE, NULL, NOW() + INTERVAL '14 millisecond', NOW()),
    (NEW.id, 'Soups',        '🥣', 'Warm and comforting soups', 14, TRUE, NULL, NOW() + INTERVAL '15 millisecond', NOW()),
    (NEW.id, 'Appetizers',   '🥟', 'Starters and bite-sized snacks', 15, TRUE, NULL, NOW() + INTERVAL '16 millisecond', NOW()),
    (NEW.id, 'Breakfast',    '🍳', 'Morning favorites and breakfast plates', 16, TRUE, NULL, NOW() + INTERVAL '17 millisecond', NOW()),
    (NEW.id, 'Sides',        '🍟', 'Side dishes and extras', 17, TRUE, NULL, NOW() + INTERVAL '18 millisecond', NOW()),
    (NEW.id, 'Hot Drinks',   '☕', 'Hot tea, coffee, and specialty drinks', 18, TRUE, NULL, NOW() + INTERVAL '19 millisecond', NOW()),
    (NEW.id, 'Fresh Juices', '🧃', 'Freshly squeezed natural juices', 19, TRUE, NULL, NOW() + INTERVAL '20 millisecond', NOW()),
    (NEW.id, 'Kids Menu',    '🍟', 'Kid-friendly meals and combos', 20, TRUE, NULL, NOW() + INTERVAL '21 millisecond', NOW()),
    (NEW.id, 'Specials',     '⭐', 'Chef specials and limited edition dishes', 21, TRUE, NULL, NOW() + INTERVAL '22 millisecond', NOW());

  -- 2. Insert Starter Demo Dishes
  IF v_burger_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
    VALUES (
      NEW.id,
      v_burger_id,
      'Double Classic Beef Burger',
      'Juicy double beef patties with melted cheddar, crisp lettuce, tomato, pickles, and signature sauce on a toasted brioche bun.',
      850.00,
      TRUE, TRUE, TRUE,
      '[{"name": "Classic Beef", "price": 850, "isDefault": true}, {"name": "Spicy Beef", "price": 900}]'::jsonb,
      '[{"name": "Single", "price": 650}, {"name": "Double", "price": 850}, {"name": "Triple", "price": 1100}]'::jsonb,
      '[{"name": "Extra Cheese", "price": 100}, {"name": "Crispy Bacon", "price": 150}]'::jsonb,
      0
    );
  END IF;

  IF v_pizza_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
    VALUES (
      NEW.id,
      v_pizza_id,
      'Margherita Special Pizza',
      'Authentic Italian crust topped with rich tomato sauce, fresh buffalo mozzarella, fresh basil leaves, and extra virgin olive oil.',
      950.00,
      TRUE, TRUE, TRUE,
      '[]'::jsonb,
      '[{"name": "Medium", "price": 950}, {"name": "Large", "price": 1350}]'::jsonb,
      '[{"name": "Extra Mozzarella", "price": 150}, {"name": "Mushrooms", "price": 100}]'::jsonb,
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_default_categories ON restaurants;
CREATE TRIGGER trg_seed_default_categories
    AFTER INSERT ON restaurants
    FOR EACH ROW EXECUTE FUNCTION seed_default_categories();
`;
  await client.query(triggerSql);
  console.log('✅ Trigger updated successfully!');

  // 2. Synchronize active restaurant: d90cadcc-305a-4057-aeba-3dc50ddba1a3
  const activeRestId = 'd90cadcc-305a-4057-aeba-3dc50ddba1a3';
  console.log(`\nRe-ordering and restoring categories for active restaurant: ${activeRestId}`);

  // Fetch all existing categories for this restaurant
  const existingCatsRes = await client.query(`
    SELECT * FROM categories WHERE restaurant_id = $1
  `, [activeRestId]);
  const existingCats = existingCatsRes.rows;

  // Restore or update sort_order for each canonical category
  for (let i = 0; i < CANONICAL_CATEGORIES.length; i++) {
    const canon = CANONICAL_CATEGORIES[i];
    // Find if category with matching name exists
    const match = existingCats.find(c =>
      c.name.toLowerCase().trim() === canon.name.toLowerCase().trim() ||
      (c.name.toLowerCase().includes('main') && canon.name.toLowerCase().includes('main'))
    );

    if (match) {
      await client.query(`
        UPDATE categories
        SET sort_order = $1,
            deleted_at = NULL,
            is_active = TRUE
        WHERE id = $2
      `, [i, match.id]);
      console.log(`Updated "${match.name}" (ID: ${match.id}) to sort_order ${i}, active`);
    } else {
      // Insert if missing
      const insRes = await client.query(`
        INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
        RETURNING id
      `, [activeRestId, canon.name, canon.icon, canon.description, i]);
      console.log(`Created missing category "${canon.name}" (ID: ${insRes.rows[0].id}) at sort_order ${i}`);
    }
  }

  // Handle custom categories (e.g. Tomaito, etc.) - place them at sort_order 22+
  const customCats = existingCats.filter(c =>
    !CANONICAL_CATEGORIES.some(canon =>
      canon.name.toLowerCase().trim() === c.name.toLowerCase().trim() ||
      (c.name.toLowerCase().includes('main') && canon.name.toLowerCase().includes('main'))
    )
  );

  for (let j = 0; j < customCats.length; j++) {
    const custom = customCats[j];
    const newSortOrder = CANONICAL_CATEGORIES.length + j;
    await client.query(`
      UPDATE categories
      SET sort_order = $1,
          deleted_at = NULL,
          is_active = TRUE
      WHERE id = $2
    `, [newSortOrder, custom.id]);
    console.log(`Updated custom category "${custom.name}" (ID: ${custom.id}) to sort_order ${newSortOrder}`);
  }

  // Verify all categories for active restaurant
  console.log('\n--- FINAL ORDER IN DATABASE FOR ACTIVE RESTAURANT ---');
  const finalCatsRes = await client.query(`
    SELECT id, name, sort_order, is_active, deleted_at, icon
    FROM categories
    WHERE restaurant_id = $1
    ORDER BY sort_order ASC, name ASC
  `, [activeRestId]);
  console.table(finalCatsRes.rows.map(r => ({
    sort_order: r.sort_order,
    name: r.name,
    is_active: r.is_active,
    deleted_at: r.deleted_at ? 'DELETED' : 'ACTIVE',
    icon: r.icon?.substring(0, 15)
  })));

  // Verify menu items link
  console.log('\n--- FINAL MENU ITEMS ---');
  const finalItemsRes = await client.query(`
    SELECT mi.id, mi.name, mi.price, mi.category_id, c.name as category_name
    FROM menu_items mi
    LEFT JOIN categories c ON c.id = mi.category_id
    WHERE mi.restaurant_id = $1
  `, [activeRestId]);
  console.table(finalItemsRes.rows);

  await client.end();
}

main().catch(console.error);
