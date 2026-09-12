/**
 * Noir Theme — Settings Migrations
 */

import { migrateLegacyNoirSettings, resolveNoirRuntimeSettings } from "./schema";

export function migrateNoirSettings(raw: unknown): Record<string, unknown> {
  return migrateLegacyNoirSettings(raw);
}

export { resolveNoirRuntimeSettings };
