import "server-only";
import { getDb } from "../client";
import type {
  MenuVisitSource,
  DeviceType,
  QrAnalyticsSummary,
  TableScanStat,
  DailyVisitTrend,
} from "@/types/analytics";
import type { QrStudioSettings } from "@/types/qr-studio";
import { DEFAULT_QR_SETTINGS, QrStudioSettingsSchema } from "@/types/qr-studio";

/**
 * Server-side deduplication window in minutes.
 * Consecutive requests with same (restaurant_id, session_id, source) within this window
 * are considered duplicate heartbeats/reloads and ignored.
 */
const DEDUPLICATION_WINDOW_MINUTES = 30;

export const analyticsQueries = {
  /**
   * Ingests a menu visit event with robust server-side deduplication.
   */
  async recordMenuVisit(params: {
    restaurantId: string;
    source: MenuVisitSource;
    tableNumber?: string | null;
    sessionId: string;
    deviceType: DeviceType;
  }): Promise<{ recorded: boolean; reason?: string }> {
    const db = getDb();
    const cleanTable = params.tableNumber?.trim() || null;

    // 1. Server-side Deduplication check
    const recentVisit = await db.queryOne<{ id: string }>(
      `SELECT id FROM menu_visits 
       WHERE restaurant_id = $1 
         AND session_id = $2 
         AND source = $3
         AND created_at >= NOW() - INTERVAL '${DEDUPLICATION_WINDOW_MINUTES} minutes'
       LIMIT 1`,
      [params.restaurantId, params.sessionId, params.source]
    );

    if (recentVisit) {
      return { recorded: false, reason: "deduplicated_window" };
    }

    // 2. Insert new verified visit
    await db.queryOne(
      `INSERT INTO menu_visits (restaurant_id, source, table_number, session_id, device_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [
        params.restaurantId,
        params.source,
        cleanTable,
        params.sessionId,
        params.deviceType,
      ]
    );

    return { recorded: true };
  },

  /**
   * Retrieves high-level QR and attribution analytics for a restaurant.
   */
  async getQrAnalyticsSummary(restaurantId: string): Promise<QrAnalyticsSummary> {
    const db = getDb();

    // 1. Overall counts by source & total
    const countsRow = await db.queryOne<{
      total_visits: string;
      qr_visits: string;
      share_visits: string;
      direct_visits: string;
      today_total: string;
      today_qr: string;
      today_share: string;
    }>(
      `SELECT 
         COUNT(*)::text AS total_visits,
         COUNT(*) FILTER (WHERE source = 'qr')::text AS qr_visits,
         COUNT(*) FILTER (WHERE source = 'share')::text AS share_visits,
         COUNT(*) FILTER (WHERE source = 'direct')::text AS direct_visits,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::text AS today_total,
         COUNT(*) FILTER (WHERE source = 'qr' AND created_at >= CURRENT_DATE)::text AS today_qr,
         COUNT(*) FILTER (WHERE source = 'share' AND created_at >= CURRENT_DATE)::text AS today_share
       FROM menu_visits
       WHERE restaurant_id = $1`,
      [restaurantId]
    );

    // 2. Table-level scan breakdown (for Table QR performance)
    const tableRows = await db.query<{
      table_number: string;
      visits: string;
      last_visit_at: Date;
    }>(
      `SELECT 
         table_number,
         COUNT(*)::text AS visits,
         MAX(created_at) AS last_visit_at
       FROM menu_visits
       WHERE restaurant_id = $1 AND table_number IS NOT NULL
       GROUP BY table_number
       ORDER BY COUNT(*) DESC, table_number ASC
       LIMIT 20`,
      [restaurantId]
    );

    const tableStats: TableScanStat[] = tableRows.map((r) => ({
      tableNumber: r.table_number,
      visits: parseInt(r.visits, 10) || 0,
      lastVisitAt: r.last_visit_at,
    }));

    // 3. 7-Day Daily Trend
    const trendRows = await db.query<{
      visit_date: string;
      qr: string;
      share: string;
      direct: string;
      total: string;
    }>(
      `SELECT 
         TO_CHAR(d.day, 'YYYY-MM-DD') AS visit_date,
         COUNT(v.id) FILTER (WHERE v.source = 'qr')::text AS qr,
         COUNT(v.id) FILTER (WHERE v.source = 'share')::text AS share,
         COUNT(v.id) FILTER (WHERE v.source = 'direct')::text AS direct,
         COUNT(v.id)::text AS total
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) d(day)
       LEFT JOIN menu_visits v 
         ON v.restaurant_id = $1 
        AND DATE(v.created_at) = DATE(d.day)
       GROUP BY d.day
       ORDER BY d.day ASC`,
      [restaurantId]
    );

    const dailyTrend: DailyVisitTrend[] = trendRows.map((r) => ({
      date: r.visit_date,
      qr: parseInt(r.qr, 10) || 0,
      share: parseInt(r.share, 10) || 0,
      direct: parseInt(r.direct, 10) || 0,
      total: parseInt(r.total, 10) || 0,
    }));

    return {
      totalVisits: parseInt(countsRow?.total_visits || "0", 10),
      qrVisits: parseInt(countsRow?.qr_visits || "0", 10),
      shareVisits: parseInt(countsRow?.share_visits || "0", 10),
      directVisits: parseInt(countsRow?.direct_visits || "0", 10),
      todayTotalVisits: parseInt(countsRow?.today_total || "0", 10),
      todayQrVisits: parseInt(countsRow?.today_qr || "0", 10),
      todayShareVisits: parseInt(countsRow?.today_share || "0", 10),
      tableStats,
      dailyTrend,
    };
  },

  /**
   * Retrieves stored QR Studio customization settings for a restaurant.
   */
  async getQrSettings(restaurantId: string): Promise<QrStudioSettings> {
    const db = getDb();
    const row = await db.queryOne<{ settings: Record<string, unknown> }>(
      `SELECT settings FROM restaurant_qr_settings WHERE restaurant_id = $1`,
      [restaurantId]
    );

    if (!row || !row.settings) {
      return DEFAULT_QR_SETTINGS;
    }

    const parsed = QrStudioSettingsSchema.safeParse(row.settings);
    return parsed.success ? parsed.data : DEFAULT_QR_SETTINGS;
  },

  /**
   * Upserts QR Studio customization settings for a restaurant.
   */
  async saveQrSettings(restaurantId: string, settings: QrStudioSettings): Promise<QrStudioSettings> {
    const db = getDb();
    const validated = QrStudioSettingsSchema.parse(settings);

    await db.queryOne(
      `INSERT INTO restaurant_qr_settings (restaurant_id, settings, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (restaurant_id)
       DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
      [restaurantId, JSON.stringify(validated)]
    );

    return validated;
  },
};
