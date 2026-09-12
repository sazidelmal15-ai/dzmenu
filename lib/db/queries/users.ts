import "server-only";
import { getDb } from "../client";
import type { UserRole, UserRestaurantAccess } from "@/types/auth";
import type { User } from "@/types/user";

export interface UserWithPassword extends User {
  passwordHash: string;
}

/**
 * User Queries (Soft Delete Enforced: WHERE deleted_at IS NULL)
 */
export const userQueries = {
  /**
   * Finds an active user by email, including password hash for authentication verification.
   */
  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const db = getDb();
    return db.queryOne<UserWithPassword>(
      `SELECT id, email, password_hash AS "passwordHash", full_name AS "fullName", 
              role, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users
       WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL AND is_active = TRUE`,
      [email]
    );
  },

  /**
   * Finds an active user by ID without returning password hash.
   */
  async findById(id: string): Promise<User | null> {
    const db = getDb();
    return db.queryOne<User>(
      `SELECT id, email, full_name AS "fullName", role, is_active AS "isActive", 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users
       WHERE id = $1 AND deleted_at IS NULL AND is_active = TRUE`,
      [id]
    );
  },

  /**
   * Creates a new user in the database.
   */
  async create(
    email: string,
    passwordHash: string,
    fullName?: string | null,
    role: UserRole = "RESTAURANT_OWNER"
  ): Promise<User> {
    const db = getDb();
    const row = await db.queryOne<User>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
       RETURNING id, email, full_name AS "fullName", role, is_active AS "isActive", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [email.toLowerCase().trim(), passwordHash, fullName || null, role]
    );

    if (!row) {
      throw new Error("Failed to insert user record");
    }

    return row;
  },

  /**
   * Fetches all restaurant tenant memberships for a specific user.
   */
  async findUserMemberships(userId: string): Promise<UserRestaurantAccess[]> {
    const db = getDb();
    return db.query<UserRestaurantAccess>(
      `SELECT restaurant_id AS "restaurantId", role
       FROM restaurant_members
       WHERE user_id = $1`,
      [userId]
    );
  },
};
