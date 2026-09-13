import "server-only";
import { getDb } from "../client";
import type { MenuItem, MenuItemVariant, MenuItemSize, MenuItemExtra, MenuItemBadge, MenuItemTag } from "@/types/menu";

interface MenuItemRow {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  categoryName?: string | null;
  name: string;
  description: string | null;
  price: string | number;
  originalPrice?: string | number | null;
  discountStartsAt?: string | Date | null;
  discountEndsAt?: string | Date | null;
  imageUrl: string | null;
  badge: MenuItemBadge | null;
  tags: MenuItemTag[] | null;
  ingredients: string[] | null;
  isVisible: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  variants: MenuItemVariant[] | null;
  sizes: MenuItemSize[] | null;
  extras: MenuItemExtra[] | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalizes DB row values into typed domain MenuItem entity.
 */
function mapMenuItemRow(r: MenuItemRow): MenuItem {
  return {
    ...r,
    price: Number(r.price),
    originalPrice: r.originalPrice !== null && r.originalPrice !== undefined ? Number(r.originalPrice) : null,
    discountStartsAt: r.discountStartsAt || null,
    discountEndsAt: r.discountEndsAt || null,
    badge: r.badge || null,
    tags: Array.isArray(r.tags) ? r.tags : [],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    isVisible: r.isVisible !== false,
    isAvailable: r.isAvailable !== false,
    isFeatured: Boolean(r.isFeatured),
    variants: Array.isArray(r.variants) ? r.variants : [],
    sizes: Array.isArray(r.sizes) ? r.sizes : [],
    extras: Array.isArray(r.extras) ? r.extras : [],
  };
}

/**
 * Menu Items Query Helpers (Soft Delete Enforced)
 */
export const menuItemQueries = {
  /**
   * List menu items for a restaurant, optionally filtered by category.
   */
  async listByRestaurantId(restaurantId: string, categoryId?: string | null): Promise<MenuItem[]> {
    const db = getDb();
    const params: unknown[] = [restaurantId];
    let whereClause = `WHERE mi.restaurant_id = $1 AND mi.deleted_at IS NULL`;

    if (categoryId && categoryId !== "all") {
      params.push(categoryId);
      whereClause += ` AND mi.category_id = $2`;
    }

    const rows = await db.query<MenuItemRow>(
      `SELECT mi.id, mi.restaurant_id AS "restaurantId", mi.category_id AS "categoryId",
              c.name AS "categoryName", mi.name, mi.description, mi.price,
              mi.original_price AS "originalPrice",
              mi.discount_starts_at AS "discountStartsAt",
              mi.discount_ends_at AS "discountEndsAt",
              mi.image_url AS "imageUrl", mi.badge, mi.tags,
              mi.ingredients,
              mi.is_visible AS "isVisible",
              mi.is_available AS "isAvailable", mi.is_featured AS "isFeatured",
              mi.variants, mi.sizes, mi.extras,
              mi.sort_order AS "sortOrder", mi.created_at AS "createdAt", mi.updated_at AS "updatedAt"
       FROM menu_items mi
       LEFT JOIN categories c ON c.id = mi.category_id AND c.deleted_at IS NULL
       ${whereClause}
       ORDER BY mi.sort_order ASC, mi.created_at DESC`,
      params
    );

    return rows.map(mapMenuItemRow);
  },

  /**
   * Find a single menu item by ID within a restaurant.
   */
  async findById(itemId: string, restaurantId: string): Promise<MenuItem | null> {
    const db = getDb();
    const row = await db.queryOne<MenuItemRow>(
      `SELECT mi.id, mi.restaurant_id AS "restaurantId", mi.category_id AS "categoryId",
              c.name AS "categoryName", mi.name, mi.description, mi.price,
              mi.original_price AS "originalPrice",
              mi.discount_starts_at AS "discountStartsAt",
              mi.discount_ends_at AS "discountEndsAt",
              mi.image_url AS "imageUrl", mi.badge, mi.tags,
              mi.ingredients,
              mi.is_visible AS "isVisible",
              mi.is_available AS "isAvailable", mi.is_featured AS "isFeatured",
              mi.variants, mi.sizes, mi.extras,
              mi.sort_order AS "sortOrder", mi.created_at AS "createdAt", mi.updated_at AS "updatedAt"
       FROM menu_items mi
       LEFT JOIN categories c ON c.id = mi.category_id AND c.deleted_at IS NULL
       WHERE mi.id = $1 AND mi.restaurant_id = $2 AND mi.deleted_at IS NULL`,
      [itemId, restaurantId]
    );

    if (!row) return null;

    return mapMenuItemRow(row);
  },

  /**
   * Creates a new menu item.
   */
  async create(
    restaurantId: string,
    data: {
      categoryId?: string | null;
      name: string;
      description?: string | null;
      price: number;
      originalPrice?: number | null;
      discountStartsAt?: string | Date | null;
      discountEndsAt?: string | Date | null;
      imageUrl?: string | null;
      badge?: MenuItemBadge | null;
      tags?: MenuItemTag[];
      ingredients?: string[];
      isVisible?: boolean;
      isAvailable?: boolean;
      isFeatured?: boolean;
      variants?: MenuItemVariant[];
      sizes?: MenuItemSize[];
      extras?: MenuItemExtra[];
    }
  ): Promise<MenuItem> {
    const db = getDb();
    const row = await db.queryOne<MenuItemRow>(
      `INSERT INTO menu_items (
         restaurant_id, category_id, name, description, price, original_price, discount_starts_at, discount_ends_at,
         image_url, badge, tags, ingredients, is_visible, is_available, is_featured, variants, sizes, extras, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15, $16::jsonb, $17::jsonb, $18::jsonb, NOW(), NOW())
       RETURNING id, restaurant_id AS "restaurantId", category_id AS "categoryId",
                 name, description, price, original_price AS "originalPrice",
                 discount_starts_at AS "discountStartsAt", discount_ends_at AS "discountEndsAt",
                 image_url AS "imageUrl", badge, tags, ingredients,
                 is_visible AS "isVisible", is_available AS "isAvailable", is_featured AS "isFeatured",
                 variants, sizes, extras,
                 sort_order AS "sortOrder", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        restaurantId,
        data.categoryId || null,
        data.name.trim(),
        data.description || null,
        data.price || 0,
        data.originalPrice !== undefined ? data.originalPrice : null,
        data.discountStartsAt || null,
        data.discountEndsAt || null,
        data.imageUrl || null,
        data.badge || null,
        JSON.stringify(data.tags || []),
        JSON.stringify(data.ingredients || []),
        data.isVisible !== false,
        data.isAvailable !== false,
        Boolean(data.isFeatured),
        JSON.stringify(data.variants || []),
        JSON.stringify(data.sizes || []),
        JSON.stringify(data.extras || []),
      ]
    );

    if (!row) {
      throw new Error("Failed to create menu item");
    }

    return mapMenuItemRow(row);
  },

  /**
   * Updates an existing menu item.
   */
  async update(
    itemId: string,
    restaurantId: string,
    data: {
      categoryId?: string | null;
      name?: string;
      description?: string | null;
      price?: number;
      originalPrice?: number | null;
      discountStartsAt?: string | Date | null;
      discountEndsAt?: string | Date | null;
      imageUrl?: string | null;
      badge?: MenuItemBadge | null;
      tags?: MenuItemTag[];
      ingredients?: string[];
      isVisible?: boolean;
      isAvailable?: boolean;
      isFeatured?: boolean;
      variants?: MenuItemVariant[];
      sizes?: MenuItemSize[];
      extras?: MenuItemExtra[];
    }
  ): Promise<MenuItem | null> {
    const db = getDb();
    const hasBadge = data.badge !== undefined;
    const hasTags = data.tags !== undefined;
    const hasIngredients = data.ingredients !== undefined;
    const hasOriginalPrice = data.originalPrice !== undefined;
    const hasDiscountStartsAt = data.discountStartsAt !== undefined;
    const hasDiscountEndsAt = data.discountEndsAt !== undefined;

    const row = await db.queryOne<MenuItemRow>(
      `UPDATE menu_items
       SET category_id = COALESCE($3, category_id),
           name = COALESCE($4, name),
           description = COALESCE($5, description),
           price = COALESCE($6, price),
           original_price = CASE WHEN $7::boolean THEN $8 ELSE original_price END,
           discount_starts_at = CASE WHEN $9::boolean THEN $10::timestamptz ELSE discount_starts_at END,
           discount_ends_at = CASE WHEN $11::boolean THEN $12::timestamptz ELSE discount_ends_at END,
           image_url = COALESCE($13, image_url),
           badge = CASE WHEN $14::boolean THEN $15 ELSE badge END,
           tags = CASE WHEN $16::boolean THEN $17::jsonb ELSE tags END,
           ingredients = CASE WHEN $18::boolean THEN $19::jsonb ELSE ingredients END,
           is_visible = COALESCE($20, is_visible),
           is_available = COALESCE($21, is_available),
           is_featured = COALESCE($22, is_featured),
           variants = COALESCE($23::jsonb, variants),
           sizes = COALESCE($24::jsonb, sizes),
           extras = COALESCE($25::jsonb, extras),
           updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2 AND deleted_at IS NULL
       RETURNING id, restaurant_id AS "restaurantId", category_id AS "categoryId",
                 name, description, price, original_price AS "originalPrice",
                 discount_starts_at AS "discountStartsAt", discount_ends_at AS "discountEndsAt",
                 image_url AS "imageUrl", badge, tags, ingredients,
                 is_visible AS "isVisible", is_available AS "isAvailable", is_featured AS "isFeatured",
                 variants, sizes, extras,
                 sort_order AS "sortOrder", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        itemId,
        restaurantId,
        data.categoryId === undefined ? null : data.categoryId,
        data.name?.trim(),
        data.description,
        data.price,
        hasOriginalPrice,
        data.originalPrice !== undefined ? data.originalPrice : null,
        hasDiscountStartsAt,
        data.discountStartsAt !== undefined ? data.discountStartsAt : null,
        hasDiscountEndsAt,
        data.discountEndsAt !== undefined ? data.discountEndsAt : null,
        data.imageUrl,
        hasBadge,
        data.badge || null,
        hasTags,
        data.tags ? JSON.stringify(data.tags) : null,
        hasIngredients,
        data.ingredients ? JSON.stringify(data.ingredients) : null,
        data.isVisible,
        data.isAvailable,
        data.isFeatured,
        data.variants ? JSON.stringify(data.variants) : null,
        data.sizes ? JSON.stringify(data.sizes) : null,
        data.extras ? JSON.stringify(data.extras) : null,
      ]
    );

    if (!row) return null;

    return mapMenuItemRow(row);
  },

