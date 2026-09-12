import { NextRequest, NextResponse } from "next/server";
import { validateSubdomain } from "@/lib/constants/reserved-subdomains";
import { restaurantQueries } from "@/lib/db/queries";
import { getCurrentUser } from "@/lib/auth/context";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "";
    const normalized = slug.trim().toLowerCase();

    // 1. Validate format & reserved keywords (System vs Protected Brand)
    const formatCheck = validateSubdomain(normalized);
    if (!formatCheck.isValid) {
      return NextResponse.json(
        {
          available: false,
          status: formatCheck.status,
          message: formatCheck.message,
          canClaim: formatCheck.canClaim ?? false,
        },
        { status: 200 }
      );
    }

    // 2. Check if it's the current user's current restaurant slug
    const currentUser = await getCurrentUser();
    let currentRestaurantSlug = "";
    if (currentUser) {
      const userRestaurants = await restaurantQueries.findByUserId(currentUser.id);
      if (userRestaurants.length > 0) {
        currentRestaurantSlug = userRestaurants[0].slug.toLowerCase();
      }
    }

    if (currentRestaurantSlug && normalized === currentRestaurantSlug) {
      return NextResponse.json({
        available: true,
        status: "CURRENT",
        message: "This is your current active subdomain.",
        canClaim: false,
      });
    }

    // 3. Query the database to check if another restaurant is already using this slug
    const existing = await restaurantQueries.findBySlug(normalized);
    if (existing) {
      return NextResponse.json({
        available: false,
        status: "TAKEN",
        message: "This subdomain is already taken by another restaurant.",
        canClaim: false,
      });
    }

    // 4. Subdomain is 100% available
    return NextResponse.json({
      available: true,
      status: "AVAILABLE",
      message: "Subdomain is available! ✨",
      canClaim: false,
    });
  } catch (error: any) {
    console.error("[check-subdomain] Error:", error);
    return NextResponse.json(
      {
        available: false,
        status: "ERROR",
        message: "An error occurred while checking subdomain availability.",
        canClaim: false,
      },
      { status: 500 }
    );
  }
}
