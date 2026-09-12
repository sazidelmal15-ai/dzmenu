import pg from "pg";
const pool = new pg.Pool({
  connectionString: "postgresql://postgres.qhrwwmepzrgjdqxgxeff:%2A20Sa15lEm09%2A@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const res = await pool.query("SELECT name, slug, wifi_ssid, wifi_password FROM restaurants WHERE slug = 'salem'");
  console.log("RESTAURANT:", res.rows[0]?.name);
  console.log("WIFI_SSID:", res.rows[0]?.wifi_ssid);
  console.log("WIFI_PASSWORD:", res.rows[0]?.wifi_password);
  await pool.end();
}
run();
