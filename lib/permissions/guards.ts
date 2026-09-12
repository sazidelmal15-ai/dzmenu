import "server-only";
import { getCurrentUser } from "@/lib/auth/context";
import { ROLES, isPlatformAdminRole } from "@/constants/roles";
import { subscriptionQueries } from "@/lib/db/queries";
import type { CurrentUser, UserRole } from "@/types/auth";
import type { TenantContext } from "@/types/restaurant";
import type { Subscription } from "@/types/subscription";
import {
  ForbiddenError,
  SubscriptionExpiredError,
  SubscriptionRequiredError,
  TenantAccessDeniedError,
  UnauthorizedError,
} from "./errors";

/**
 * Checks if a user has one of the specified roles.
 * Supports role hierarchy: SUPER_OWNER satisfies SUPER_ADMIN, etc.
 */
export function hasRole(
  user: CurrentUser | null,
  roles: UserRole | readonly UserRole[]
): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  const roleList = Array.isArray(roles) ? roles : [roles];

  // Super Owners always satisfy admin role checks
  if (
    user.role === ROLES.SUPER_OWNER ||
    user.role === ROLES.SUPER_ADMIN
  ) {
    return true;
  }

  return roleList.includes(user.role);
}

/**
 * Enforces that the current request is authenticated.
 * Throws UnauthorizedError if unauthenticated.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user || !user.isActive) {
    throw new UnauthorizedError();
  }

  return user;
}

/**
 * Enforces that the current request has one of the allowed roles.
 * Throws UnauthorizedError if not logged in, or ForbiddenError if role is insufficient.
 */
export async function requireRole(
  allowedRoles: UserRole | readonly UserRole[]
): Promise<CurrentUser> {
  const user = await requireAuth();

  if (!hasRole(user, allowedRoles)) {
    throw new ForbiddenError();
  }

  return user;
}

/**
 * Authorization predicate for tenant-level isolation.
 * Returns true if the user is a platform admin OR has an active membership for the given restaurant.
 */
export function canAccessTenant(
  user: CurrentUser,
  restaurantId: string
): boolean {
  if (!user.isActive) {
    return false;
  }

  // Platform admins (SUPER_OWNER, SUPER_ADMIN, SUPPORT) can access all restaurants
  if (isPlatformAdminRole(user.role)) {
    return true;
  }

  // Restaurant owners and managers must have explicit membership in this restaurant
  return user.restaurants.some(
    (membership) => membership.restaurantId === restaurantId
  );
}

/**
 * Enforces server-side tenant isolation.
 * Verifies that the authenticated user owns or has authorized access to the specified restaurant.
 * Throws TenantAccessDeniedError if cross-restaurant access is attempted.
 */
export async function requireRestaurantAccess(
  restaurantId: string
): Promise<TenantContext> {
  if (!restaurantId || typeof restaurantId !== "string") {
    throw new TenantAccessDeniedError(
      restaurantId || "unknown",
      "Invalid restaurant identifier."
    );
  }

  const user = await requireAuth();

  if (!canAccessTenant(user, restaurantId)) {
    throw new TenantAccessDeniedError(restaurantId);
  }

  const isPlatformAdmin = isPlatformAdminRole(user.role);
  const userMembership = user.restaurants.find(
    (m) => m.restaurantId === restaurantId
  );

  return {
    restaurantId,
    isOwner: isPlatformAdmin || userMembership?.role === "RESTAURANT_OWNER",
    isPlatformAdmin,
  };
}

/**
 * Checks if a restaurant has an active, non-expired subscription.
 */
export async function hasActiveSubscription(restaurantId: string): Promise<boolean> {
  const subscription = await subscriptionQueries.findByRestaurantId(restaurantId);
  if (!subscription) {
    return false;
  }

  const isStatusActive =
    subscription.status === "ACTIVE" || subscription.status === "TRIALING";
  const isNotExpired =
    new Date(subscription.currentPeriodEnd).getTime() > Date.now();

  return isStatusActive && isNotExpired;
}

/**
 * Enforces that the restaurant tenant has an active subscription.
 * Required for all write mutations (updating menus, creating items, changing appearance, etc.).
 * Platform Admins bypass this restriction.
 * Throws SubscriptionRequiredError or SubscriptionExpiredError.
 */
export async function requireActiveSubscription(
  restaurantId: string
): Promise<{ tenant: TenantContext; subscription: Subscription | null }> {
  // 1. Verify user has tenant access
  const tenant = await requireRestaurantAccess(restaurantId);

  // 2. Platform Admins (SUPER_OWNER, SUPPORT) bypass subscription enforcement
  if (tenant.isPlatformAdmin) {
    const sub = await subscriptionQueries.findByRestaurantId(restaurantId);
    return { tenant, subscription: sub };
  }

  // 3. Fetch subscription record from database
  const subscription = await subscriptionQueries.findByRestaurantId(restaurantId);

  if (!subscription) {
    throw new SubscriptionRequiredError(restaurantId);
  }

  const isStatusActive =
    subscription.status === "ACTIVE" || subscription.status === "TRIALING";
  const isNotExpired =
    new Date(subscription.currentPeriodEnd).getTime() > Date.now();

  if (!isStatusActive || !isNotExpired) {
    throw new SubscriptionExpiredError(restaurantId);
  }

  return { tenant, subscription };
}
