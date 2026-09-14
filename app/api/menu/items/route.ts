import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, menuItemQueries } from "@/lib/db/queries";
import { menuItemCreateSchema } from "@/lib/menu/discounts";

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

    const rawBody = await request.json();

    // Server-Side Zod Validation
    const parseResult = menuItemCreateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const created = await menuItemQueries.create(restaurant.id, {
      categoryId: data.categoryId || null,
      name: data.name,
      description: data.description || null,
      price: data.price,
      originalPrice: data.originalPrice || null,
      discountStartsAt: data.discountStartsAt || null,
      discountEndsAt: data.discountEndsAt || null,
      imageUrl: data.imageUrl || null,
      badge: data.badge || null,
      tags: data.tags,
      ingredients: data.ingredients,
      availability: data.availability,
      isVisible: data.isVisible,
      isAvailable: data.isAvailable,
      isFeatured: data.isFeatured,
      variants: data.variants,
      sizes: data.sizes,
      extras: data.extras,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/menu/items error:", error);
    return NextResponse.json({ message: "Failed to create menu item" }, { status: 500 });
  }
}

