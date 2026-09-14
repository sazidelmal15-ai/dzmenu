"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categoryQueries, menuItemQueries } from "@/lib/db/queries";
import { requireActiveSubscription } from "@/lib/permissions/guards";
import {
  type Category,
  type MenuItem,
  type MenuItemAvailability,
  type MenuItemVariant,
  type MenuItemSize,
  type MenuItemExtra,
  type MenuItemBadge,
  type MenuItemTag,
  MENU_ITEM_BADGES,
  MENU_ITEM_TAGS,
  MENU_ITEM_AVAILABILITIES,
} from "@/types/menu";

const categorySchema = z.object({
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const menuItemSchema = z.object({
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, "Item name is required").max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.number().min(0, "Price cannot be negative"),
  originalPrice: z.number().min(0).optional().nullable(),
  discountStartsAt: z.string().optional().nullable(),
  discountEndsAt: z.string().optional().nullable(),
  ingredients: z.array(z.string().trim()).optional().default([]),
  imageUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  badge: z.enum(MENU_ITEM_BADGES).optional().nullable(),
  tags: z
    .array(z.enum(MENU_ITEM_TAGS))
    .transform((tags) => Array.from(new Set(tags)))
    .optional()
    .default([]),
  availability: z.enum(MENU_ITEM_AVAILABILITIES).optional().default("AVAILABLE"),
  isVisible: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().default(false),
  variants: z.array(z.object({
    name: z.string().trim(),
    price: z.union([z.string(), z.number()]).optional(),
    isDefault: z.boolean().optional(),
  })).optional().default([]),
  sizes: z.array(z.object({
    name: z.string().trim(),
    price: z.union([z.string(), z.number()]),
  })).optional().default([]),
  extras: z.array(z.object({
    name: z.string().trim(),
    price: z.union([z.string(), z.number()]),
  })).optional().default([]),
});

export interface MenuActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates or updates a category (Subscription Protected).
 */
export async function saveCategoryAction(data: {
  id?: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
}): Promise<MenuActionResult<Category>> {
  try {
    await requireActiveSubscription(data.restaurantId);

    const validation = categorySchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || "Invalid category data" };
    }

    let category: Category;
    if (data.id) {
      const updated = await categoryQueries.update(data.id, data.restaurantId, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        sortOrder: data.sortOrder,
      });
      if (!updated) {
        return { success: false, error: "Category not found" };
      }
      category = updated;
    } else {
      category = await categoryQueries.create(
        data.restaurantId,
        data.name,
        data.description,
        data.icon,
        data.sortOrder || 0
      );
    }

    revalidatePath("/dashboard");
    return { success: true, data: category };
  } catch (error) {
    console.error("saveCategoryAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to save category";
    return { success: false, error: msg };
  }
}

/**
 * Bulk saves/syncs categories from templates (Subscription Protected).
 */
export async function syncCategoriesAction(
  restaurantId: string,
  categoriesToCreate: Array<{ name: string; description?: string; icon?: string; sortOrder?: number }>
): Promise<MenuActionResult<Category[]>> {
  try {
    await requireActiveSubscription(restaurantId);

    const createdList: Category[] = [];
    for (let i = 0; i < categoriesToCreate.length; i++) {
      const cat = categoriesToCreate[i];
      const created = await categoryQueries.create(
        restaurantId,
        cat.name,
        cat.description,
        cat.icon,
        cat.sortOrder ?? i
      );
      createdList.push(created);
    }

    revalidatePath("/dashboard");
    return { success: true, data: createdList };
  } catch (error) {
    console.error("syncCategoriesAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to sync categories";
    return { success: false, error: msg };
  }
}

import { deleteStorageFile } from "@/lib/storage";

/**
 * Permanently deletes a category and all its contained menu items atomically (Subscription Protected).
 */
export async function deleteCategoryAction(
  categoryId: string,
  restaurantId: string
): Promise<MenuActionResult<{ deletedItemCount: number }>> {
  try {
    await requireActiveSubscription(restaurantId);
    const result = await categoryQueries.deleteCascade(categoryId, restaurantId);
    if (!result.deleted) {
      return { success: false, error: "Category not found or unauthorized" };
    }

    // Decoupled asynchronous cleanup of deleted item images
    for (const imgUrl of result.deletedImageUrls) {
      deleteStorageFile(imgUrl).catch(() => {});
    }

    revalidatePath("/dashboard");
    revalidatePath("/menu");
    return { success: true, data: { deletedItemCount: result.deletedItemCount } };
  } catch (error) {
    console.error("deleteCategoryAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false, error: msg };
  }
}

/**
 * Creates or updates a menu item (Subscription Protected).
 */
export async function saveMenuItemAction(data: {
  id?: string;
  restaurantId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  ingredients?: string[];
  imageUrl?: string | null;
  badge?: MenuItemBadge | null;
  tags?: MenuItemTag[];
  availability?: MenuItemAvailability;
  isVisible?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  variants?: MenuItemVariant[];
  sizes?: MenuItemSize[];
  extras?: MenuItemExtra[];
}): Promise<MenuActionResult<MenuItem>> {
  try {
    await requireActiveSubscription(data.restaurantId);

    const validation = menuItemSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0]?.message || "Invalid menu item data" };
    }

    let item: MenuItem;
    if (data.id) {
      const updated = await menuItemQueries.update(data.id, data.restaurantId, validation.data);
      if (!updated) {
        return { success: false, error: "Menu item not found" };
      }
      item = updated;
    } else {
      item = await menuItemQueries.create(data.restaurantId, validation.data);
    }

    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch (error) {
    console.error("saveMenuItemAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to save menu item";
    return { success: false, error: msg };
  }
}

/**
 * Sets a menu item's availability state authoritatively (AVAILABLE / SOLD_OUT / HIDDEN) (Subscription Protected).
 */
export async function setMenuItemAvailabilityAction(
  itemId: string,
  restaurantId: string,
  availability: MenuItemAvailability
): Promise<MenuActionResult<MenuItemAvailability>> {
  try {
    await requireActiveSubscription(restaurantId);
    await menuItemQueries.setAvailability(itemId, restaurantId, availability);
    revalidatePath("/dashboard");
    revalidatePath("/menu");
    return { success: true, data: availability };
  } catch (error) {
    console.error("setMenuItemAvailabilityAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to set item availability";
    return { success: false, error: msg };
  }
}

/**
 * Toggles a menu item's availability (Subscription Protected - Backward Compatible).
 */
export async function toggleMenuItemAvailabilityAction(
  itemId: string,
  restaurantId: string,
  isAvailable: boolean
): Promise<MenuActionResult<boolean>> {
  try {
    await requireActiveSubscription(restaurantId);
    await menuItemQueries.setAvailability(itemId, restaurantId, isAvailable ? "AVAILABLE" : "HIDDEN");
    revalidatePath("/dashboard");
    revalidatePath("/menu");
    return { success: true, data: isAvailable };
  } catch (error) {
    console.error("toggleMenuItemAvailabilityAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to toggle availability";
    return { success: false, error: msg };
  }
}

/**
 * Soft deletes a menu item (Subscription Protected).
 */
export async function deleteMenuItemAction(
  itemId: string,
  restaurantId: string
): Promise<MenuActionResult<void>> {
  try {
    await requireActiveSubscription(restaurantId);
    await menuItemQueries.softDelete(itemId, restaurantId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deleteMenuItemAction error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete item";
    return { success: false, error: msg };
  }
}
