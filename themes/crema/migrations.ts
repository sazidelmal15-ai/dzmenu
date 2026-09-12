/**
 * Crema Theme — Settings Migrations
 */

import { migrateLegacyCremaSettings, resolveCremaRuntimeSettings } from "./schema";

export function migrateCremaSettings(raw: unknown): Record<string, unknown> {
  return migrateLegacyCremaSettings(raw);
}

export { resolveCremaRuntimeSettings };
