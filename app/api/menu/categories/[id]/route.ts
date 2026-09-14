import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, categoryQueries } from "@/lib/db/queries";
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
      const result = await categoryQueries.deleteCascade(id, restaurant.id);
      if (!result.deleted) {
        return NextResponse.json({ message: "Category not found or unauthorized" }, { status: 404 });
      }

      // Cleanup image files for deleted items
      for (const imgUrl of result.deletedImageUrls) {
        deleteStorageFile(imgUrl).catch(() => {});
      }

      return NextResponse.json({ data: { id, isDeleted: true, deletedItemCount: result.deletedItemCount } });
    }

    if (body.isDeleted === false) {
      await categoryQueries.restore(id, restaurant.id, body.orderIndex);
    }

    const updated = await categoryQueries.update(id, restaurant.id, {
      name: body.name,
      shortName: body.shortName,
      description: body.description,
      icon: body.icon,
      badge: body.badge,
      sortOrder: body.orderIndex !== undefined ? body.orderIndex : body.sortOrder,
      imageUrl: body.imageUrl,
      isActive: body.isActive !== undefined ? body.isActive : body.isAvailable,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/menu/categories/[id] error:", error);
    return NextResponse.json({ message: "Failed to update category" }, { status: 500 });
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

    // Atomic cascade deletion of category and all its menu items
    const result = await categoryQueries.deleteCascade(id, restaurant.id);
    if (!result.deleted) {
      return NextResponse.json({ message: "Category not found or unauthorized" }, { status: 404 });
    }

    // Cleanup image files for deleted items
    for (const imgUrl of result.deletedImageUrls) {
      deleteStorageFile(imgUrl).catch(() => {});
    }

    return NextResponse.json({
      data: {
        id,
        success: true,
        deletedItemCount: result.deletedItemCount,
      },
    });
  } catch (error) {
    console.error("DELETE /api/menu/categories/[id] error:", error);
    return NextResponse.json({ message: "Failed to delete category" }, { status: 500 });
  }
}
