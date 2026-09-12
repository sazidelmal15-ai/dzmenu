import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, themeQueries } from "@/lib/db/queries";
import { THEME_DEFINITIONS } from "@/lib/themes/definitions";
import type { ThemePresetId } from "@/types/theme-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/themes
 * Retrieves the restaurant's theme library, active live theme ID, and available presets.
 * Supports optional ?restaurantId=... with strict user membership authorization.
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
    const requestedRestaurantId = searchParams.get("restaurantId");

    let restaurant = restaurants[0];
    if (requestedRestaurantId) {
      const matched = restaurants.find((r) => r.id === requestedRestaurantId);
      if (matched) {
        restaurant = matched;
      }
    }

    const { activeThemeId, themes } = await themeQueries.listByRestaurantId(restaurant.id);

    // Provide curated active preset definitions for discovery (Gourmet, Craving, Crema)
    const activePresetIds: ThemePresetId[] = ["gourmet", "craving", "crema"];
    const presets = activePresetIds
      .map((id) => THEME_DEFINITIONS[id])
      .filter(Boolean)
      .map((p) => ({
        presetId: p.presetId,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        author: p.author,
        previewImage: p.previewImage,
      }));

    return NextResponse.json({
      success: true,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      activeThemeId,
      themes,
      presets,
    });
  } catch (error: unknown) {
    console.error("[GET /api/restaurant/themes] Error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching themes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/restaurant/themes
 * Installs a new theme from a preset into the restaurant's library as draft.
 * Supports optional restaurantId in body with strict user membership authorization.
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
    const { presetId, name, restaurantId: requestedRestaurantId } = body;

    let restaurant = restaurants[0];
    if (requestedRestaurantId) {
      const matched = restaurants.find((r) => r.id === requestedRestaurantId);
      if (!matched) {
        return NextResponse.json(
          { error: "Access denied to the specified restaurant" },
          { status: 403 }
        );
      }
      restaurant = matched;
    }

    if (!presetId || !(presetId in THEME_DEFINITIONS)) {
      return NextResponse.json(
        { error: `Invalid presetId. Allowed: ${Object.keys(THEME_DEFINITIONS).join(", ")}` },
        { status: 400 }
      );
    }

    const newTheme = await themeQueries.createFromPreset(
      restaurant.id,
      presetId as ThemePresetId,
      name
    );

    return NextResponse.json(
      {
        success: true,
        theme: newTheme,
        message: `${newTheme.name} added to your library!`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/restaurant/themes] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create theme";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
