import { z } from "zod";

export type QrPatternStyle = "square" | "rounded" | "dots";
export type QrCornerStyle = "square" | "rounded" | "extra-rounded";
export type QrStandTemplate = "table_tent" | "a5_stand" | "a6_minimal" | "badge_card";

export const QrStudioSettingsSchema = z.object({
  foregroundColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").default("#18181B"),
  backgroundColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").default("#FFFFFF"),
  patternStyle: z.enum(["square", "rounded", "dots"]).default("rounded"),
  cornerStyle: z.enum(["square", "rounded", "extra-rounded"]).default("rounded"),
  logoEnabled: z.boolean().default(true),
  logoSize: z.number().min(15).max(35).default(24), // percentage of QR size
  ctaText: z.string().max(60).default("امسح لعرض القائمة • Scan for Menu"),
  standTemplate: z.enum(["table_tent", "a5_stand", "a6_minimal", "badge_card"]).default("table_tent"),
  includeWifi: z.boolean().default(false),
  wifiSsid: z.string().max(50).default(""),
  wifiPassword: z.string().max(50).default(""),
  tableMode: z.enum(["single", "table"]).default("single"),
  tableNumber: z.string().max(20).default("1"),
  tableCount: z.number().min(1).max(100).default(10),
});

export type QrStudioSettings = z.infer<typeof QrStudioSettingsSchema>;

export const DEFAULT_QR_SETTINGS: QrStudioSettings = {
  foregroundColor: "#18181B",
  backgroundColor: "#FFFFFF",
  patternStyle: "rounded",
  cornerStyle: "rounded",
  logoEnabled: true,
  logoSize: 24,
  ctaText: "امسح لعرض القائمة • Scan for Menu",
  standTemplate: "table_tent",
  includeWifi: false,
  wifiSsid: "",
  wifiPassword: "",
  tableMode: "single",
  tableNumber: "1",
  tableCount: 10,
};
