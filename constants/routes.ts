/**
 * Centralized Route Paths for DZMenu
 */
export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  
  // Authenticated Admin Platform
  ADMIN: "/admin",
  
  // Authenticated Restaurant Tenant Routes (Clean URLs)
  DASHBOARD: "/menu",
  MENU: "/menu",
  ANALYTICS: "/analytics",
  PROFILE: "/profile",
  THEMES: "/themes",
  QR: "/qr",
  SETTINGS: "/settings",
  
  // API Routes
  API: {
    HEALTH: "/api/health",
  },
} as const;

/**
 * Routes that do not require authentication
 */
export const PUBLIC_ROUTES: readonly string[] = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.API.HEALTH,
] as const;

/**
 * Route prefixes requiring platform admin access
 */
export const ADMIN_ROUTE_PREFIX = "/admin";

/**
 * Route prefixes requiring restaurant tenant access
 */
export const DASHBOARD_ROUTE_PREFIX = "/dashboard";
export const RESTAURANT_PROTECTED_PREFIXES: readonly string[] = [
  "/menu",
  "/analytics",
  "/profile",
  "/themes",
  "/qr",
  "/settings",
  "/dashboard",
] as const;
