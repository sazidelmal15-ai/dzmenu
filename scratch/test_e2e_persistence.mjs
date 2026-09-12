import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const themeId = "ccf35b82-5846-4e4d-b91f-82a3ff9d1841";
  
  // 1. Read
  const initial = await pool.query("SELECT * FROM restaurant_themes WHERE id = $1", [themeId]);
  console.log("1. Initial settings in DB:", initial.rows[0].settings);

  // 2. Simulate User Modifying in Theme Editor
  const modified = {
    ...initial.rows[0].settings,
    paletteId: "matcha_latte",
    greeting: {
      title: "Ahlan Salem",
      subtitle: "Pastry & Coffee"
    },
    splash: {
      enabled: true,
      title: "Salem Bakery",
      subtitle: "ARTISAN SWEETS",
      auto_dismiss_seconds: 3.0
    }
  };

  // 3. Save to DB (simulating PATCH /api/restaurant/themes/[id])
  await pool.query(
    "UPDATE restaurant_themes SET settings = $1::jsonb, updated_at = NOW() WHERE id = $2",
    [JSON.stringify(modified), themeId]
  );
  console.log("2. Updated in DB!");

  // 4. Simulate Page Refresh (SELECT again)
  const afterRefresh = await pool.query("SELECT * FROM restaurant_themes WHERE id = $1", [themeId]);
  console.log("3. Read after Refresh in DB:", afterRefresh.rows[0].settings);

  if (
    afterRefresh.rows[0].settings.greeting.title === "Ahlan Salem" &&
    afterRefresh.rows[0].settings.paletteId === "matcha_latte" &&
    afterRefresh.rows[0].settings.splash.title === "Salem Bakery"
  ) {
    console.log("🎉 SUCCESS: Persistence across refresh verified 100%!");
  } else {
    console.error("❌ FAILED: Values did not match!");
    process.exit(1);
  }

  await pool.end();
}

main().catch(console.error);
