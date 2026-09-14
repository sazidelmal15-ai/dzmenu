import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function testAuditQueries() {
  try {
    await client.connect();
    console.log("Testing Audit Log Insert and Fetch...");

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

    // 3. Insert a structured test audit record
    const insertRes = await client.query(`
      INSERT INTO admin_audit_logs (
        actor_id, actor_email, action,
        target_restaurant_id, target_restaurant_name,
        previous_state, new_state, reason, metadata, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      ) RETURNING id, action, target_restaurant_name, created_at
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
    console.log("✅ Inserted test audit record:", created);

    // 4. Query it back
    const fetchRes = await client.query(`
      SELECT id, actor_email, action, target_restaurant_name, previous_state, new_state, reason, created_at
      FROM admin_audit_logs
      WHERE id = $1
    `, [created.id]);

    console.log("✅ Fetched test audit record successfully:", fetchRes.rows[0]);

    // 5. Clean up test record
    await client.query(`DELETE FROM admin_audit_logs WHERE id = $1`, [created.id]);
    console.log("✅ Cleaned up test record.");

    console.log("Phase 1 verification passed with 0 errors.");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testAuditQueries();
