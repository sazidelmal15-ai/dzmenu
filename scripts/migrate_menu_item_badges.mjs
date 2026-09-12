import pg from "pg";
import fs from "fs";
import path from "path";

const { Client } = pg;

// Read .env.local or .env if DATABASE_URL not in process.env
function loadEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          let val = trimmed.substring("DATABASE_URL=".length).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          return val;
        }
      }
    }
  }
  return null;
}

const connectionString = loadEnv();
if (!connectionString) {
  console.error("Error: DATABASE_URL not found in environment or .env files.");
  process.exit(1);
}

async function run() {
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  const client = new Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    console.log("Connecting to PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully.");

    console.log("Applying columns 'badge' and 'tags' to menu_items table...");
    await client.query(`
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS badge VARCHAR(50) NULL;
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    console.log("✅ Successfully added 'badge' and 'tags' columns to menu_items table!");

    // Verify
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'menu_items' AND column_name IN ('badge', 'tags');
    `);
    console.log("Verified columns in menu_items:");
    console.table(res.rows);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
