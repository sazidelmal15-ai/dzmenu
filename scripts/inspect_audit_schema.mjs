import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const connectionString = process.env.DATABASE_URL;
const cleanUrl = connectionString.replace(":6543", ":5432").replace(/[\?&]sslmode=[^&]+/g, "").replace(/\?$/, "");

async function main() {
  const client = new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'admin_audit_logs' 
    ORDER BY ordinal_position
  `);
  console.log('Columns in admin_audit_logs:');
  console.table(cols.rows);

  const idxs = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'admin_audit_logs'
  `);
  console.log('Indexes on admin_audit_logs:');
  console.table(idxs.rows);

  // Check sample rows
  const samples = await client.query(`
    SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 3
  `);
  console.log('Sample rows:');
  console.dir(samples.rows, { depth: 3 });

  await client.end();
}

main().catch(console.error);
