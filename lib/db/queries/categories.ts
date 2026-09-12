import "server-only";
import { getDb } from "../client";
import type { Category } from "@/types/menu";

/**
 * Category Query Helpers (Soft Delete Enforced)
 */
export const categoryQueries = {
  /**
   * List all categories for a restaurant, with count of active menu items.
   * Can include soft-deleted categories if includeDeleted is true.
   */
  async listByRestaurantId(restaurantId: string, includeDeleted = false): Promise<Category[]> {
    const db = getDb();
    return db.query<Category>(
      `SELECT c.id, c.restaurant_id AS "restaurantId", c.name, c.description, c.icon,
              c.short_name AS "shortName", c.image_url AS "imageUrl", c.badge,
              c.sort_order AS "sortOrder",
              COALESCE(c.is_active, TRUE) AS "isActive",
              (c.deleted_at IS NOT NULL) AS "isDeleted",
              c.created_at AS "createdAt", c.updated_at AS "updatedAt",
              COUNT(mi.id)::int AS "itemCount"
       FROM categories c
       LEFT JOIN menu_items mi ON mi.category_id = c.id AND mi.deleted_at IS NULL
       WHERE c.restaurant_id = $1 ${includeDeleted ? '' : 'AND c.deleted_at IS NULL'}
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.created_at ASC`,
      [restaurantId]
    );
  },

  /**
   * Creates a single category.
   */
  async create(
    restaurantId: string,
    name: string,
    description?: string | null,
    icon?: string | null,
    sortOrder = 0,
    shortName?: string | null,
    imageUrl?: string | null,
    badge?: string | null,
    isActive = true
  ): Promise<Category> {
    const db = getDb();
    const row = await db.queryOne<Category>(
      `INSERT INTO categories (restaurant_id, name, short_name, description, icon, image_url, badge, sort_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, restaurant_id AS "restaurantId", name, short_name AS "shortName",
                 description, icon, image_url AS "imageUrl", badge,
                 sort_order AS "sortOrder",
                 COALESCE(is_active, TRUE) AS "isActive",
                 (deleted_at IS NOT NULL) AS "isDeleted",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        restaurantId,
        name.trim(),
        shortName ? shortName.trim() : null,
        description ? description.trim() : null,
        icon || "🍽️",
        imageUrl || null,
        badge || null,
        sortOrder,
        isActive,
      ]
    );

    if (!row) {
      throw new Error("Failed to create category");
    }

    // Safety: Auto-link any previous items matching this category name that had a deleted category
    await db.query(
      `UPDATE menu_items mi
       SET category_id = $1
       FROM categories old_cat
       WHERE mi.category_id = old_cat.id
         AND old_cat.deleted_at IS NOT NULL
         AND LOWER(old_cat.name) = LOWER($2)
         AND mi.restaurant_id = $3
         AND mi.deleted_at IS NULL`,
      [row.id, name.trim(), restaurantId]
    );

    return row;
  },

  /**
   * Updates an existing category.
   */
  async update(
    categoryId: string,
    restaurantId: string,
    data: {
      name?: string;
      shortName?: string | null;
      description?: string | null;
      icon?: string | null;
      badge?: string | null;
      sortOrder?: number;
      imageUrl?: string | null;
      isActive?: boolean;
    }
  ): Promise<Category | null> {
    const db = getDb();
    return db.queryOne<Category>(
      `UPDATE categories
       SET name        = COALESCE($3, name),
           short_name  = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE short_name END,
           description = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE description END,
           icon        = CASE WHEN $6::text IS NOT NULL THEN $6 ELSE icon END,
           badge       = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE badge END,
           sort_order  = COALESCE($8, sort_order),
           image_url   = CASE WHEN $9::text IS NOT NULL THEN $9 ELSE image_url END,
           is_active   = COALESCE($10, is_active),
           deleted_at  = NULL,
           updated_at  = NOW()
       WHERE id = $1 AND restaurant_id = $2
       RETURNING id, restaurant_id AS "restaurantId", name, short_name AS "shortName",
                 description, icon, badge, image_url AS "imageUrl",
                 sort_order AS "sortOrder",
                 COALESCE(is_active, TRUE) AS "isActive",
                 (deleted_at IS NOT NULL) AS "isDeleted",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        categoryId,
        restaurantId,
        data.name !== undefined ? data.name.trim() : null,
        data.shortName !== undefined ? data.shortName : null,
        data.description !== undefined ? data.description : null,
        data.icon !== undefined ? data.icon : null,
        data.badge !== undefined ? data.badge : null,
        data.sortOrder !== undefined ? data.sortOrder : null,
        data.imageUrl !== undefined ? data.imageUrl : null,
        data.isActive !== undefined ? data.isActive : null,
      ]
    );
  },

  /**
   * Soft deletes a category.
   */
  async softDelete(categoryId: string, restaurantId: string): Promise<boolean> {
    const db = getDb();
    await db.query(
      `UPDATE categories
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2 AND deleted_at IS NULL`,
      [categoryId, restaurantId]
    );
    return true;
  },

  /**
   * Restores a previously soft-deleted category (retaining its items and custom icon).
   */
  async restore(categoryId: string, restaurantId: string, sortOrder?: number): Promise<boolean> {
    const db = getDb();
    await db.query(
      `UPDATE categories
       SET deleted_at = NULL, is_active = TRUE,
           sort_order = COALESCE($3, sort_order),
           updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2`,
      [categoryId, restaurantId, sortOrder !== undefined ? sortOrder : null]
    );
    return true;
  },
};
