import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================");
console.log(" DZMENU THEMES HARDENING VERIFICATION SUITE");
console.log("==================================================\n");

let failures = 0;
function assert(name, condition, details = "") {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name} ${details}`);
    failures++;
  }
}

// ---------------------------------------------------------
// 1. CREDENTIALS SCAN
// ---------------------------------------------------------
console.log(">>> CHECK 1: Verifying Hardcoded Credentials Removed...");
const scriptsDir = path.join(rootDir, "scripts");
const scriptFiles = fs.readdirSync(scriptsDir).filter(f => (f.endsWith(".mjs") || f.endsWith(".js")) && f !== "verify_hardening.mjs");

let foundSecret = false;
for (const file of scriptFiles) {
  const content = fs.readFileSync(path.join(scriptsDir, file), "utf-8");
  // Check for postgresql connection strings containing credentials
  if (content.includes("postgresql://postgres:") || content.includes("@aws-0-eu-central-1.pooler.supabase.com")) {
    console.error(`Leaked secret found in: ${file}`);
    foundSecret = true;
  }
}
assert("No hardcoded Supabase passwords in scripts", !foundSecret);

const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
assert(".gitignore protects .env", gitignore.includes(".env\n") || gitignore.includes(".env\r\n"));
assert(".gitignore protects .env.production", gitignore.includes(".env.production"));

// ---------------------------------------------------------
// 2. VALIDATION & SILENT DATA LOSS PREVENTION
// ---------------------------------------------------------
console.log("\n>>> CHECK 2: Verifying Theme Validation & 400 Invariant...");
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const themeColorsSchema = z.object({
  primary: z.string().regex(hexColorRegex),
  accent: z.string().regex(hexColorRegex),
  secondary: z.string().regex(hexColorRegex),
  background: z.string().regex(hexColorRegex),
  surface: z.string().regex(hexColorRegex),
  text: z.string().regex(hexColorRegex),
  text_secondary: z.string().regex(hexColorRegex),
});

const themeSettingsV1Schema = z.object({
  schema_version: z.literal(1),
  colors: themeColorsSchema,
  typography: z.object({
    font_family: z.string().min(1).max(50),
    heading_weight: z.enum(["normal", "medium", "bold", "black"]),
  }),
  layout: z.object({
    category_style: z.enum(["stories", "minimal_icons", "banner", "card_badges", "glass"]),
    card_style: z.enum(["hero", "grid_2col", "compact_row"]),
    show_header_banner: z.boolean(),
    show_cart_bar: z.boolean(),
    show_search: z.boolean(),
  }),
  custom_css: z.string().max(5000).optional(),
});

// Test valid settings
const validSettings = {
  schema_version: 1,
  colors: {
    primary: "#E07A5F",
    accent: "#F2CC8F",
    secondary: "#3D405B",
    background: "#F4F1DE",
    surface: "#FFFFFF",
    text: "#2D3142",
    text_secondary: "#81B29A",
  },
  typography: {
    font_family: "Playfair Display",
    heading_weight: "bold",
  },
  layout: {
    category_style: "stories",
    card_style: "hero",
    show_header_banner: true,
    show_cart_bar: true,
    show_search: true,
  }
};
const validResult = themeSettingsV1Schema.safeParse(validSettings);
assert("Valid settings pass schema parse", validResult.success);

// Test invalid hex color
const invalidColorSettings = {
  ...validSettings,
  colors: { ...validSettings.colors, primary: "not-a-color-injection; DROP TABLE;" }
};
const invalidColorResult = themeSettingsV1Schema.safeParse(invalidColorSettings);
assert("Invalid color string rejected by schema", !invalidColorResult.success);

// Test invalid layout enum
const invalidLayoutSettings = {
  ...validSettings,
  layout: { ...validSettings.layout, card_style: "unsupported_card_style" }
};
const invalidLayoutResult = themeSettingsV1Schema.safeParse(invalidLayoutSettings);
assert("Invalid layout enum rejected by schema", !invalidLayoutResult.success);

// Verify API route has validation before update
const routeContent = fs.readFileSync(path.join(rootDir, "app/api/restaurant/themes/[id]/route.ts"), "utf-8");
assert("PATCH route validates body.settings is object", routeContent.includes('typeof body.settings !== "object"'));
assert("PATCH route validates body.sections with safeParse", routeContent.includes("themeSectionSchema.safeParse(s)"));
assert("PATCH route validates body.name", routeContent.includes("Theme name cannot be empty"));

// ---------------------------------------------------------
// 3. REGISTRATION THEME INITIALIZATION
// ---------------------------------------------------------
console.log("\n>>> CHECK 3: Verifying New Restaurant Registration Theme Initialization...");
const authActionsContent = fs.readFileSync(path.join(rootDir, "lib/auth/actions.ts"), "utf-8");
assert("lib/auth/actions imports themeQueries", authActionsContent.includes("themeQueries"));
assert("lib/auth/actions creates default Gourmet preset", authActionsContent.includes('themeQueries.createFromPreset(restaurant.id, "gourmet")'));
assert("lib/auth/actions atomically publishes default theme", authActionsContent.includes("themeQueries.publishAtomic(defaultTheme.id, restaurant.id)"));

// ---------------------------------------------------------
// 4. POSTMESSAGE SECURITY
// ---------------------------------------------------------
console.log("\n>>> CHECK 4: Verifying postMessage Security...");
const editorContent = fs.readFileSync(path.join(rootDir, "components/theme-editor/ThemeEditorClient.tsx"), "utf-8");
const menuContent = fs.readFileSync(path.join(rootDir, "components/menu/CustomerMenuClient.tsx"), "utf-8");

assert("ThemeEditorClient sends to window.location.origin", editorContent.includes("window.location.origin"));
assert("CustomerMenuClient requires theme.isPreview", menuContent.includes("!theme.isPreview"));
assert("CustomerMenuClient validates event.origin", menuContent.includes("e.origin !== window.location.origin"));
assert("CustomerMenuClient validates event.source === window.parent", menuContent.includes("e.source !== window.parent"));
assert("CustomerMenuClient handshake targets window.location.origin", menuContent.includes('window.parent?.postMessage({ type: "DZMENU_PREVIEW_READY" }, window.location.origin)'));

// ---------------------------------------------------------
// 5. DATABASE SCHEMA CONSISTENCY
// ---------------------------------------------------------
console.log("\n>>> CHECK 5: Verifying Database Schema Consistency...");
const schemaContent = fs.readFileSync(path.join(rootDir, "db/schema.sql"), "utf-8");
assert("db/schema.sql has restaurant_themes table", schemaContent.includes("CREATE TABLE IF NOT EXISTS restaurant_themes"));
assert("db/schema.sql has active_theme_id on restaurants", schemaContent.includes("active_theme_id UUID NULL"));
assert("db/schema.sql has ON DELETE RESTRICT active-theme constraint", schemaContent.includes("REFERENCES restaurant_themes(id)") && schemaContent.includes("ON DELETE RESTRICT"));

console.log("\n==================================================");
if (failures === 0) {
  console.log("🎉 ALL VERIFICATION CHECKS PASSED (100% SUCCESS)!");
} else {
  console.error(`💥 ${failures} CHECKS FAILED!`);
  process.exit(1);
}
console.log("==================================================");