  /**
   * Toggles item availability quickly (Available / Hidden).
   */
  async toggleAvailability(itemId: string, restaurantId: string, isAvailable: boolean): Promise<boolean> {
    const db = getDb();
    await db.query(
      `UPDATE menu_items
       SET is_available = $3, updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2 AND deleted_at IS NULL`,
      [itemId, restaurantId, isAvailable]
    );
    return true;
  },

  /**
   * Soft deletes a menu item.
   */
  async softDelete(itemId: string, restaurantId: string): Promise<boolean> {
    const db = getDb();
    await db.query(
      `UPDATE menu_items
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2 AND deleted_at IS NULL`,
      [itemId, restaurantId]
    );
    return true;
  },

  /**
   * Permanently deletes a menu item from the database (hard delete).
   * Uses restaurant_id guard to prevent cross-tenant deletion.
   * Returns the deleted item's image_url if any, so the storage file can be cleaned up.
   */
  async hardDelete(itemId: string, restaurantId: string): Promise<{ deleted: boolean; imageUrl: string | null }> {
    const db = getDb();
    const rows = await db.query<{ image_url: string | null }>(
      `DELETE FROM menu_items
       WHERE id = $1 AND restaurant_id = $2
       RETURNING image_url`,
      [itemId, restaurantId]
    );
    const row = rows[0];
    return {
      deleted: rows.length > 0,
      imageUrl: row?.image_url ?? null,
    };
  },
};
