import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, menuItemQueries } from "@/lib/db/queries";
import { deleteStorageFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    const restaurant = userRestaurants[0];
    if (!restaurant) {
      return NextResponse.json({ message: "No restaurant found" }, { status: 400 });
    }

    const body = await request.json();

    if (body.isDeleted === true) {
      await menuItemQueries.softDelete(id, restaurant.id);
      return NextResponse.json({ data: { id, isDeleted: true } });
    }

    const updated = await menuItemQueries.update(id, restaurant.id, {
      categoryId: body.categoryId,
      name: body.name,
      description: body.description,
      price: body.price !== undefined ? Number(body.price) : undefined,
      imageUrl: body.imageUrl,
      badge: body.badge,
      tags: body.tags,
      isVisible: body.isVisible,
      isAvailable: body.isAvailable,
      isFeatured: body.isFeatured,
      variants: body.variants,
      sizes: body.sizes,
      extras: body.extras,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/menu/items/[id] error:", error);
    return NextResponse.json({ message: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    const restaurant = userRestaurants[0];
    if (!restaurant) {
      return NextResponse.json({ message: "No restaurant found" }, { status: 400 });
    }

    // Hard delete: permanently removes the item from database and retrieves its image_url
    const result = await menuItemQueries.hardDelete(id, restaurant.id);

    // If item had an uploaded image, also delete the file from Supabase Storage
    if (result.imageUrl) {
      await deleteStorageFile(result.imageUrl);
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/menu/items/[id] error:", error);
    return NextResponse.json({ message: "Failed to delete item" }, { status: 500 });
  }
}

