import { NextRequest, NextResponse } from "next/server";
import { restaurantQueries, analyticsQueries } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * GET /m/[slug]/qr (Accessed directly via subdomain like salem.localhost:3000/qr or salem.dzmenu.com/qr)
 * Instant QR Scan Bridge:
 * 1. Logs verified QR scan in analytics database.
 * 2. Instantly redirects (302) to the clean root menu (/).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const restaurant = await restaurantQueries.findBySlug(slug);

    if (restaurant) {
      // Generate / read ephemeral session identifier from cookie or header
      let sessionId = request.cookies.get("dz_scan_sid")?.value;
      if (!sessionId) {
        sessionId = "qr_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      }

      const ua = request.headers.get("user-agent") || "";
      const isMobile = /mobile|iphone|ipod|android/i.test(ua);

      // Record QR scan
      await analyticsQueries.recordMenuVisit({
        restaurantId: restaurant.id,
        source: "qr",
        tableNumber: null,
        sessionId,
        deviceType: isMobile ? "mobile" : "desktop",
      });

      // 302 Redirect to clean home page
      const redirectUrl = new URL("/", request.url);
      const response = NextResponse.redirect(redirectUrl, { status: 302 });

      // Set 30-min cookie for session deduplication
      response.cookies.set("dz_scan_sid", sessionId, {
        maxAge: 1800, // 30 minutes
        path: "/",
        sameSite: "lax",
      });

      return response;
    }
  } catch (error) {
    console.error("[QR Bridge] Error recording scan:", error);
  }

  // Fallback: Redirect cleanly to root
  const fallbackUrl = new URL("/", request.url);
  return NextResponse.redirect(fallbackUrl, { status: 302 });
}
