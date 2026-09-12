/**
 * Gourmet Theme — Autonomous Package Index
 *
 * Exports the complete ThemePackage contract for Gourmet.
 */

import type { ThemePackage } from "@/types/theme-contract";
import { GOURMET_MANIFEST } from "./manifest";
import { GourmetSettingsSchema, resolveGourmetRuntimeSettings } from "./schema";
import { generateCssVariables } from "./tokens";
import { GOURMET_EDITOR_CONTROLS } from "./controls";
import { GOURMET_PALETTES, GOURMET_PALETTE_OPTIONS } from "./palettes";
import { GourmetMainTemplate } from "./templates/MainTemplate";
import { GourmetItemPageTemplate } from "./templates/ItemPageTemplate";
import { GourmetItemSheetTemplate } from "./templates/ItemSheetTemplate";

export const gourmetPackage: ThemePackage = {
  manifest: GOURMET_MANIFEST,
  validateSettings: (raw: unknown) => {
    return resolveGourmetRuntimeSettings(raw);
  },
  generateCssVariables: (settings: Record<string, unknown>) => {
    const validated = resolveGourmetRuntimeSettings(settings);
    return generateCssVariables(validated);
  },
  editorControls: GOURMET_EDITOR_CONTROLS,
  templates: {
    main: GourmetMainTemplate,
    item: GourmetItemPageTemplate,
  },
};

export default gourmetPackage;
export {
  GOURMET_MANIFEST,
  GourmetSettingsSchema,
  generateCssVariables,
  GOURMET_EDITOR_CONTROLS,
  GOURMET_PALETTES,
  GOURMET_PALETTE_OPTIONS,
  resolveGourmetRuntimeSettings,
  GourmetItemPageTemplate,
  GourmetItemSheetTemplate,
};
