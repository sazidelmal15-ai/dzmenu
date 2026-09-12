import type { UserRole } from "@/types/auth";

/**
 * Standard Role Constants
 */
export const ROLES = {
  SUPER_OWNER: "SUPER_OWNER",
  SUPER_ADMIN: "SUPER_ADMIN", // Backward-compatible alias
  SUPPORT: "SUPPORT",
  RESTAURANT_OWNER: "RESTAURANT_OWNER",
  PUBLIC_USER: "PUBLIC_USER",
} as const satisfies Record<string, UserRole>;

/**
 * Human-readable role labels
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_OWNER: "Super Owner (Platform Owner)",
  SUPER_ADMIN: "Super Admin (Platform Owner)",
  SUPPORT: "Platform Support",
  RESTAURANT_OWNER: "Restaurant Owner",
  PUBLIC_USER: "Customer",
};

/**
 * Roles with platform-wide administrative privileges
 */
export const PLATFORM_ADMIN_ROLES: readonly UserRole[] = [
  ROLES.SUPER_OWNER,
  ROLES.SUPER_ADMIN,
  ROLES.SUPPORT,
] as const;

/**
 * Helper to check if role is a platform administrator
 */
export function isPlatformAdminRole(role: UserRole): boolean {
  return (
    role === ROLES.SUPER_OWNER ||
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.SUPPORT
  );
}

/**
 * Helper to check if role is a super platform owner
 */
export function isSuperOwnerRole(role: UserRole): boolean {
  return role === ROLES.SUPER_OWNER || role === ROLES.SUPER_ADMIN;
}
