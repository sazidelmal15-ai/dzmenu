import pg from "pg";
const pool = new pg.Pool({
  connectionString: "postgresql://postgres.qhrwwmepzrgjdqxgxeff:%2A20Sa15lEm09%2A@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const res = await pool.query("SELECT name, operating_hours FROM restaurants WHERE subdomain = 'salem'");
  console.log("RESTAURANT:", res.rows[0]?.name);
  console.log("OPERATING_HOURS:", JSON.stringify(res.rows[0]?.operating_hours, null, 2));
  await pool.end();
}
run();
