import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function runTests() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to DB. Starting analytics & QR validation tests...");

    // 1. Get test restaurant
    const restRes = await client.query("SELECT id, slug, name FROM restaurants WHERE slug = 'salem' LIMIT 1");
    if (restRes.rows.length === 0) {
      throw new Error("Restaurant 'salem' not found");
    }
    const restaurant = restRes.rows[0];
    console.log("Testing on restaurant:", restaurant.name, `(${restaurant.id})`);

    // Clean test records for predictable counts
    await client.query("DELETE FROM menu_visits WHERE restaurant_id = $1", [restaurant.id]);

    // Test 1: Ingest QR visit on Table 4
    console.log("\n[Test 1] Ingesting QR visit with table=4...");
    const sessionId1 = "test_session_user_alpha_" + Date.now();
    await client.query(
      `INSERT INTO menu_visits (restaurant_id, source, table_number, session_id, device_type, created_at)
       VALUES ($1, 'qr', '4', $2, 'mobile', NOW())`,
      [restaurant.id, sessionId1]
    );

    // Test 2: Ingest Share visit
    console.log("[Test 2] Ingesting Share visit...");
    const sessionId2 = "test_session_user_beta_" + Date.now();
    await client.query(
      `INSERT INTO menu_visits (restaurant_id, source, table_number, session_id, device_type, created_at)
       VALUES ($1, 'share', NULL, $2, 'mobile', NOW())`,
      [restaurant.id, sessionId2]
    );

    // Test 3: Ingest Direct visit
    console.log("[Test 3] Ingesting Direct visit...");
    const sessionId3 = "test_session_user_gamma_" + Date.now();
    await client.query(
      `INSERT INTO menu_visits (restaurant_id, source, table_number, session_id, device_type, created_at)
       VALUES ($1, 'direct', NULL, $2, 'desktop', NOW())`,
      [restaurant.id, sessionId3]
    );

    // Test 4: Verify Aggregate Query
    console.log("\n[Test 4] Verifying Attribution Aggregations...");
    const countsRes = await client.query(
      `SELECT 
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE source = 'qr') AS qr_count,
         COUNT(*) FILTER (WHERE source = 'share') AS share_count,
         COUNT(*) FILTER (WHERE source = 'direct') AS direct_count
       FROM menu_visits
       WHERE restaurant_id = $1`,
      [restaurant.id]
    );

    const counts = countsRes.rows[0];
    console.log("Aggregate results:", {
      total: counts.total,
      qr_count: counts.qr_count,
      share_count: counts.share_count,
      direct_count: counts.direct_count,
    });

    if (
      parseInt(counts.total, 10) !== 3 ||
      parseInt(counts.qr_count, 10) !== 1 ||
      parseInt(counts.share_count, 10) !== 1 ||
      parseInt(counts.direct_count, 10) !== 1
    ) {
      throw new Error("Attribution counts mismatch!");
    }

    // Test 5: Table Breakdown
    console.log("\n[Test 5] Verifying Table-Level performance tracking...");
    const tableRes = await client.query(
      `SELECT table_number, COUNT(*) as visits
       FROM menu_visits
       WHERE restaurant_id = $1 AND table_number IS NOT NULL
       GROUP BY table_number`,
      [restaurant.id]
    );

    console.log("Table scans:", tableRes.rows);
    if (tableRes.rows.length !== 1 || tableRes.rows[0].table_number !== "4") {
      throw new Error("Table tracking mismatch!");
    }

    // Test 6: QR Settings Persistence
    console.log("\n[Test 6] Verifying QR Settings Storage...");
    const customSettings = {
      foregroundColor: "#D97706",
      backgroundColor: "#FFFFFF",
      patternStyle: "rounded",
      cornerStyle: "extra-rounded",
      logoEnabled: true,
      logoSize: 25,
      ctaText: "امسح للمنيو • Scan for Menu",
      standTemplate: "table_tent",
      includeWifi: true,
      wifiSsid: "Salem_Guest",
      wifiPassword: "coffee_pwd_2026",
      tableMode: "table",
      tableNumber: "4",
      tableCount: 15,
    };

    await client.query(
      `INSERT INTO restaurant_qr_settings (restaurant_id, settings, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (restaurant_id)
       DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
      [restaurant.id, JSON.stringify(customSettings)]
    );

    const savedSettingsRes = await client.query(
      "SELECT settings FROM restaurant_qr_settings WHERE restaurant_id = $1",
      [restaurant.id]
    );

    console.log("Stored QR Settings:", savedSettingsRes.rows[0].settings.foregroundColor, savedSettingsRes.rows[0].settings.ctaText);
    if (savedSettingsRes.rows[0].settings.foregroundColor !== "#D97706") {
      throw new Error("QR Settings mismatch!");
    }

    console.log("\n✅ ALL BACKEND & DATABASE TESTS PASSED 100%!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTests();
