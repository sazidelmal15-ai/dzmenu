/**
 * Crema Theme — Autonomous Package Index
 */

import type { ThemePackage } from "@/types/theme-contract";
import { CREMA_MANIFEST } from "./manifest";
import { CremaSettingsSchema, resolveCremaRuntimeSettings } from "./schema";
import { generateCssVariables } from "./tokens";
import { CREMA_EDITOR_CONTROLS } from "./controls";
import { CREMA_PALETTES, CREMA_PALETTE_OPTIONS } from "./palettes";
import { CremaMainTemplate } from "./templates/MainTemplate";
import { CremaItemSheetTemplate } from "./templates/ItemSheetTemplate";
import { CremaSplashTemplate } from "./templates/SplashTemplate";

export const cremaPackage: ThemePackage = {
  manifest: CREMA_MANIFEST,
  validateSettings: (raw: unknown) => {
    return resolveCremaRuntimeSettings(raw);
  },
  generateCssVariables: (settings: Record<string, unknown>) => {
    const validated = resolveCremaRuntimeSettings(settings);
    return generateCssVariables(validated);
  },
  editorControls: CREMA_EDITOR_CONTROLS,
  templates: {
    main: CremaMainTemplate,
    item: CremaItemSheetTemplate,
    splash: CremaSplashTemplate,
  },
};

export default cremaPackage;
export {
  CREMA_MANIFEST,
  CremaSettingsSchema,
  generateCssVariables,
  CREMA_EDITOR_CONTROLS,
  CREMA_PALETTES,
  CREMA_PALETTE_OPTIONS,
  resolveCremaRuntimeSettings,
  CremaMainTemplate,
  CremaItemSheetTemplate,
  CremaSplashTemplate,
};
