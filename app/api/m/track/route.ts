import { NextRequest, NextResponse } from "next/server";
import { TrackVisitPayloadSchema } from "@/types/analytics";
import { restaurantQueries, analyticsQueries } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/m/track
 * Ingests customer menu visit events with Zod validation and server-side deduplication.
 * Lightweight, fast, non-blocking.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = TrackVisitPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tracking payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { restaurantSlug, source: claimedSource, tableNumber, sessionId, deviceType, referrer } = parsed.data;

    // 1. Resolve restaurant by public slug
    const restaurant = await restaurantQueries.findBySlug(restaurantSlug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Intelligent Referrer Attribution:
    // If the request claimed ?src=qr but arrived from a chat or social media referrer (WhatsApp, Instagram, Telegram, etc.),
    // re-attribute it accurately as 'share' since it was clicked inside a messaging app rather than scanned by a camera.
    let effectiveSource = claimedSource;
    if (referrer) {
      const ref = referrer.toLowerCase();
      const isSocialOrChat =
        ref.includes("whatsapp") ||
        ref.includes("telegram") ||
        ref.includes("t.me") ||
        ref.includes("instagram") ||
        ref.includes("facebook") ||
        ref.includes("messenger") ||
        ref.includes("fb.com") ||
        ref.includes("t.co") ||
        ref.includes("twitter") ||
        ref.includes("x.com") ||
        ref.includes("tiktok") ||
        ref.includes("snapchat") ||
        ref.includes("linkedin") ||
        ref.includes("android-app://");

      if (claimedSource === "qr" && isSocialOrChat) {
        effectiveSource = "share";
      }
    }

    // 3. Record visit with server deduplication window check
    const result = await analyticsQueries.recordMenuVisit({
      restaurantId: restaurant.id,
      source: effectiveSource,
      tableNumber,
      sessionId,
      deviceType,
    });

    return NextResponse.json({
      success: true,
      recorded: result.recorded,
      reason: result.reason,
    });
  } catch (error: unknown) {
    console.error("[POST /api/m/track] Error ingesting menu visit:", error);
    // Return 500 but keep response minimal
    return NextResponse.json(
      { error: "Failed to record visit" },
      { status: 500 }
    );
  }
}
