import { z } from "zod";

export type MenuVisitSource = "qr" | "share" | "direct";
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface MenuVisitRecord {
  id: string;
  restaurantId: string;
  source: MenuVisitSource;
  tableNumber: string | null;
  sessionId: string;
  deviceType: DeviceType;
  createdAt: Date;
}

export interface TableScanStat {
  tableNumber: string;
  visits: number;
  lastVisitAt: Date | string;
}

export interface DailyVisitTrend {
  date: string; // YYYY-MM-DD
  qr: number;
  share: number;
  direct: number;
  total: number;
}

export interface QrAnalyticsSummary {
  totalVisits: number;
  qrVisits: number;
  shareVisits: number;
  directVisits: number;
  todayTotalVisits: number;
  todayQrVisits: number;
  todayShareVisits: number;
  tableStats: TableScanStat[];
  dailyTrend: DailyVisitTrend[];
}

export const TrackVisitPayloadSchema = z.object({
  restaurantSlug: z.string().min(1).max(100),
  source: z.enum(["qr", "share", "direct"]).default("direct"),
  tableNumber: z.string().trim().max(50).nullable().optional(),
  sessionId: z.string().min(8).max(100),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).default("mobile"),
  referrer: z.string().max(500).nullable().optional(),
});

export type TrackVisitPayload = z.infer<typeof TrackVisitPayloadSchema>;
