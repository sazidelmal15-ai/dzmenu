/**
 * Craving Theme — Settings Migrations
 */

import { migrateLegacyCravingSettings, resolveCravingRuntimeSettings } from "./schema";

export function migrateCravingSettings(raw: unknown): Record<string, unknown> {
  return migrateLegacyCravingSettings(raw);
}

export { resolveCravingRuntimeSettings };
