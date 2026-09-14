import pg from "pg";
import { z } from "zod";

const { Client } = pg;
const rawDbUrl = process.env.DATABASE_URL || "";
const isRemote = rawDbUrl.includes("supabase.com") || rawDbUrl.includes("sslmode=");
const cleanUrl = rawDbUrl.replace(/[\?&]sslmode=[^&]+/g, "").replace(/\?$/, "");

// Inline Schema & Rate Limiter for isolated runner
const TrackVisitPayloadSchema = z.object({
  restaurantSlug: z.string().min(1).max(100),
  source: z.enum(["qr", "share", "direct"]).default("direct"),
  tableNumber: z.string().trim().max(50).nullable().optional(),
  sessionId: z.string().min(8).max(100),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).default("mobile"),
  referrer: z.string().max(500).nullable().optional(),
});

const store = new Map();
function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const threshold = now - windowMs;
  const record = store.get(key) || { timestamps: [] };
  const valid = record.timestamps.filter((t) => t > threshold);

  if (valid.length >= limit) {
    return { success: false, remaining: 0 };
  }
  valid.push(now);
  store.set(key, { timestamps: valid });
  return { success: true, remaining: limit - valid.length };
}

async function runTests() {
  const client = new Client({
    connectionString: cleanUrl,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log("=================================================================");
    console.log(" DZMENU QR STUDIO & ANALYTICS INTEGRITY TEST SUITE");
    console.log("=================================================================\n");

    // 1. Get test restaurant
    const restRes = await client.query("SELECT id, slug, name, status FROM restaurants WHERE slug = 'salem' LIMIT 1");
    if (restRes.rows.length === 0) {
      throw new Error("Test restaurant 'salem' not found in database");
    }
    const restaurantA = restRes.rows[0];
    console.log(`[Setup] Primary Test Restaurant A: ${restaurantA.name} (${restaurantA.id})`);

    // Get or create a second restaurant for tenant isolation testing
    let restBRes = await client.query("SELECT id, slug, name FROM restaurants WHERE slug != 'salem' LIMIT 1");
    let restaurantB;
    if (restBRes.rows.length > 0) {
      restaurantB = restBRes.rows[0];
    } else {
      const createdB = await client.query(
        "INSERT INTO restaurants (name, slug, status, owner_id) VALUES ('Restaurant Beta', 'beta-test', 'ACTIVE', $1) RETURNING id, slug, name",
        [restaurantA.id]
      );
      restaurantB = createdB.rows[0];
    }
    console.log(`[Setup] Secondary Test Restaurant B: ${restaurantB.name} (${restaurantB.id})\n`);

    // Clean test tables
    await client.query("DELETE FROM menu_visits WHERE restaurant_id IN ($1, $2)", [restaurantA.id, restaurantB.id]);

    // Helper: Atomic record visit (replicates analyticsQueries.recordMenuVisit)
    async function recordVisit(restId, source, tableNum, sessionId, deviceType, customCreatedAt = "NOW()") {
      const res = await client.query(
        `INSERT INTO menu_visits (restaurant_id, source, table_number, session_id, device_type, created_at)
         SELECT $1::uuid, $2::varchar, $3::varchar, $4::varchar, $5::varchar, ${customCreatedAt}
         WHERE NOT EXISTS (
           SELECT 1 FROM menu_visits
           WHERE restaurant_id = $1::uuid
             AND session_id = $4::varchar
             AND created_at >= ${customCreatedAt} - INTERVAL '30 minutes'
         )
         RETURNING id`,
        [restId, source, tableNum, sessionId, deviceType]
      );
      return { recorded: res.rows.length > 0, id: res.rows[0]?.id };
    }

    // =========================================================================
    // TEST 1: Canonical QR Scan (QR -> ?src=qr -> MenuTracker)
    // =========================================================================
    console.log("▶ [Test 1] Canonical QR Scan Visit (source='qr')");
    const session1 = "sid_test_qr_user_01_" + Date.now();
    const t1 = await recordVisit(restaurantA.id, "qr", null, session1, "mobile");
    if (!t1.recorded) throw new Error("Test 1 failed: Initial QR visit was not recorded!");
    console.log("  ✓ Successfully recorded initial QR visit (id: " + t1.id + ")");

    // =========================================================================
    // TEST 2: QR Scan + Refresh / URL Cleansing (< 30 min, source='direct')
    // =========================================================================
    console.log("\n▶ [Test 2] QR Scan + Immediate Page Refresh (URL Cleansed to direct)");
    // Customer refreshes page, browser sends source='direct' with SAME session1
    const t2 = await recordVisit(restaurantA.id, "direct", null, session1, "mobile");
    if (t2.recorded) throw new Error("Test 2 failed: Refresh created a duplicate direct visit!");
    console.log("  ✓ Correctly deduplicated page refresh (did NOT insert second visit)");

    // =========================================================================
    // TEST 3: Share Link Attribution (source='share')
    // =========================================================================
    console.log("\n▶ [Test 3] Share Link Attribution (source='share')");
    const session2 = "sid_test_share_user_02_" + Date.now();
    const t3 = await recordVisit(restaurantA.id, "share", null, session2, "mobile");
    if (!t3.recorded) throw new Error("Test 3 failed: Share visit was not recorded!");
    console.log("  ✓ Successfully recorded share visit (id: " + t3.id + ")");

    // Share link refresh
    const t3_refresh = await recordVisit(restaurantA.id, "direct", null, session2, "mobile");
    if (t3_refresh.recorded) throw new Error("Test 3 failed: Share refresh created duplicate visit!");
    console.log("  ✓ Correctly deduplicated share link refresh");

    // =========================================================================
    // TEST 4: Direct / Organic Visit (source='direct')
    // =========================================================================
    console.log("\n▶ [Test 4] Direct / Organic Visit (source='direct')");
    const session3 = "sid_test_direct_user_03_" + Date.now();
    const t4 = await recordVisit(restaurantA.id, "direct", null, session3, "desktop");
    if (!t4.recorded) throw new Error("Test 4 failed: Direct visit was not recorded!");
    console.log("  ✓ Successfully recorded direct visit (id: " + t4.id + ")");

    // Direct refresh
    const t4_refresh = await recordVisit(restaurantA.id, "direct", null, session3, "desktop");
    if (t4_refresh.recorded) throw new Error("Test 4 failed: Direct refresh created duplicate visit!");
    console.log("  ✓ Correctly deduplicated direct refresh");

    // =========================================================================
    // TEST 5: New Session on Same Restaurant (< 30 min)
    // =========================================================================
    console.log("\n▶ [Test 5] Different Session IDs on Same Restaurant (< 30 min)");
    const session4 = "sid_test_different_user_04_" + Date.now();
    const t5 = await recordVisit(restaurantA.id, "qr", null, session4, "mobile");
    if (!t5.recorded) throw new Error("Test 5 failed: New session was wrongly deduplicated!");
    console.log("  ✓ Correctly allowed separate unique visitor session");

    // =========================================================================
    // TEST 6: Deduplication Window Expiry (> 30 minutes)
    // =========================================================================
    console.log("\n▶ [Test 6] Deduplication Window Expiry (> 30 minutes)");
    const session5 = "sid_test_expired_window_05_" + Date.now();
    // Visit 1: 45 minutes ago
    const t6_old = await recordVisit(restaurantA.id, "qr", null, session5, "mobile", "NOW() - INTERVAL '45 minutes'");
    if (!t6_old.recorded) throw new Error("Test 6 failed: Historical visit was not recorded!");

    // Visit 2: Now (45 min later) -> MUST be recorded
    const t6_new = await recordVisit(restaurantA.id, "qr", null, session5, "mobile", "NOW()");
    if (!t6_new.recorded) throw new Error("Test 6 failed: Returning visitor after 30 min was not recorded!");
    console.log("  ✓ Returning visitor after 30 min deduplication window recorded as new visit");

    // =========================================================================
    // TEST 7: Strict Multi-Tenant Isolation (Same session on Rest A and Rest B)
    // =========================================================================
    console.log("\n▶ [Test 7] Multi-Tenant Isolation (Same session across Restaurant A & B)");
    const sessionShared = "sid_shared_device_" + Date.now();
    const t7_a = await recordVisit(restaurantA.id, "qr", null, sessionShared, "mobile");
    const t7_b = await recordVisit(restaurantB.id, "qr", null, sessionShared, "mobile");
    if (!t7_a.recorded || !t7_b.recorded) {
      throw new Error("Test 7 failed: Multi-tenant isolation bug! One restaurant suppressed another!");
    }
    console.log("  ✓ Strict tenant isolation confirmed: Session recorded independently on both restaurants");

    // =========================================================================
    // TEST 8: Aggregate Summary Verification
    // =========================================================================
    console.log("\n▶ [Test 8] Mathematical Aggregation Consistency on Restaurant A");
    const aggRes = await client.query(
      `SELECT 
         COUNT(*)::text AS total_visits,
         COUNT(*) FILTER (WHERE source = 'qr')::text AS qr_visits,
         COUNT(*) FILTER (WHERE source = 'share')::text AS share_visits,
         COUNT(*) FILTER (WHERE source = 'direct')::text AS direct_visits
       FROM menu_visits
       WHERE restaurant_id = $1`,
      [restaurantA.id]
    );
    const agg = aggRes.rows[0];
    const total = parseInt(agg.total_visits, 10);
    const qr = parseInt(agg.qr_visits, 10);
    const share = parseInt(agg.share_visits, 10);
    const direct = parseInt(agg.direct_visits, 10);

    console.log(`  Aggregates: Total=${total}, QR=${qr}, Share=${share}, Direct=${direct}`);
    if (total !== qr + share + direct) {
      throw new Error("Test 8 failed: Total visits != QR + Share + Direct!");
    }
    // Expected on A:
    // Test 1: 1 QR
    // Test 3: 1 Share
    // Test 4: 1 Direct
    // Test 5: 1 QR
    // Test 6: 2 QR (1 old, 1 new)
    // Test 7: 1 QR
    // Total QR = 1 + 1 + 2 + 1 = 5, Share = 1, Direct = 1 => Total = 7
    if (total !== 7 || qr !== 5 || share !== 1 || direct !== 1) {
      throw new Error(`Test 8 failed: Counts mismatch! Expected Total=7 (5 QR, 1 Share, 1 Direct), Got Total=${total}`);
    }
    console.log("  ✓ Mathematical consistency 100% verified (Total = QR + Share + Direct)");

    // =========================================================================
    // TEST 9: Zod Schema Payload Validation
    // =========================================================================
    console.log("\n▶ [Test 9] Zod Ingestion Payload Validation");
    const validPayload = {
      restaurantSlug: "salem",
      source: "qr",
      sessionId: "sid_valid_12345678",
      deviceType: "mobile",
    };
    const p1 = TrackVisitPayloadSchema.safeParse(validPayload);
    if (!p1.success) throw new Error("Test 9 failed: Valid payload rejected!");

    const invalidSource = {
      restaurantSlug: "salem",
      source: "hacked_source",
      sessionId: "sid_valid_12345678",
      deviceType: "mobile",
    };
    const p2 = TrackVisitPayloadSchema.safeParse(invalidSource);
    if (p2.success) throw new Error("Test 9 failed: Invalid source accepted!");

    const shortSession = {
      restaurantSlug: "salem",
      source: "qr",
      sessionId: "short",
      deviceType: "mobile",
    };
    const p3 = TrackVisitPayloadSchema.safeParse(shortSession);
    if (p3.success) throw new Error("Test 9 failed: Short session ID accepted!");
    console.log("  ✓ Schema strictly validates source enums, session length, and required fields");

    // =========================================================================
    // TEST 10: Ingestion Rate Limiter Verification
    // =========================================================================
    console.log("\n▶ [Test 10] IP Sliding-Window Rate Limiting");
    const testIp = "192.168.1.100";
    const limit = 5;
    const windowMs = 2000;

    for (let i = 1; i <= 5; i++) {
      const rl = checkRateLimit(testIp, limit, windowMs);
      if (!rl.success) throw new Error(`Test 10 failed: Request ${i} was prematurely rate limited!`);
    }

    // 6th request must be blocked
    const rlBlocked = checkRateLimit(testIp, limit, windowMs);
    if (rlBlocked.success) throw new Error("Test 10 failed: Rate limit did not block excessive requests!");
    console.log("  ✓ Rate limiter successfully throttles excessive ingestion requests");

    console.log("\n=================================================================");
    console.log(" ✅ ALL 10 TEST SUITES PASSED (100% SUCCESS)");
    console.log("=================================================================\n");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTests();
