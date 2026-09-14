import { z } from "zod";

/**
 * Server and Client environment variable schemas.
 * Server variables will fail if accessed in client components.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long for cryptographic safety")
    .default("development_auth_secret_minimum_32_chars_long_placeholder"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://dzmenu_user:dzmenu_password@localhost:5432/dzmenu_db"),
});

// Validate environment variables at boot/import time
const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://www.softscape.xyz",
  AUTH_SECRET: process.env.AUTH_SECRET || "development_auth_secret_minimum_32_chars_long_placeholder",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://dzmenu_user:dzmenu_password@localhost:5432/dzmenu_db",
});

// In production, environment validation failure is a fatal startup error.
// In development/test, gracefully fall back to defaults to avoid blocking local dev.
if (!parsedEnv.success && process.env.NODE_ENV === "production") {
  console.error(
    "❌ FATAL: Environment validation failed in production. " +
    "Refusing to start with insecure defaults.\n",
    parsedEnv.error.flatten().fieldErrors
  );
  throw new Error(
    "Missing or invalid environment variables in production. " +
    "Ensure AUTH_SECRET, DATABASE_URL, and NEXT_PUBLIC_APP_URL are correctly configured."
  );
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://www.softscape.xyz",
      AUTH_SECRET:
        process.env.AUTH_SECRET || "development_auth_secret_minimum_32_chars_long_placeholder",
      DATABASE_URL:
        process.env.DATABASE_URL || "postgresql://dzmenu_user:dzmenu_password@localhost:5432/dzmenu_db",
    };
