import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

const burgerSrc = 'C:\\Users\\Salem\\.gemini\\antigravity-ide\\brain\\917d6544-9579-4a25-8365-74bd8423babd\\gourmet_beef_burger_1788548947178.jpg';
const pizzaSrc = 'C:\\Users\\Salem\\.gemini\\antigravity-ide\\brain\\917d6544-9579-4a25-8365-74bd8423babd\\artisan_margherita_pizza_1788548964884.jpg';

const publicDemoDir = path.resolve('public', 'images', 'demo');
if (!fs.existsSync(publicDemoDir)) {
  fs.mkdirSync(publicDemoDir, { recursive: true });
}

const burgerDest = path.join(publicDemoDir, 'double_classic_burger.jpg');
const pizzaDest = path.join(publicDemoDir, 'margherita_special_pizza.jpg');

fs.copyFileSync(burgerSrc, burgerDest);
fs.copyFileSync(pizzaSrc, pizzaDest);

console.log('✅ Copied burger image to:', burgerDest);
console.log('✅ Copied pizza image to:', pizzaDest);

const burgerUrl = '/images/demo/double_classic_burger.jpg';
const pizzaUrl = '/images/demo/margherita_special_pizza.jpg';

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

  // 1. Update SQL trigger
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

  -- 2. Insert Starter Demo Dishes with High-Res Professional Photography
  IF v_burger_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
    VALUES (
      NEW.id,
      v_burger_id,
      'Double Classic Beef Burger',
      'Juicy double beef patties with melted cheddar, crisp lettuce, tomato, pickles, and signature sauce on a toasted brioche bun.',
      850.00,
      '/images/demo/double_classic_burger.jpg',
      TRUE, TRUE, TRUE,
      '[{"name": "Classic Beef", "price": 850, "isDefault": true}, {"name": "Spicy Beef", "price": 900}]'::jsonb,
      '[{"name": "Single", "price": 650}, {"name": "Double", "price": 850}, {"name": "Triple", "price": 1100}]'::jsonb,
      '[{"name": "Extra Cheese", "price": 100}, {"name": "Crispy Bacon", "price": 150}]'::jsonb,
      0
    );
  END IF;

  IF v_pizza_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
    VALUES (
      NEW.id,
      v_pizza_id,
      'Margherita Special Pizza',
      'Authentic Italian crust topped with rich tomato sauce, fresh buffalo mozzarella, fresh basil leaves, and extra virgin olive oil.',
      950.00,
      '/images/demo/margherita_special_pizza.jpg',
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
  console.log('✅ Trigger updated with demo dish images in Postgres!');

  // 2. Update existing active restaurant items
  const restId = 'd90cadcc-305a-4057-aeba-3dc50ddba1a3';
  await client.query(`
    UPDATE menu_items
    SET image_url = $1
    WHERE restaurant_id = $2 AND name ILIKE '%Burger%'
  `, [burgerUrl, restId]);

  // If Margherita Pizza item doesn't exist for this restaurant, create it or update it
  const pizzaCatRes = await client.query(`SELECT id FROM categories WHERE restaurant_id = $1 AND name = 'Pizza' AND deleted_at IS NULL`, [restId]);
  const pizzaCatId = pizzaCatRes.rows[0]?.id;

  const existingPizzaItem = await client.query(`SELECT id FROM menu_items WHERE restaurant_id = $1 AND name ILIKE '%Pizza%'`, [restId]);
  if (existingPizzaItem.rows.length > 0) {
    await client.query(`
      UPDATE menu_items
      SET image_url = $1
      WHERE id = $2
    `, [pizzaUrl, existingPizzaItem.rows[0].id]);
  } else if (pizzaCatId) {
    await client.query(`
      INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
      VALUES (
        $1, $2, 'Margherita Special Pizza',
        'Authentic Italian crust topped with rich tomato sauce, fresh buffalo mozzarella, fresh basil leaves, and extra virgin olive oil.',
        950.00, $3, TRUE, TRUE, TRUE, '[]'::jsonb,
        '[{"name": "Medium", "price": 950}, {"name": "Large", "price": 1350}]'::jsonb,
        '[{"name": "Extra Mozzarella", "price": 150}, {"name": "Mushrooms", "price": 100}]'::jsonb,
        0
      )
    `, [restId, pizzaCatId, pizzaUrl]);
  }

  const items = await client.query(`
    SELECT mi.id, mi.name, mi.price, mi.image_url, c.name as category_name
    FROM menu_items mi
    LEFT JOIN categories c ON c.id = mi.category_id
    WHERE mi.restaurant_id = $1
  `, [restId]);

  console.log('\n--- VERIFY ITEMS FOR ACTIVE RESTAURANT ---');
  console.table(items.rows);

  await client.end();
}

main().catch(console.error);
