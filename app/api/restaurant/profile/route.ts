import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries } from "@/lib/db/queries";
import { validateSubdomain } from "@/lib/constants/reserved-subdomains";

/**
 * GET /api/restaurant/profile
 * Retrieves full restaurant profile data for the authenticated owner/manager.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await restaurantQueries.findByUserId(user.id);
    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const restaurant = restaurants[0];
    if (restaurant.logoUrl && restaurant.logoUrl.startsWith("blob:")) {
      restaurant.logoUrl = null;
    }
    if (restaurant.coverUrl && restaurant.coverUrl.startsWith("blob:")) {
      restaurant.coverUrl = null;
    }
    return NextResponse.json({ success: true, restaurant }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/restaurant/profile] Error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/restaurant/profile
 * Updates restaurant profile data for the authenticated owner/manager.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await restaurantQueries.findByUserId(user.id);
    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const currentRestaurant = restaurants[0];
    const body = await request.json();

    // 1. Validate subdomain/slug if being updated
    if (body.slug && body.slug.toLowerCase().trim() !== currentRestaurant.slug.toLowerCase()) {
      const normalizedSlug = body.slug.toLowerCase().trim();
      const slugValidation = validateSubdomain(normalizedSlug);

      if (!slugValidation.isValid) {
        return NextResponse.json(
          { error: slugValidation.message, status: slugValidation.status },
          { status: 400 }
        );
      }

      // Check if already taken in DB
      const existing = await restaurantQueries.findBySlug(normalizedSlug);
      if (existing && existing.id !== currentRestaurant.id) {
        return NextResponse.json(
          { error: "This subdomain is already taken by another restaurant." },
          { status: 400 }
        );
      }
    }

    // 2. Perform DB update
    const payload: any = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.slug !== undefined) payload.slug = body.slug;
    if (body.isSubdomainLocked !== undefined) payload.isSubdomainLocked = body.isSubdomainLocked;
    if (body.logoUrl !== undefined) payload.logoUrl = body.logoUrl;
    if (body.coverUrl !== undefined) payload.coverUrl = body.coverUrl;
    if (body.tagline !== undefined) payload.tagline = body.tagline;
    if (body.description !== undefined) payload.description = body.description;
    if (body.cuisineTypes !== undefined) payload.cuisineTypes = Array.isArray(body.cuisineTypes) ? body.cuisineTypes : [];
    if (body.currency !== undefined) payload.currency = body.currency;
    if (body.phone !== undefined) payload.phone = body.phone;
    if (body.whatsapp !== undefined) payload.whatsapp = body.whatsapp;
    if (body.city !== undefined) payload.city = body.city;
    if (body.address !== undefined) payload.address = body.address;
    if (body.googleMapsUrl !== undefined) payload.googleMapsUrl = body.googleMapsUrl;
    if (body.alwaysOpen !== undefined) payload.alwaysOpen = body.alwaysOpen;
    if (body.operatingHours !== undefined) payload.operatingHours = Array.isArray(body.operatingHours) ? body.operatingHours : [];
    if (body.tiktokUrl !== undefined) payload.tiktokUrl = body.tiktokUrl;
    if (body.instagramUrl !== undefined) payload.instagramUrl = body.instagramUrl;
    if (body.facebookUrl !== undefined) payload.facebookUrl = body.facebookUrl;
    if (body.wifiSsid !== undefined) payload.wifiSsid = body.wifiSsid;
    if (body.wifiPassword !== undefined) payload.wifiPassword = body.wifiPassword;
    if (body.status !== undefined) payload.status = body.status;

    const updated = await restaurantQueries.updateProfile(currentRestaurant.id, payload);

    return NextResponse.json({ success: true, restaurant: updated }, { status: 200 });
  } catch (error: any) {
    console.error("[PUT /api/restaurant/profile] Error:", error);
    return NextResponse.json(
      { error: "Internal server error updating profile" },
      { status: 500 }
    );
  }
}
