import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, analyticsQueries } from "@/lib/db/queries";
import { QrStudioSettingsSchema } from "@/types/qr-studio";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/qr/settings
 * Retrieves QR Studio customization settings for the authenticated owner's restaurant.
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

    const settings = await analyticsQueries.getQrSettings(restaurant.id);

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: restaurant.logoUrl,
        coverUrl: restaurant.coverUrl,
        wifiSsid: restaurant.wifiSsid || "",
        wifiPassword: restaurant.wifiPassword || "",
      },
      settings,
    });
  } catch (error: unknown) {
    console.error("[GET /api/restaurant/qr/settings] Error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching QR settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/restaurant/qr/settings
 * Saves QR Studio customization settings with strict user membership authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await restaurantQueries.findByUserId(user.id);
    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { restaurantId, settings: rawSettings } = body;

    let restaurant = restaurants[0];
    if (restaurantId) {
      const matched = restaurants.find((r) => r.id === restaurantId);
      if (!matched) {
        return NextResponse.json({ error: "Access denied to restaurant" }, { status: 403 });
      }
      restaurant = matched;
    }

    const parsed = QrStudioSettingsSchema.safeParse(rawSettings);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid QR settings", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const saved = await analyticsQueries.saveQrSettings(restaurant.id, parsed.data);

    return NextResponse.json({
      success: true,
      message: "QR Studio settings saved successfully",
      settings: saved,
    });
  } catch (error: unknown) {
    console.error("[POST /api/restaurant/qr/settings] Error:", error);
    return NextResponse.json(
      { error: "Internal server error saving QR settings" },
      { status: 500 }
    );
  }
}
