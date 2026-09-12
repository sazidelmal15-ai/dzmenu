import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, categoryQueries, menuItemQueries } from "@/lib/db/queries";

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

    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    // Run queries in parallel to eliminate network waterfall latency
    const [categories, allItems] = await Promise.all([
      categoryQueries.listByRestaurantId(restaurant.id, includeDeleted),
      menuItemQueries.listByRestaurantId(restaurant.id),
    ]);

    // Attach items array to each category so exact original UI displays items in categories
    const categoriesWithItems = categories.map((cat) => ({
      ...cat,
      items: allItems.filter((i) => i.categoryId === cat.id),
    }));

    return NextResponse.json({ 
      data: categoriesWithItems,
      currency: restaurant.currency || "DZD",
    });
  } catch (error) {
    console.error("GET /api/menu/categories error:", error);
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
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
    const created = await categoryQueries.create(
      restaurant.id,
      body.name,
      body.description || null,
      body.icon || "🍽️",
      body.sortOrder || 0,
      body.shortName || null,
      body.imageUrl || null,
      body.badge || null,
      body.isActive !== undefined ? body.isActive : (body.isAvailable !== undefined ? body.isAvailable : true)
    );

    return NextResponse.json({ data: created });
  } catch (error) {
    console.error("POST /api/menu/categories error:", error);
    return NextResponse.json({ message: "Failed to create category" }, { status: 500 });
  }
}
