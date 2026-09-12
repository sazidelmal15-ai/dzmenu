/**
 * Noir Theme — Autonomous Package Index
 */

import type { ThemePackage } from "@/types/theme-contract";
import { NOIR_MANIFEST } from "./manifest";
import { NoirSettingsSchema, resolveNoirRuntimeSettings } from "./schema";
import { generateCssVariables } from "./tokens";
import { NOIR_EDITOR_CONTROLS } from "./controls";
import { NOIR_PALETTES, NOIR_PALETTE_OPTIONS } from "./palettes";
import { NoirMainTemplate } from "./templates/MainTemplate";
import { NoirItemPageTemplate } from "./templates/ItemPageTemplate";

export const noirPackage: ThemePackage = {
  manifest: NOIR_MANIFEST,
  validateSettings: (raw: unknown) => {
    return resolveNoirRuntimeSettings(raw);
  },
  generateCssVariables: (settings: Record<string, unknown>) => {
    const validated = resolveNoirRuntimeSettings(settings);
    return generateCssVariables(validated);
  },
  editorControls: NOIR_EDITOR_CONTROLS,
  templates: {
    main: NoirMainTemplate,
    item: NoirItemPageTemplate,
  },
};

export default noirPackage;
export {
  NOIR_MANIFEST,
  NoirSettingsSchema,
  generateCssVariables,
  NOIR_EDITOR_CONTROLS,
  NOIR_PALETTES,
  NOIR_PALETTE_OPTIONS,
  resolveNoirRuntimeSettings,
  NoirMainTemplate,
  NoirItemPageTemplate,
};
