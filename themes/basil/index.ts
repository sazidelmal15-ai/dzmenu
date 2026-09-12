/**
 * Basil Theme — Autonomous Package Index
 */

import type { ThemePackage } from "@/types/theme-contract";
import { BASIL_MANIFEST } from "./manifest";
import { BasilSettingsSchema, resolveBasilRuntimeSettings } from "./schema";
import { generateCssVariables } from "./tokens";
import { BASIL_EDITOR_CONTROLS } from "./controls";
import { BASIL_PALETTES, BASIL_PALETTE_OPTIONS } from "./palettes";
import { BasilMainTemplate } from "./templates/MainTemplate";
import { BasilItemSheetTemplate } from "./templates/ItemSheetTemplate";

export const basilPackage: ThemePackage = {
  manifest: BASIL_MANIFEST,
  validateSettings: (raw: unknown) => {
    return resolveBasilRuntimeSettings(raw);
  },
  generateCssVariables: (settings: Record<string, unknown>) => {
    const validated = resolveBasilRuntimeSettings(settings);
    return generateCssVariables(validated);
  },
  editorControls: BASIL_EDITOR_CONTROLS,
  templates: {
    main: BasilMainTemplate,
    item: BasilItemSheetTemplate,
  },
};

export default basilPackage;
export {
  BASIL_MANIFEST,
  BasilSettingsSchema,
  generateCssVariables,
  BASIL_EDITOR_CONTROLS,
  BASIL_PALETTES,
  BASIL_PALETTE_OPTIONS,
  resolveBasilRuntimeSettings,
  BasilMainTemplate,
  BasilItemSheetTemplate,
};
