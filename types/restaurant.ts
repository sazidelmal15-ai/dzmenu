import type { OperatingHourDaySchedule } from "@/types/theme-contract";

/**
 * Restaurant tenant status (supports soft deletes via ARCHIVED/SUSPENDED/INACTIVE).
 */
export type RestaurantStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED" | "MAINTENANCE" | "PAUSED";

/**
 * Restaurant entity representing a tenant in DZMenu.
 */
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string | null;
  description: string | null;
  isSubdomainLocked: boolean;
  cuisineTypes: string[];
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  alwaysOpen: boolean;
  operatingHours: OperatingHourDaySchedule[];
  tiktokUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  currency: string;
  status: RestaurantStatus;
  activeThemeId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantProfileUpdatePayload {
  name?: string;
  slug?: string;
  isSubdomainLocked?: boolean;
  logoUrl?: string | null;
  coverUrl?: string | null;
  tagline?: string | null;
  description?: string | null;
  cuisineTypes?: string[];
  currency?: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  alwaysOpen?: boolean;
  operatingHours?: OperatingHourDaySchedule[];
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  status?: RestaurantStatus;
}

/**
 * User-to-Restaurant tenant membership relationship.
 */
export interface RestaurantMember {
  id: string;
  userId: string;
  restaurantId: string;
  role: "RESTAURANT_OWNER" | "MANAGER";
  createdAt: Date;
}

/**
 * Validated server-side tenant execution context.
 */
export interface TenantContext {
  restaurantId: string;
  restaurant?: Restaurant;
  isOwner: boolean;
  isPlatformAdmin: boolean;
}
