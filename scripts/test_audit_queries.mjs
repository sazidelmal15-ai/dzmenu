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

async function runTest() {
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
    console.error("Could not connect to database");
    process.exit(1);
  }

  try {
    console.log("Connected to database. Testing Audit Log Retention...");

    // 1. Fetch a restaurant
    const restRes = await client.query(`SELECT id, name FROM restaurants LIMIT 1`);
    if (restRes.rows.length === 0) {
      console.log("No restaurants found to test with.");
      process.exit(0);
    }
    const rest = restRes.rows[0];

    // 2. Fetch admin user
    const userRes = await client.query(`SELECT id, email FROM users WHERE role = 'SUPER_OWNER' LIMIT 1`);
    const adminUser = userRes.rows[0] || { id: null, email: 'admin@dzmenu.local' };

    // 3. Insert a structured test audit record with target_restaurant_id
    const insertRes = await client.query(`
      INSERT INTO admin_audit_logs (
        actor_id, actor_email, action,
        target_restaurant_id, target_restaurant_name,
        previous_state, new_state, reason, metadata, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      ) RETURNING id, action, target_restaurant_id, target_restaurant_name, created_at
    `, [
      adminUser.id,
      adminUser.email,
      'ACTIVATE_ANNUAL',
      rest.id,
      rest.name,
      JSON.stringify({ status: 'INACTIVE', expiresAt: null }),
      JSON.stringify({ status: 'ACTIVE', expiresAt: new Date(Date.now() + 365*24*60*60*1000).toISOString() }),
      'Phase 1 automated schema verification test',
      JSON.stringify({ testRun: true })
    ]);

    const created = insertRes.rows[0];
    console.log("✅ Inserted test audit record with restaurant link:", created);

    // 4. Test nullable target_restaurant_id (retention test when restaurant is deleted or unlinked)
    const insertNullRest = await client.query(`
      INSERT INTO admin_audit_logs (
        actor_id, actor_email, action,
        target_restaurant_id, target_restaurant_name,
        previous_state, new_state, reason, metadata, created_at
      ) VALUES (
        $1, $2, $3, NULL, $4, $5, $6, $7, $8, NOW()
      ) RETURNING id, action, target_restaurant_id, target_restaurant_name, created_at
    `, [
      adminUser.id,
      adminUser.email,
      'SUSPEND_RESTAURANT',
      'Archived/Deleted Restaurant Name Intact',
      JSON.stringify({ status: 'ACTIVE' }),
      JSON.stringify({ status: 'SUSPENDED' }),
      'Retention verification for deleted restaurant',
      JSON.stringify({ retentionTest: true })
    ]);

    const createdNull = insertNullRest.rows[0];
    console.log("✅ Inserted audit record with preserved name and NULL target_restaurant_id:", createdNull);

    // 5. Query both records back
    const fetchRes = await client.query(`
      SELECT id, actor_email, action, target_restaurant_id, target_restaurant_name, previous_state, new_state, reason, created_at
      FROM admin_audit_logs
      WHERE id IN ($1, $2)
      ORDER BY created_at DESC
    `, [created.id, createdNull.id]);

    console.log("✅ Fetched test audit records successfully:");
    console.table(fetchRes.rows);

    // 6. Clean up test records
    await client.query(`DELETE FROM admin_audit_logs WHERE id IN ($1, $2)`, [created.id, createdNull.id]);
    console.log("✅ Cleaned up test records.");

    console.log("All audit retention tests PASSED successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTest();
