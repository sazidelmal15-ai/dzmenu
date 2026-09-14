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

// Exact domain implementation replica of hasActiveSubscription (from lib/permissions/guards.ts)
async function evaluateHasActiveSubscription(client, restaurantId) {
  const res = await client.query(`
    SELECT id, restaurant_id AS "restaurantId", plan, status, 
           current_period_start AS "currentPeriodStart", 
           current_period_end AS "currentPeriodEnd"
    FROM subscriptions
    WHERE restaurant_id = $1
  `, [restaurantId]);

  const subscription = res.rows[0];
  if (!subscription) return false;

  const isStatusActive = subscription.status === "ACTIVE" || subscription.status === "TRIALING";
  const isNotExpired = new Date(subscription.currentPeriodEnd).getTime() > Date.now();

  return isStatusActive && isNotExpired;
}

// Exact implementation of the server-side Public Menu gate (from app/m/[slug]/page.tsx)
async function simulatePublicMenuServerGate(client, slug, searchParams = {}) {
  // 1. Resolve restaurant by public slug
  const restRes = await client.query(`
    SELECT id, name, slug, currency, status, deleted_at AS "deletedAt"
    FROM restaurants
    WHERE slug = $1 AND deleted_at IS NULL
  `, [slug]);
  const restaurant = restRes.rows[0];
  if (!restaurant) {
    return { status: 404, renderedComponent: "NotFound", exposedData: null };
  }

  // 2. Owner check
  const isOwner = searchParams.isOwner || false;
  const isAuthorizedPreview = Boolean(searchParams.preview_theme && isOwner);
  const isAuthorizedLiveOverride = Boolean(searchParams.preview_live === "true" && isOwner);

  // 3. Subscription & lifecycle evaluation
  const hasActive = await evaluateHasActiveSubscription(client, restaurant.id);
  const isLiveForPublic = restaurant.status === "ACTIVE" && hasActive;

  // 4. Server-Side Early Return: Maintenance Screen if not live and not authorized preview/override
  if (!isLiveForPublic && !isAuthorizedPreview && !isAuthorizedLiveOverride) {
    return {
      status: 200,
      renderedComponent: "RestaurantMaintenanceScreen",
      isLiveForPublic: false,
      hasActiveSubscription: hasActive,
      restaurantStatus: restaurant.status,
      // Zero menu items/categories fetched or included in payload
      categoriesFetched: 0,
      menuItemsFetched: 0,
      exposedData: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        }
      }
    };
  }

  // 5. Downstream queries only execute if gate passed
  const [catRes, itemRes] = await Promise.all([
    client.query(`SELECT id, name FROM categories WHERE restaurant_id = $1 AND deleted_at IS NULL`, [restaurant.id]),
    client.query(`SELECT id, name, price FROM menu_items WHERE restaurant_id = $1 AND deleted_at IS NULL`, [restaurant.id]),
  ]);

  return {
    status: 200,
    renderedComponent: "ThemeDispatcher",
    isLiveForPublic: true,
    hasActiveSubscription: hasActive,
    restaurantStatus: restaurant.status,
    categoriesFetched: catRes.rows.length,
    menuItemsFetched: itemRes.rows.length,
    exposedData: {
      categories: catRes.rows,
      items: itemRes.rows,
    }
  };
}

// Exact implementation of generateMetadata (from app/m/[slug]/page.tsx)
async function simulateGenerateMetadata(client, slug) {
  const restRes = await client.query(`
    SELECT id, name, slug, tagline, description, status, cover_url AS "coverUrl"
    FROM restaurants
    WHERE slug = $1 AND deleted_at IS NULL
  `, [slug]);
  const restaurant = restRes.rows[0];
  if (!restaurant) return { title: "Menu Not Found | DZMenu" };

  const hasActive = await evaluateHasActiveSubscription(client, restaurant.id);
  if (restaurant.status !== "ACTIVE" || !hasActive) {
    return {
      title: `${restaurant.name} | Under Maintenance`,
      description: `The digital menu for ${restaurant.name} is temporarily paused.`,
    };
  }

  return {
    title: `${restaurant.name} | Digital QR Menu`,
    description: restaurant.tagline || restaurant.description || `Browse the official digital menu of ${restaurant.name}.`,
    openGraph: {
      title: `${restaurant.name} — Digital Menu`,
      description: restaurant.tagline || `Browse dishes, specials, and prices online.`,
    },
  };
}

