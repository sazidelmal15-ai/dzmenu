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
  console.error("Error: DATABASE_URL is required.");
  process.exit(1);
}

const urlsToTry = [
  connectionString.replace(":6543", ":5432"),
  connectionString,
  connectionString.replace("aws-1-eu-west-1.pooler.supabase.com:6543", "aws-1-eu-west-1.pooler.supabase.com:5432")
];

async function inspectDatabaseData() {
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
    console.error("Failed to connect to database.");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("DATABASE RECORD INSPECTION (READ-ONLY)");
  console.log("==================================================================");

  try {
    // 1. List real restaurants
    const restRes = await client.query(`
      SELECT id, name, slug, status, created_at
      FROM restaurants
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    console.log(`\n--- RESTAURANTS IN DB (${restRes.rows.length} total) ---`);
    console.table(restRes.rows.map(r => ({
      id: r.id.substring(0, 8) + '...',
      name: r.name,
      slug: r.slug,
      status: r.status,
      createdAt: r.created_at?.toISOString()?.substring(0, 10),
    })));

    // 2. List subscriptions
    const subRes = await client.query(`
      SELECT s.id, s.restaurant_id, r.name as restaurant_name, s.plan, s.status, s.current_period_end
      FROM subscriptions s
      LEFT JOIN restaurants r ON r.id = s.restaurant_id
      ORDER BY s.updated_at DESC
    `);
    console.log(`\n--- SUBSCRIPTIONS IN DB (${subRes.rows.length} total) ---`);
    console.table(subRes.rows.map(s => ({
      subId: s.id.substring(0, 8) + '...',
      restaurant: s.restaurant_name || s.restaurant_id.substring(0, 8),
      plan: s.plan,
      status: s.status,
      periodEnd: s.current_period_end?.toISOString(),
    })));

    // 3. Count audit logs
    const auditRes = await client.query(`SELECT COUNT(*)::int as count FROM admin_audit_logs`);
    console.log(`\n--- AUDIT LOGS IN DB ---`);
    console.log(`Total Audit Logs: ${auditRes.rows[0].count}`);

    // 4. Run KPI query
    const kpiRes = await client.query(`
      SELECT 
        COUNT(r.id)::int AS "totalRestaurants",
        COUNT(CASE WHEN (s.status = 'ACTIVE') AND s.current_period_end > NOW() AND r.status != 'SUSPENDED' THEN 1 END)::int AS "activeCount",
        COUNT(CASE WHEN (s.status = 'TRIALING' OR s.status = 'TRIAL') AND s.current_period_end > NOW() AND r.status != 'SUSPENDED' THEN 1 END)::int AS "trialCount",
        COUNT(CASE WHEN (s.current_period_end <= NOW() OR s.status = 'EXPIRED' OR s.status = 'INACTIVE' OR s.status IS NULL) AND r.status != 'SUSPENDED' THEN 1 END)::int AS "expiredCount",
        COUNT(CASE WHEN r.status = 'SUSPENDED' OR s.status = 'SUSPENDED' THEN 1 END)::int AS "suspendedCount"
      FROM restaurants r
      LEFT JOIN subscriptions s ON s.restaurant_id = r.id
      WHERE r.deleted_at IS NULL
    `);
    console.log(`\n--- AGGREGATED KPI QUERY RESULT ---`);
    console.log(kpiRes.rows[0]);

  } finally {
    await client.end();
  }
}

inspectDatabaseData().catch(console.error);
