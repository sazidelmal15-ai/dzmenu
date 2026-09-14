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

const client = new Client({ connectionString });

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Phase 1 migrations...");

    // 1. Ensure admin_audit_logs table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
          actor_id              UUID          NULL REFERENCES users(id) ON DELETE SET NULL,
          actor_email           VARCHAR(255)  NOT NULL,
          action                VARCHAR(100)  NOT NULL,
          target_restaurant_id  UUID          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          target_restaurant_name VARCHAR(255) NOT NULL,
          previous_state        JSONB         NULL,
          new_state             JSONB         NULL,
          reason                TEXT          NULL,
          metadata              JSONB         NOT NULL DEFAULT '{}'::jsonb,
          created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_restaurant 
          ON admin_audit_logs(target_restaurant_id);

      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor 
          ON admin_audit_logs(actor_id);

      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action 
          ON admin_audit_logs(action);

      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at 
          ON admin_audit_logs(created_at DESC);
    `);

    console.log("✅ admin_audit_logs table and indexes verified/created.");

    // 2. Verify schema structure
    const checkTable = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_audit_logs'
      ORDER BY ordinal_position;
    `);

    console.log("Table columns:");
    console.table(checkTable.rows);

    console.log("Phase 1 database migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
