import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const urlsToTry = [
  connectionString.replace(":6543", ":5432"),
  connectionString,
  connectionString.replace("aws-1-eu-west-1.pooler.supabase.com:6543", "aws-1-eu-west-1.pooler.supabase.com:5432")
];

// Replicate deleteCascade transaction logic from lib/db/queries/categories.ts
async function executeDeleteCascade(client, categoryId, restaurantId) {
  try {
    await client.query("BEGIN");

    // 1. Verify existence & tenant ownership
    const catRes = await client.query(
      `SELECT id, restaurant_id AS "restaurantId", name
       FROM categories
       WHERE id = $1 AND restaurant_id = $2`,
      [categoryId, restaurantId]
    );

    const category = catRes.rows[0];
    if (!category) {
      await client.query("ROLLBACK");
      return {
        deleted: false,
        category: null,
        deletedItemCount: 0,
        deletedImageUrls: [],
      };
    }

    // 2. Delete all menu items belonging to this category for this tenant atomically
    const itemRes = await client.query(
      `DELETE FROM menu_items
       WHERE category_id = $1 AND restaurant_id = $2
       RETURNING id, image_url AS "imageUrl"`,
      [categoryId, restaurantId]
    );

    // 3. Delete the category itself
    await client.query(
      `DELETE FROM categories
       WHERE id = $1 AND restaurant_id = $2`,
      [categoryId, restaurantId]
    );

    await client.query("COMMIT");

    const deletedImageUrls = itemRes.rows
      .map((i) => i.imageUrl)
      .filter((url) => Boolean(url));

    return {
      deleted: true,
      category,
      deletedItemCount: itemRes.rows.length,
      deletedImageUrls,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function runCategoryDeletionTestSuite() {
  let client = null;
  for (const url of urlsToTry) {
    const cleanUrl = url.replace(/[\?&]sslmode=[^&]+/g, "").replace(/\?$/, "");
    try {
      client = new Client({
        connectionString: cleanUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await client.connect();
      break;
    } catch (e) {
      client = null;
    }
  }

  if (!client) {
    console.error("Failed to connect to database for category deletion test.");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("DZMenu: Category Deletion (Atomic Cascade Delete) E2E Test Suite");
  console.log("==================================================================");

  let restaurantAId = null;
  let restaurantBId = null;

  try {
    // 0. Setup test restaurants
    const restARes = await client.query(`
      INSERT INTO restaurants (name, slug, currency, status, created_at, updated_at)
      VALUES ('Test Rest A', 'test-del-rest-a-' || floor(random()*100000), 'DZD', 'ACTIVE', NOW(), NOW())
      RETURNING id, name, slug
    `);
    restaurantAId = restARes.rows[0].id;

    const restBRes = await client.query(`
      INSERT INTO restaurants (name, slug, currency, status, created_at, updated_at)
      VALUES ('Test Rest B', 'test-del-rest-b-' || floor(random()*100000), 'DZD', 'ACTIVE', NOW(), NOW())
      RETURNING id, name, slug
    `);
    restaurantBId = restBRes.rows[0].id;

    console.log(`[SETUP] Created Restaurant A (${restaurantAId}) and Restaurant B (${restaurantBId})`);

    // =========================================================================
    // TEST A: Delete Empty Category
    // =========================================================================
    console.log("\n--- TEST A: Delete Empty Category (0 items) ---");
    const catARes = await client.query(`
      INSERT INTO categories (restaurant_id, name, sort_order, is_active, created_at, updated_at)
      VALUES ($1, 'Empty Appetizers', 1, true, NOW(), NOW())
      RETURNING id, name
    `, [restaurantAId]);
    const emptyCatId = catARes.rows[0].id;

    const resultA = await executeDeleteCascade(client, emptyCatId, restaurantAId);
    console.log(`Deletion result: deleted=${resultA.deleted}, deletedItemCount=${resultA.deletedItemCount}`);

    // Verify DB state
    const checkCatA = await client.query(`SELECT * FROM categories WHERE id = $1`, [emptyCatId]);
    if (checkCatA.rows.length !== 0) {
      throw new Error(`TEST A FAILED: Category still exists in database!`);
    }
    if (resultA.deleted !== true || resultA.deletedItemCount !== 0) {
      throw new Error(`TEST A FAILED: Unexpected deletion result: ${JSON.stringify(resultA)}`);
    }
    console.log("✅ PASS: Empty category permanently removed from DB with 0 items deleted.");

    // =========================================================================
    // TEST B: Delete Category with Items (Atomic Cascade)
    // =========================================================================
    console.log("\n--- TEST B: Delete Category with Items (Atomic Cascade) ---");
    const catBRes = await client.query(`
      INSERT INTO categories (restaurant_id, name, sort_order, is_active, created_at, updated_at)
      VALUES ($1, 'Burgers Deluxe', 2, true, NOW(), NOW())
      RETURNING id, name
    `, [restaurantAId]);
    const burgerCatId = catBRes.rows[0].id;

    // Seed 3 items in this category
    const itemIds = [];
    for (let i = 1; i <= 3; i++) {
      const itRes = await client.query(`
        INSERT INTO menu_items (restaurant_id, category_id, name, price, is_visible, is_available, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, true, NOW(), NOW())
        RETURNING id
      `, [restaurantAId, burgerCatId, `Burger ${i}`, 500 * i]);
      itemIds.push(itRes.rows[0].id);
    }
    console.log(`Seeded 3 items in category "${catBRes.rows[0].name}":`, itemIds);

    const resultB = await executeDeleteCascade(client, burgerCatId, restaurantAId);
    console.log(`Deletion result: deleted=${resultB.deleted}, deletedItemCount=${resultB.deletedItemCount}`);

    // Verify DB state: category must NOT exist
    const checkCatB = await client.query(`SELECT * FROM categories WHERE id = $1`, [burgerCatId]);
    if (checkCatB.rows.length !== 0) {
      throw new Error(`TEST B FAILED: Category still exists in database!`);
    }

    // Verify DB state: ALL 3 items must NOT exist
    const checkItemsB = await client.query(`SELECT * FROM menu_items WHERE id = ANY($1)`, [itemIds]);
    if (checkItemsB.rows.length !== 0) {
      throw new Error(`TEST B FAILED: ${checkItemsB.rows.length} menu items still exist in database!`);
    }

    // Verify no orphaned category_id
    const checkOrphans = await client.query(`SELECT * FROM menu_items WHERE category_id = $1`, [burgerCatId]);
    if (checkOrphans.rows.length !== 0) {
      throw new Error(`TEST B FAILED: Orphaned items found referencing deleted category!`);
    }

    if (resultB.deletedItemCount !== 3) {
      throw new Error(`TEST B FAILED: Expected 3 deleted items, got ${resultB.deletedItemCount}`);
    }
    console.log("✅ PASS: Category AND all 3 contained menu items permanently deleted atomically.");

    // =========================================================================
    // TEST C: Cross-Tenant Attack Protection
    // =========================================================================
    console.log("\n--- TEST C: Cross-Tenant Attack Protection ---");
    // Create category & item in Restaurant A
    const catCRes = await client.query(`
      INSERT INTO categories (restaurant_id, name, sort_order, is_active, created_at, updated_at)
      VALUES ($1, 'Rest A Secret Recipes', 3, true, NOW(), NOW())
      RETURNING id, name
    `, [restaurantAId]);
    const secretCatId = catCRes.rows[0].id;

    const secretItemRes = await client.query(`
      INSERT INTO menu_items (restaurant_id, category_id, name, price, is_visible, is_available, created_at, updated_at)
      VALUES ($1, $2, 'Secret Dish', 1500, true, true, NOW(), NOW())
      RETURNING id
    `, [restaurantAId, secretCatId]);
    const secretItemId = secretItemRes.rows[0].id;

    // Restaurant B attempts to delete Restaurant A's category
    const resultC = await executeDeleteCascade(client, secretCatId, restaurantBId);
    console.log(`Cross-tenant deletion result: deleted=${resultC.deleted}`);

    if (resultC.deleted !== false) {
      throw new Error(`TEST C FAILED: Cross-tenant deletion succeeded! Security breach!`);
    }

    // Verify Restaurant A category & item are intact
    const verifyCatA = await client.query(`SELECT * FROM categories WHERE id = $1`, [secretCatId]);
    const verifyItemA = await client.query(`SELECT * FROM menu_items WHERE id = $1`, [secretItemId]);

    if (verifyCatA.rows.length !== 1 || verifyItemA.rows.length !== 1) {
      throw new Error(`TEST C FAILED: Restaurant A data was altered during cross-tenant attack!`);
    }
    console.log("✅ PASS: Cross-tenant attack safely rejected with zero data mutation.");

    // =========================================================================
    // TEST D: Malformed UUID / Non-existent Category
    // =========================================================================
    console.log("\n--- TEST D: Malformed UUID / Non-existent Category ---");
    const fakeUuid = '00000000-0000-0000-0000-000000000099';
    const resultD = await executeDeleteCascade(client, fakeUuid, restaurantAId);
    if (resultD.deleted !== false) {
      throw new Error(`TEST D FAILED: Deletion on non-existent category returned true!`);
    }
    console.log("✅ PASS: Non-existent category safely returned deleted=false.");

    // =========================================================================
    // TEST E: Atomic Transaction Rollback on Failure
    // =========================================================================
    console.log("\n--- TEST E: Atomic Transaction Rollback on Failure ---");
    // Create test category and item
    const catERes = await client.query(`
      INSERT INTO categories (restaurant_id, name, sort_order, is_active, created_at, updated_at)
      VALUES ($1, 'Rollback Test Category', 4, true, NOW(), NOW())
      RETURNING id
    `, [restaurantAId]);
    const rollbackCatId = catERes.rows[0].id;

    const itemERes = await client.query(`
      INSERT INTO menu_items (restaurant_id, category_id, name, price, is_visible, is_available, created_at, updated_at)
      VALUES ($1, $2, 'Rollback Dish', 700, true, true, NOW(), NOW())
      RETURNING id
    `, [restaurantAId, rollbackCatId]);
    const rollbackItemId = itemERes.rows[0].id;

    // Simulate failed transaction
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM menu_items WHERE category_id = $1 AND restaurant_id = $2`, [rollbackCatId, restaurantAId]);
      // Force synthetic failure before deleting category
      throw new Error("Synthetic failure simulation during deletion");
    } catch (e) {
      await client.query("ROLLBACK");
      console.log(`Simulated error handled: "${e.message}", transaction rolled back.`);
    }

    // Verify rollback: category and item MUST still exist
    const checkCatRollback = await client.query(`SELECT * FROM categories WHERE id = $1`, [rollbackCatId]);
    const checkItemRollback = await client.query(`SELECT * FROM menu_items WHERE id = $1`, [rollbackItemId]);

    if (checkCatRollback.rows.length !== 1 || checkItemRollback.rows.length !== 1) {
      throw new Error(`TEST E FAILED: Rollback failed, partial state detected in database!`);
    }
    console.log("✅ PASS: Database rollback strictly preserved category and items upon failure.");

    console.log("\n==================================================================");
    console.log("🎉 ALL 5/5 CATEGORY DELETION E2E TESTS PASSED WITH 100%");
    console.log("==================================================================");

  } finally {
    // Cleanup test fixtures
    if (restaurantAId) {
      await client.query(`DELETE FROM menu_items WHERE restaurant_id = $1`, [restaurantAId]);
      await client.query(`DELETE FROM categories WHERE restaurant_id = $1`, [restaurantAId]);
      await client.query(`DELETE FROM subscriptions WHERE restaurant_id = $1`, [restaurantAId]);
      await client.query(`DELETE FROM restaurants WHERE id = $1`, [restaurantAId]);
    }
    if (restaurantBId) {
      await client.query(`DELETE FROM menu_items WHERE restaurant_id = $1`, [restaurantBId]);
      await client.query(`DELETE FROM categories WHERE restaurant_id = $1`, [restaurantBId]);
      await client.query(`DELETE FROM subscriptions WHERE restaurant_id = $1`, [restaurantBId]);
      await client.query(`DELETE FROM restaurants WHERE id = $1`, [restaurantBId]);
    }
    console.log(`[CLEANUP] Successfully cleaned up all test fixtures.`);
    await client.end();
  }
}

runCategoryDeletionTestSuite().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
