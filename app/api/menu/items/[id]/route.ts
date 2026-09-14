import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, menuItemQueries } from "@/lib/db/queries";
import { deleteStorageFile } from "@/lib/storage";
import { menuItemUpdateSchema } from "@/lib/menu/discounts";

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

    // Verify tenant ownership of this item
    const existing = await menuItemQueries.findById(id, restaurant.id);
    if (!existing) {
      return NextResponse.json({ message: "Menu item not found or unauthorized" }, { status: 404 });
    }

    const rawBody = await request.json();

    if (rawBody.isDeleted === true) {
      await menuItemQueries.softDelete(id, restaurant.id);
      return NextResponse.json({ data: { id, isDeleted: true } });
    }

    // Server-Side Zod Validation
    const parseResult = menuItemUpdateSchema.safeParse(rawBody);
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

    // Cross-field boundary validation against merged current state
    const effectivePrice = data.price !== undefined ? data.price : Number(existing.price);
    const effectiveOriginal =
      data.originalPrice !== undefined
        ? data.originalPrice
        : existing.originalPrice != null
        ? Number(existing.originalPrice)
        : null;

    if (effectiveOriginal != null && effectiveOriginal <= effectivePrice) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: {
            fieldErrors: {
              originalPrice: ["Original price must be strictly greater than selling price"],
            },
          },
        },
        { status: 400 }
      );
    }

    const updated = await menuItemQueries.update(id, restaurant.id, {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      discountStartsAt: data.discountStartsAt,
      discountEndsAt: data.discountEndsAt,
      imageUrl: data.imageUrl,
      badge: data.badge,
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

