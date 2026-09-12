/**
 * Core user roles in DZMenu.
 * SUPER_OWNER: Platform administrator / owner (full platform access)
 * SUPER_ADMIN: Alias for SUPER_OWNER to maintain backward compatibility
 * SUPPORT: Platform support staff with controlled administrative access
 * RESTAURANT_OWNER: Restaurant owner / tenant manager
 * PUBLIC_USER: Unauthenticated customer viewing public menus
 */
export type UserRole =
  | "SUPER_OWNER"
  | "SUPER_ADMIN"
  | "SUPPORT"
  | "RESTAURANT_OWNER"
  | "PUBLIC_USER";

/**
 * Tenant membership for a user associated with a specific restaurant.
 */
export interface UserRestaurantAccess {
  restaurantId: string;
  role: "RESTAURANT_OWNER" | "MANAGER";
}

/**
 * Sanitized user identity decoded from a validated server session.
 */
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  restaurants: UserRestaurantAccess[];
  isActive: boolean;
}

/**
 * Server-side validated authentication session.
 */
export interface AuthSession {
  sessionId: string;
  userId: string;
  user: CurrentUser;
  createdAt: number;
  expiresAt: number;
}
