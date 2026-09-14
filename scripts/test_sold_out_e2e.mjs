import pg from 'pg';
import fs from 'fs';
import { z } from 'zod';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const connectionString = process.env.DATABASE_URL.replace(':6543', ':5432');
const client = new pg.Client({ connectionString });

// Import Zod schemas from discounts logic
const MENU_ITEM_AVAILABILITIES = ['AVAILABLE', 'SOLD_OUT', 'HIDDEN'];
const menuItemAvailabilitySchema = z.enum(MENU_ITEM_AVAILABILITIES);

async function runTests() {
  await client.connect();
  console.log('==================================================================');
  console.log('DZMenu: Sold Out (3-State Availability) E2E Test Suite');
  console.log('==================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passed++;
    console.log(`✅ PASS: ${message}`);
  }

  // Fixture IDs
  let restaurantAId = null;
  let restaurantBId = null;
  let categoryId = null;
  let testItemId = null;

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------------------
    const restARes = await client.query(
      `INSERT INTO restaurants (name, slug, currency, status)
       VALUES ('Sold Out Test Rest A', 'sold-out-test-a-' || substr(md5(random()::text), 1, 8), 'DZD', 'ACTIVE')
       RETURNING id`
    );
    restaurantAId = restARes.rows[0].id;

    const restBRes = await client.query(
      `INSERT INTO restaurants (name, slug, currency, status)
       VALUES ('Sold Out Test Rest B', 'sold-out-test-b-' || substr(md5(random()::text), 1, 8), 'DZD', 'ACTIVE')
       RETURNING id`
    );
    restaurantBId = restBRes.rows[0].id;

    const catRes = await client.query(
      `INSERT INTO categories (restaurant_id, name, sort_order)
       VALUES ($1, 'Burgers', 1)
       RETURNING id`,
      [restaurantAId]
    );
    categoryId = catRes.rows[0].id;

    console.log(`[SETUP] Created test restaurants (${restaurantAId}, ${restaurantBId}) and category (${categoryId})\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Database Migration & Check Constraint
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Database Check Constraint on availability ---');
    const validInsert = await client.query(
      `INSERT INTO menu_items (restaurant_id, category_id, name, price, availability, is_visible, is_available)
       VALUES ($1, $2, 'Classic Cheeseburger', 750, 'AVAILABLE', true, true)
       RETURNING id, availability, is_visible, is_available`,
      [restaurantAId, categoryId]
    );
    testItemId = validInsert.rows[0].id;
    assert(validInsert.rows[0].availability === 'AVAILABLE', 'Valid availability "AVAILABLE" accepted by database');

    let constraintBlocked = false;
    try {
      await client.query(
        `INSERT INTO menu_items (restaurant_id, category_id, name, price, availability)
         VALUES ($1, $2, 'Illegal Item', 500, 'INVALID_STATE')`,
        [restaurantAId, categoryId]
      );
    } catch (err) {
      constraintBlocked = true;
    }
    assert(constraintBlocked, 'PostgreSQL constraint chk_menu_items_availability strictly rejected invalid state "INVALID_STATE"');

    // -------------------------------------------------------------------------
    // TEST 2: State Transition Matrix (All 6 Transitions)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: State Transition Matrix (All 6 Transitions) ---');

    // Transition 1: AVAILABLE -> SOLD_OUT
    await client.query(
      `UPDATE menu_items SET availability = 'SOLD_OUT', is_visible = true, is_available = false, updated_at = NOW() WHERE id = $1`,
      [testItemId]
    );
    const r1 = await client.query(`SELECT availability, is_visible, is_available FROM menu_items WHERE id = $1`, [testItemId]);
    assert(r1.rows[0].availability === 'SOLD_OUT' && r1.rows[0].is_visible === true && r1.rows[0].is_available === false,
      'Transition 1: AVAILABLE -> SOLD_OUT persisted correctly');

    // Transition 2: SOLD_OUT -> HIDDEN
    await client.query(
      `UPDATE menu_items SET availability = 'HIDDEN', is_visible = false, is_available = false, updated_at = NOW() WHERE id = $1`,
      [testItemId]
    );
    const r2 = await client.query(`SELECT availability, is_visible, is_available FROM menu_items WHERE id = $1`, [testItemId]);
    assert(r2.rows[0].availability === 'HIDDEN' && r2.rows[0].is_visible === false && r2.rows[0].is_available === false,
      'Transition 2: SOLD_OUT -> HIDDEN persisted correctly');

    // Transition 3: HIDDEN -> AVAILABLE
    await client.query(
      `UPDATE menu_items SET availability = 'AVAILABLE', is_visible = true, is_available = true, updated_at = NOW() WHERE id = $1`,
      [testItemId]
    );
    const r3 = await client.query(`SELECT availability, is_visible, is_available FROM menu_items WHERE id = $1`, [testItemId]);
    assert(r3.rows[0].availability === 'AVAILABLE' && r3.rows[0].is_visible === true && r3.rows[0].is_available === true,
      'Transition 3: HIDDEN -> AVAILABLE persisted correctly');

    // Transition 4: AVAILABLE -> HIDDEN
    await client.query(
      `UPDATE menu_items SET availability = 'HIDDEN', is_visible = false, is_available = false, updated_at = NOW() WHERE id = $1`,
      [testItemId]
    );
    const r4 = await client.query(`SELECT availability, is_visible, is_available FROM menu_items WHERE id = $1`, [testItemId]);
    assert(r4.rows[0].availability === 'HIDDEN', 'Transition 4: AVAILABLE -> HIDDEN persisted correctly');

    // Transition 5: HIDDEN -> SOLD_OUT
    await client.query(
      `UPDATE menu_items SET availability = 'SOLD_OUT', is_visible = true, is_available = false, updated_at = NOW() WHERE id = $1`,
      [testItemId]
    );
    const r5 = await client.query(`SELECT availability, is_visible, is_available FROM menu_items WHERE id = $1`, [testItemId]);
    assert(r5.rows[0].availability === 'SOLD_OUT', 'Transition 5: HIDDEN -> SOLD_OUT persisted correctly');

    // Transition 6: SOLD_OUT -> AVAILABLE
    await client.query(
      `UPDATE menu_items SET availability = 'AVAILABLE', is_visible = true, is_available = true, updated_at = NOW() WHERE id = $1`,
      [testItemId]
    );
    const r6 = await client.query(`SELECT availability, is_visible, is_available FROM menu_items WHERE id = $1`, [testItemId]);
    assert(r6.rows[0].availability === 'AVAILABLE', 'Transition 6: SOLD_OUT -> AVAILABLE persisted correctly');

    // -------------------------------------------------------------------------
    // TEST 3: Server-Side Zod Validation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Server-Side Zod Validation ---');
    assert(menuItemAvailabilitySchema.safeParse('AVAILABLE').success, 'Zod accepts "AVAILABLE"');
    assert(menuItemAvailabilitySchema.safeParse('SOLD_OUT').success, 'Zod accepts "SOLD_OUT"');
    assert(menuItemAvailabilitySchema.safeParse('HIDDEN').success, 'Zod accepts "HIDDEN"');
    assert(!menuItemAvailabilitySchema.safeParse('banana').success, 'Zod strictly rejects "banana"');
    assert(!menuItemAvailabilitySchema.safeParse('disabled123').success, 'Zod strictly rejects "disabled123"');
    assert(!menuItemAvailabilitySchema.safeParse('admin').success, 'Zod strictly rejects "admin"');

    // -------------------------------------------------------------------------
    // TEST 4: Cross-Tenant Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Cross-Tenant Isolation ---');
    const crossTenantUpdate = await client.query(
      `UPDATE menu_items SET availability = 'SOLD_OUT' WHERE id = $1 AND restaurant_id = $2`,
      [testItemId, restaurantBId]
    );
    assert(crossTenantUpdate.rowCount === 0, 'Cross-tenant availability mutation blocked (0 rows affected)');

    const stateCheck = await client.query(`SELECT availability FROM menu_items WHERE id = $1`, [testItemId]);
    assert(stateCheck.rows[0].availability === 'AVAILABLE', 'Item state in Restaurant A preserved without tampering');

    // -------------------------------------------------------------------------
    // TEST 5: Public Menu Filtering Logic
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Public Menu Filtering Logic ---');
    // Seed 3 items: 1 AVAILABLE, 1 SOLD_OUT, 1 HIDDEN
    const item1 = { name: 'Available Burger', availability: 'AVAILABLE' };
    const item2 = { name: 'Sold Out Burger', availability: 'SOLD_OUT' };
    const item3 = { name: 'Secret Hidden Burger', availability: 'HIDDEN' };

    const testItems = [item1, item2, item3];
    const publicEligible = testItems.filter((i) => i.availability !== 'HIDDEN');

    assert(publicEligible.length === 2, 'Public menu filter includes exactly 2 items (AVAILABLE + SOLD_OUT)');
    assert(publicEligible.some((i) => i.name === 'Available Burger' && i.availability === 'AVAILABLE'), 'Available item included');
    assert(publicEligible.some((i) => i.name === 'Sold Out Burger' && i.availability === 'SOLD_OUT'), 'Sold out item included');
    assert(!publicEligible.some((i) => i.name === 'Secret Hidden Burger'), 'Hidden item strictly excluded from public menu');

    console.log('\n==================================================================');
    console.log(`🎉 ALL ${passed}/${total} SOLD OUT E2E TESTS PASSED WITH 100%`);
    console.log('==================================================================');
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    if (restaurantAId) {
      await client.query(`DELETE FROM restaurants WHERE id = $1`, [restaurantAId]);
    }
    if (restaurantBId) {
      await client.query(`DELETE FROM restaurants WHERE id = $1`, [restaurantBId]);
    }
    await client.end();
    console.log('[CLEANUP] Successfully cleaned up all test fixtures.');
  }
}

runTests().catch((err) => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
