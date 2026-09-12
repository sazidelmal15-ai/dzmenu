/**
 * Craving Theme — Autonomous Package Index
 */

import type { ThemePackage } from "@/types/theme-contract";
import { CRAVING_MANIFEST } from "./manifest";
import { CravingSettingsSchema, resolveCravingRuntimeSettings } from "./schema";
import { generateCssVariables } from "./tokens";
import { CRAVING_EDITOR_CONTROLS } from "./controls";
import { CRAVING_PALETTES, CRAVING_PALETTE_OPTIONS } from "./palettes";
import { CravingMainTemplate } from "./templates/MainTemplate";
import { CravingItemSheetTemplate } from "./templates/ItemSheetTemplate";

export const cravingPackage: ThemePackage = {
  manifest: CRAVING_MANIFEST,
  validateSettings: (raw: unknown) => {
    return resolveCravingRuntimeSettings(raw);
  },
  generateCssVariables: (settings: Record<string, unknown>) => {
    const validated = resolveCravingRuntimeSettings(settings);
    return generateCssVariables(validated);
  },
  editorControls: CRAVING_EDITOR_CONTROLS,
  templates: {
    main: CravingMainTemplate,
    item: CravingItemSheetTemplate,
  },
};

export default cravingPackage;
export {
  CRAVING_MANIFEST,
  CravingSettingsSchema,
  generateCssVariables,
  CRAVING_EDITOR_CONTROLS,
  CRAVING_PALETTES,
  CRAVING_PALETTE_OPTIONS,
  resolveCravingRuntimeSettings,
  CravingMainTemplate,
  CravingItemSheetTemplate,
};
