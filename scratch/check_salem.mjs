import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres.qhrwwmepzrgjdqxgxeff:%2A20Sa15lEm09%2A@aws-1-eu-west-1.pooler.supabase.com:5432/postgres' });
async function check() {
  const r = await pool.query('SELECT r.id, r.name, r.slug, t.preset_id, t.settings FROM restaurants r LEFT JOIN restaurant_themes t ON t.restaurant_id = r.id WHERE r.slug = $1', ['salem']);
  console.log(JSON.stringify(r.rows, null, 2));
  await pool.end();
}
check().catch(console.error);
