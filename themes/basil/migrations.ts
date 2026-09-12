/**
 * Basil Theme — Settings Migrations
 */

import { migrateLegacyBasilSettings, resolveBasilRuntimeSettings } from "./schema";

export function migrateBasilSettings(raw: unknown): Record<string, unknown> {
  return migrateLegacyBasilSettings(raw);
}

export { resolveBasilRuntimeSettings };
