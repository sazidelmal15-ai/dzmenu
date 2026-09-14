import { NextRequest, NextResponse } from "next/server";
import { TrackVisitPayloadSchema } from "@/types/analytics";
import { restaurantQueries, analyticsQueries } from "@/lib/db/queries";
import { hasActiveSubscription } from "@/lib/permissions/guards";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/m/track
 * Ingests customer menu visit events with Zod validation, IP rate limiting,
 * subscription verification, and server-side deduplication.
 * Lightweight, fast, non-blocking.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting (Abuse prevention: 30 requests / 60 seconds per client IP)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = checkRateLimit(clientIp, { limit: 30, windowMs: 60_000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many tracking requests", retryAfterMs: rateLimit.resetMs },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimit.resetMs / 1000).toString(),
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const rawBody = await request.json();
    const parsed = TrackVisitPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tracking payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { restaurantSlug, source: claimedSource, tableNumber, sessionId, deviceType, referrer } = parsed.data;

    // 2. Resolve restaurant by public slug
    const restaurant = await restaurantQueries.findBySlug(restaurantSlug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 3. Verify restaurant active status and subscription
    const isSubscribed = await hasActiveSubscription(restaurant.id);
    if (restaurant.status !== "ACTIVE" || !isSubscribed) {
      return NextResponse.json({
        success: true,
        recorded: false,
        reason: "inactive_restaurant",
      });
    }

    // 4. Intelligent Referrer Attribution:
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

    // 5. Record visit with server deduplication window check
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

