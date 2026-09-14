import { NextRequest, NextResponse } from "next/server";
import { restaurantQueries } from "@/lib/db/queries";
import { hasActiveSubscription } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

/**
 * GET /m/[slug]/qr (Accessed directly via subdomain like salem.localhost:3000/qr or salem.dzmenu.com/qr)
 * Instant QR Scan Bridge:
 * 1. Resolves restaurant and verifies active subscription status.
 * 2. 302 Redirects to /?src=qr for canonical client-side ingestion via MenuTracker.
 * 3. Does NOT directly insert analytics records (avoids double-counting).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const restaurant = await restaurantQueries.findBySlug(slug);

    if (restaurant) {
      const isSubscribed = await hasActiveSubscription(restaurant.id);
      const isActive = restaurant.status === "ACTIVE" && isSubscribed;

      // Active restaurant -> 302 redirect with canonical ?src=qr
      // Inactive/Expired -> redirect cleanly to / (renders MaintenanceScreen, skips MenuTracker)
      const redirectPath = isActive ? "/?src=qr" : "/";
      const redirectUrl = new URL(redirectPath, request.url);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }
  } catch (error) {
    console.error("[QR Bridge] Error resolving scan route:", error);
  }

  // Fallback: Redirect cleanly to root
  const fallbackUrl = new URL("/", request.url);
  return NextResponse.redirect(fallbackUrl, { status: 302 });
}

