import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, menuItemQueries } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    const restaurant = userRestaurants[0];
    if (!restaurant) {
      return NextResponse.json({ data: [] });
    }

    const items = await menuItemQueries.listByRestaurantId(restaurant.id);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("GET /api/menu/items error:", error);
    return NextResponse.json({ message: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    const restaurant = userRestaurants[0];
    if (!restaurant) {
      return NextResponse.json({ message: "No restaurant found" }, { status: 400 });
    }

    const body = await request.json();
    const created = await menuItemQueries.create(restaurant.id, {
      categoryId: body.categoryId || null,
      name: body.name,
      description: body.description || null,
      price: Number(body.price) || 0,
      imageUrl: body.imageUrl || null,
      badge: body.badge || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      isVisible: body.isVisible !== false,
      isAvailable: body.isAvailable !== false,
      isFeatured: Boolean(body.isFeatured),
      variants: Array.isArray(body.variants) ? body.variants : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      extras: Array.isArray(body.extras) ? body.extras : [],
    });

    return NextResponse.json({ data: created });
  } catch (error) {
    console.error("POST /api/menu/items error:", error);
    return NextResponse.json({ message: "Failed to create menu item" }, { status: 500 });
  }
}