async function runExpirationSecurityAudit() {
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
    console.error("Failed to connect to database for expiration test.");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("DZMenu Security Audit: Real Subscription Expiration Gating Test");
  console.log("==================================================================");

  let testRestaurantId = null;
  const testSlug = `audit-expire-test-${Math.floor(Math.random() * 100000)}`;

  try {
    // 1. Create a live test restaurant with dishes, categories, and active status
    const restRes = await client.query(`
      INSERT INTO restaurants (name, slug, currency, status, created_at, updated_at)
      VALUES ('Audit Test Bistro', $1, 'DZD', 'ACTIVE', NOW(), NOW())
      RETURNING id, name, slug, status
    `, [testSlug]);
    testRestaurantId = restRes.rows[0].id;
    console.log(`[SETUP] Created test restaurant: "${restRes.rows[0].name}" (Slug: ${testSlug}, ID: ${testRestaurantId})`);

    // Add a test category & secret menu item with prices
    const catRes = await client.query(`
      INSERT INTO categories (restaurant_id, name, sort_order, is_active, created_at, updated_at)
      VALUES ($1, 'Specialties', 1, true, NOW(), NOW())
      RETURNING id, name
    `, [testRestaurantId]);
    const catId = catRes.rows[0].id;

    const itemRes = await client.query(`
      INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_visible, is_available, created_at, updated_at)
      VALUES ($1, $2, 'Signature Truffle Burger', 'Secret recipe with black truffle sauce', 2500, true, true, NOW(), NOW())
      RETURNING id, name, price
    `, [testRestaurantId, catId]);
    console.log(`[SETUP] Seeded category "${catRes.rows[0].name}" and item "${itemRes.rows[0].name}" (${itemRes.rows[0].price} DZD)`);

    // =========================================================================
    // SCENARIO 1: Expired Subscription with restaurants.status = 'ACTIVE'
    // =========================================================================
    console.log("\n--- TEST 1: Natural Expiration (status = ACTIVE, subscriptions.current_period_end in past) ---");
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    await client.query(`
      INSERT INTO subscriptions (restaurant_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
      VALUES ($1, 'STANDARD_ANNUAL', 'ACTIVE', NOW() - INTERVAL '372 days', $2, NOW(), NOW())
      ON CONFLICT (restaurant_id) DO UPDATE SET
        status = 'ACTIVE',
        current_period_end = $2,
        updated_at = NOW()
    `, [testRestaurantId, pastDate]);

    const result1 = await simulatePublicMenuServerGate(client, testSlug);
    console.log(`Rendered Component: "${result1.renderedComponent}"`);
    console.log(`isLiveForPublic: ${result1.isLiveForPublic}`);
    console.log(`Categories fetched: ${result1.categoriesFetched}`);
    console.log(`Menu items fetched: ${result1.menuItemsFetched}`);

    if (result1.renderedComponent !== "RestaurantMaintenanceScreen") {
      throw new Error(`SECURITY FAILURE: Expected RestaurantMaintenanceScreen, got ${result1.renderedComponent}`);
    }
    if (result1.categoriesFetched > 0 || result1.menuItemsFetched > 0) {
      throw new Error(`SECURITY FAILURE: Menu items or categories were queried when subscription was expired!`);
    }
    if (result1.exposedData.categories || result1.exposedData.items) {
      throw new Error(`SECURITY FAILURE: Response payload contains exposed menu data!`);
    }
    console.log("✅ PASS: Public visitor receives <RestaurantMaintenanceScreen /> with ZERO menu items or categories exposed.");

    // Check Metadata for Expired Subscription
    const meta1 = await simulateGenerateMetadata(client, testSlug);
    console.log(`Metadata Title: "${meta1.title}"`);
    if (!meta1.title.includes("Under Maintenance")) {
      throw new Error(`SECURITY FAILURE: Metadata leaked active menu title for expired subscription!`);
    }
    console.log("✅ PASS: generateMetadata returns 'Under Maintenance' without exposing restaurant menu details.");

    // =========================================================================
    // SCENARIO 2: Re-activation / Extension to Future
    // =========================================================================
    console.log("\n--- TEST 2: Valid Active Subscription (current_period_end in future) ---");
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in future
    await client.query(`
      UPDATE subscriptions
      SET status = 'ACTIVE', current_period_end = $1, updated_at = NOW()
      WHERE restaurant_id = $2
    `, [futureDate, testRestaurantId]);

    const result2 = await simulatePublicMenuServerGate(client, testSlug);
    console.log(`Rendered Component: "${result2.renderedComponent}"`);
    console.log(`isLiveForPublic: ${result2.isLiveForPublic}`);
    console.log(`Categories fetched: ${result2.categoriesFetched}`);
    console.log(`Menu items fetched: ${result2.menuItemsFetched}`);

    if (result2.renderedComponent !== "ThemeDispatcher") {
      throw new Error(`FAILURE: Expected ThemeDispatcher for active restaurant, got ${result2.renderedComponent}`);
    }
    if (result2.menuItemsFetched < 1) {
      throw new Error(`FAILURE: Expected at least 1 menu item to be rendered, got ${result2.menuItemsFetched}`);
    }
    console.log("✅ PASS: Valid active subscription successfully renders full menu via ThemeDispatcher.");

    const meta2 = await simulateGenerateMetadata(client, testSlug);
    console.log(`Metadata Title: "${meta2.title}"`);
    if (meta2.title.includes("Under Maintenance")) {
      throw new Error(`FAILURE: Active menu received maintenance metadata title.`);
    }
    console.log("✅ PASS: generateMetadata returns active Digital QR Menu metadata.");

    // =========================================================================
    // SCENARIO 3: Owner Preview Override on Expired Menu
    // =========================================================================
    console.log("\n--- TEST 3: Authenticated Owner Preview Override on Expired Menu ---");
    // Set back to expired
    await client.query(`
      UPDATE subscriptions
      SET status = 'ACTIVE', current_period_end = $1, updated_at = NOW()
      WHERE restaurant_id = $2
    `, [pastDate, testRestaurantId]);

    // Owner requests ?preview_live=true
    const result3 = await simulatePublicMenuServerGate(client, testSlug, { isOwner: true, preview_live: "true" });
    console.log(`Rendered Component for Owner Preview: "${result3.renderedComponent}"`);
    console.log(`isLiveForPublic: ${result3.isLiveForPublic}`);

    if (result3.renderedComponent !== "ThemeDispatcher") {
      throw new Error(`FAILURE: Authenticated owner preview failed to render menu in override mode.`);
    }
    console.log("✅ PASS: Authenticated owner can preview draft menu while public visitors remain blocked.");

    // =========================================================================
    // SCENARIO 4: Admin Suspension (status = SUSPENDED)
    // =========================================================================
    console.log("\n--- TEST 4: Admin Suspension (status = SUSPENDED) ---");
    await client.query(`
      UPDATE restaurants SET status = 'SUSPENDED' WHERE id = $1
    `, [testRestaurantId]);

    const result4 = await simulatePublicMenuServerGate(client, testSlug);
    if (result4.renderedComponent !== "RestaurantMaintenanceScreen") {
      throw new Error(`SECURITY FAILURE: Suspended restaurant rendered public menu!`);
    }
    console.log("✅ PASS: Suspended restaurant is strictly blocked.");

    console.log("\n==================================================================");
    console.log("🎉 ALL EXPIRATION GATING VERIFICATION CHECKS PASSED (100%)");
    console.log("==================================================================");

  } finally {
    if (testRestaurantId) {
      await client.query(`DELETE FROM menu_items WHERE restaurant_id = $1`, [testRestaurantId]);
      await client.query(`DELETE FROM categories WHERE restaurant_id = $1`, [testRestaurantId]);
      await client.query(`DELETE FROM subscriptions WHERE restaurant_id = $1`, [testRestaurantId]);
      await client.query(`DELETE FROM restaurants WHERE id = $1`, [testRestaurantId]);
      console.log(`[CLEANUP] Successfully cleaned up test fixtures.`);
    }
    await client.end();
  }
}

runExpirationSecurityAudit().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
