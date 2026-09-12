import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, analyticsQueries } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/analytics/qr
 * Retrieves aggregated QR scans and visit attribution analytics for the authenticated owner's restaurant.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await restaurantQueries.findByUserId(user.id);
    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get("restaurantId");

    let restaurant = restaurants[0];
    if (requestedId) {
      const matched = restaurants.find((r) => r.id === requestedId);
      if (matched) restaurant = matched;
    }

    const summary = await analyticsQueries.getQrAnalyticsSummary(restaurant.id);

    return NextResponse.json({
      success: true,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      analytics: summary,
    });
  } catch (error: unknown) {
    console.error("[GET /api/restaurant/analytics/qr] Error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching QR analytics" },
      { status: 500 }
    );
  }
}
