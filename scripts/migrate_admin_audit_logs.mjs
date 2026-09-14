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

// Support connection string on port 5432 or 6543
const urlsToTry = [
  connectionString,
  connectionString.replace(":6543", ":5432"),
  connectionString.replace("aws-1-eu-west-1.pooler.supabase.com:6543", "aws-1-eu-west-1.pooler.supabase.com:5432"),
  connectionString.replace("aws-1-eu-west-1.pooler.supabase.com:6543", "db.qhrwwmepzrgjdqxgxeff.supabase.co:5432")
];

async function tryConnectAndMigrate() {
  let lastError = null;

  for (const url of urlsToTry) {
    const cleanUrl = url.replace(/[\?&]sslmode=[^&]+/g, "").replace(/\?$/, "");
    console.log(`Attempting connection to DB (${cleanUrl.split('@')[1]})...`);
    const client = new Client({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log("Connected successfully! Applying audit retention migration...");

      // 1. Ensure table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
            id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_id              UUID          NULL REFERENCES users(id) ON DELETE SET NULL,
            actor_email           VARCHAR(255)  NOT NULL,
            action                VARCHAR(100)  NOT NULL,
            target_restaurant_id  UUID          NULL REFERENCES restaurants(id) ON DELETE SET NULL,
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

      // 2. Ensure target_restaurant_id is nullable with ON DELETE SET NULL
      await client.query(`
        ALTER TABLE admin_audit_logs 
            ALTER COLUMN target_restaurant_id DROP NOT NULL;

        DO $$
        DECLARE
            fk_name text;
        BEGIN
            FOR fk_name IN (
                SELECT tc.constraint_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = 'admin_audit_logs'
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND kcu.column_name = 'target_restaurant_id'
            ) LOOP
                EXECUTE 'ALTER TABLE admin_audit_logs DROP CONSTRAINT ' || quote_ident(fk_name);
            END LOOP;
        END $$;

        ALTER TABLE admin_audit_logs
            ADD CONSTRAINT fk_admin_audit_logs_target_restaurant
            FOREIGN KEY (target_restaurant_id)
            REFERENCES restaurants(id)
            ON DELETE SET NULL;
      `);

      console.log("✅ admin_audit_logs table and ON DELETE SET NULL retention constraint applied!");

      // 3. Verify columns
      const checkCols = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'admin_audit_logs'
        ORDER BY ordinal_position;
      `);
      console.table(checkCols.rows);

      // 4. Verify foreign key delete rule
      const checkFk = await client.query(`
        SELECT tc.constraint_name, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc 
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'admin_audit_logs'
          AND tc.constraint_name = 'fk_admin_audit_logs_target_restaurant';
      `);
      console.table(checkFk.rows);

      await client.end();
      console.log("Migration finished successfully.");
      process.exit(0);
    } catch (err) {
      console.warn(`Connection attempt failed: ${err.message}`);
      lastError = err;
      try { await client.end(); } catch {}
    }
  }

  console.error("All connection attempts failed:", lastError);
  process.exit(1);
}

tryConnectAndMigrate();
