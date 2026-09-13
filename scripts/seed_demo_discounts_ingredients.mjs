import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Seeding sample ingredients and timed discounts on demo menu items...");

  // 1. Update Burger items
  await pool.query(`
    UPDATE menu_items 
    SET original_price = 1100.00,
        ingredients = $1::jsonb
    WHERE name ILIKE '%Burger%'
  `, [
    JSON.stringify([
      "شريحة لحم بقري أنجوس مشوية",
      "جبنة شيدر إنجليزية ذائبة",
      "خس مقرمش طازج",
      "شرائح طماطم وبصل مكرمل",
      "صلصة برجر مدخنة خاصة",
      "خبز بريوش طازج محمص بالزبدة"
    ])
  ]);

  // 2. Update Pizza items
  await pool.query(`
    UPDATE menu_items 
    SET original_price = 1250.00,
        ingredients = $1::jsonb
    WHERE name ILIKE '%Pizza%'
  `, [
    JSON.stringify([
      "عجينة نابوليتان مخمرة 48 ساعة",
      "صلصة طماطم سان مارزانو الإيطالية",
      "جبنة موزاريلا بوفالو طازجة",
      "أوراق ريحان عطري طازج",
      "رشة زيت زيتون بكر ممتاز"
    ])
  ]);

  console.log("✅ Successfully seeded sample ingredients and discounts!");
  await pool.end();
}

main().catch((err) => {
  console.error("Failed to seed:", err);
  process.exit(1);
});
