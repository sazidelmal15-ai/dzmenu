/**
 * Centralized Domain Utility for Menu Item Discounts and Promotion Schedules.
 * 
 * Rules:
 * 1. Discount state is ALWAYS derived at runtime from server time, never stored in DB.
 * 2. Normal price is never mutated when a discount starts or expires.
 * 3. Consistent time boundary convention: startsAt <= now < endsAt.
 * 4. Discount percentage is deterministic: Math.round(((originalPrice - price) / originalPrice) * 100).
 */

import { z } from "zod";

export type DiscountState = "none" | "scheduled" | "active" | "expired";

export const DEFAULT_RESTAURANT_TIMEZONE = "Africa/Algiers";

export interface DiscountEvaluationParams {
  price: number;
  originalPrice?: number | null;
  discountStartsAt?: string | Date | null;
  discountEndsAt?: string | Date | null;
  now?: Date;
}

export interface DerivedDiscountInfo {
  state: DiscountState;
  isActive: boolean;
  percentage: number | null;
  savings: number | null;
  originalPrice: number | null;
  startsAt: string | null;
  endsAt: string | null;
}

/**
 * Calculates the exact, deterministic discount state according to server time.
 * Boundary convention:
 * - If no originalPrice or originalPrice <= price: 'none'
 * - If startsAt is set and now < startsAt: 'scheduled'
 * - If endsAt is set and now >= endsAt: 'expired'
 * - If startsAt <= now < endsAt (or open-ended window): 'active'
 */
export function calculateDiscountState({
  price,
  originalPrice,
  discountStartsAt,
  discountEndsAt,
  now = new Date(),
}: DiscountEvaluationParams): DiscountState {
  const numPrice = Number(price) || 0;
  const numOriginal = originalPrice != null ? Number(originalPrice) : null;

  if (numOriginal == null || isNaN(numOriginal) || numOriginal <= numPrice) {
    return "none";
  }

  const nowMs = now.getTime();

  let startMs: number | null = null;
  if (discountStartsAt) {
    const d = new Date(discountStartsAt);
    if (!isNaN(d.getTime())) {
      startMs = d.getTime();
    }
  }

  let endMs: number | null = null;
  if (discountEndsAt) {
    const d = new Date(discountEndsAt);
    if (!isNaN(d.getTime())) {
      endMs = d.getTime();
    }
  }

  // Before scheduled start window
  if (startMs !== null && nowMs < startMs) {
    return "scheduled";
  }

  // At or after expiration boundary (startsAt <= now < endsAt)
  if (endMs !== null && nowMs >= endMs) {
    return "expired";
  }

  return "active";
}

/**
 * Convenience helper returning whether a discount is actively valid right now.
 */
export function isDiscountActive(params: DiscountEvaluationParams): boolean {
  return calculateDiscountState(params) === "active";
}

/**
 * Calculates the rounded integer discount percentage (e.g. 25 for 25%).
 * Only calculated when originalPrice > price.
 */
export function calculateDiscountPercentage(
  price: number,
  originalPrice: number | null | undefined
): number | null {
  const numPrice = Number(price) || 0;
  const numOriginal = originalPrice != null ? Number(originalPrice) : null;

  if (numOriginal == null || isNaN(numOriginal) || numOriginal <= numPrice || numOriginal <= 0) {
    return null;
  }

  const pct = ((numOriginal - numPrice) / numOriginal) * 100;
  return Math.round(pct);
}

/**
 * Calculates exact monetary savings amount (originalPrice - price).
 */
export function calculateSavings(
  price: number,
  originalPrice: number | null | undefined
): number | null {
  const numPrice = Number(price) || 0;
  const numOriginal = originalPrice != null ? Number(originalPrice) : null;

  if (numOriginal == null || isNaN(numOriginal) || numOriginal <= numPrice) {
    return null;
  }

  return Math.round((numOriginal - numPrice) * 100) / 100;
}

/**
 * Formats an ISO date into YYYY-MM-DDTHH:mm for <input type="datetime-local">
 * using the restaurant's configured timezone (default Africa/Algiers).
 */
export function formatDateTimeLocal(
  isoDate: string | Date | null | undefined,
  timeZone: string = DEFAULT_RESTAURANT_TIMEZONE
): string {
  if (!isoDate) return "";
  const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  if (isNaN(d.getTime())) return "";

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    let hour = getPart("hour");
    if (hour === "24") hour = "00";
    const minute = getPart("minute");

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    // Fallback if timezone not supported
    return d.toISOString().slice(0, 16);
  }
}

/**
 * Parses a datetime-local string ("YYYY-MM-DDTHH:mm") as an instant in the
 * restaurant timezone (default Africa/Algiers), returning an absolute ISO UTC string.
 */
export function parseDateTimeLocal(
  localDateTimeStr: string | null | undefined,
  timeZone: string = DEFAULT_RESTAURANT_TIMEZONE
): string | null {
  if (!localDateTimeStr || !localDateTimeStr.trim()) return null;
  const trimmed = localDateTimeStr.trim();

  // If already contains full timezone offset or UTC 'Z', parse directly
  if (trimmed.endsWith("Z") || /[+-]\d{2}(:?\d{2})?$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Match "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm"
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback.toISOString();
  }

  const [, y, m, d, h, min, s = "00"] = match;

  // In Africa/Algiers, offset is permanently UTC+1 (+01:00)
  if (timeZone === "Africa/Algiers" || timeZone === "DZD" || timeZone === "DZ") {
    const isoString = `${y}-${m}-${d}T${h}:${min}:${s}+01:00`;
    const dateObj = new Date(isoString);
    return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
  }

  // General timezone offset resolution via Intl
  try {
    const dateEstimate = new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const parts = tzFormatter.formatToParts(dateEstimate);
    const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+1";
    const offsetMatch = offsetPart.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
    let offsetStr = "+01:00";
    if (offsetMatch) {
      const sign = offsetMatch[1].startsWith("-") ? "-" : "+";
      const hours = Math.abs(parseInt(offsetMatch[1], 10)).toString().padStart(2, "0");
      const minutes = (offsetMatch[2] || "00").padStart(2, "0");
      offsetStr = `${sign}${hours}:${minutes}`;
    }
    const isoString = `${y}-${m}-${d}T${h}:${min}:${s}${offsetStr}`;
    const dateObj = new Date(isoString);
    return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
  } catch {
    const fallbackIso = `${y}-${m}-${d}T${h}:${min}:${s}+01:00`;
    const dateObj = new Date(fallbackIso);
    return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
  }
}

/**
 * Evaluates all derived discount metrics in one pass.
 */
export function evaluateItemDiscount(params: DiscountEvaluationParams): DerivedDiscountInfo {
  const state = calculateDiscountState(params);
  const isActive = state === "active";
  const percentage = isActive ? calculateDiscountPercentage(params.price, params.originalPrice) : null;
  const savings = isActive ? calculateSavings(params.price, params.originalPrice) : null;

  const startsAt = params.discountStartsAt ? parseDateTimeLocal(String(params.discountStartsAt)) : null;
  const endsAt = params.discountEndsAt ? parseDateTimeLocal(String(params.discountEndsAt)) : null;
  const originalPrice = params.originalPrice != null ? Number(params.originalPrice) : null;

  return {
    state,
    isActive,
    percentage,
    savings,
    originalPrice,
    startsAt,
    endsAt,
  };
}

// ============================================================================
// INGREDIENTS VALIDATION & NORMALIZATION
// ============================================================================

export const MAX_INGREDIENTS_COUNT = 30;
export const MAX_INGREDIENT_LENGTH = 120;

/**
 * Sanitizes and cleans an ingredients array, preserving the exact canonical order.
 */
export function sanitizeIngredients(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, MAX_INGREDIENTS_COUNT);
}

// ============================================================================
// SERVER-SIDE ZOD VALIDATION SCHEMAS
// ============================================================================

export const MENU_ITEM_BADGES = [
  "CHEF_PICK",
  "BEST_SELLER",
  "NEW",
  "SIGNATURE",
  "SPECIAL_OFFER",
] as const;

export const MENU_ITEM_TAGS = [
  "spicy",
  "vegetarian",
  "vegan",
  "gluten_free",
  "nuts",
] as const;

export const ingredientsSchema = z
  .array(
    z
      .string({ invalid_type_error: "Each ingredient must be a string" })
      .trim()
      .min(1, "Ingredient cannot be empty")
      .max(MAX_INGREDIENT_LENGTH, `Ingredient cannot exceed ${MAX_INGREDIENT_LENGTH} characters`)
  )
  .max(MAX_INGREDIENTS_COUNT, `Maximum ${MAX_INGREDIENTS_COUNT} ingredients allowed`)
  .default([]);

export const menuItemCreateSchema = z
  .object({
    categoryId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val)),
    name: z.string().trim().min(1, "Item name is required").max(120, "Item name is too long"),
    description: z.string().trim().max(1000, "Description is too long").nullable().optional(),
    price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
    originalPrice: z.coerce
      .number()
      .min(0, "Original price must be greater than or equal to 0")
      .nullable()
      .optional(),
    discountStartsAt: z.string().nullable().optional(),
    discountEndsAt: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    badge: z
      .enum(MENU_ITEM_BADGES)
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val)),
    tags: z.array(z.enum(MENU_ITEM_TAGS)).optional().default([]),
    ingredients: ingredientsSchema,
    isVisible: z.boolean().optional().default(true),
    isAvailable: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    variants: z.array(z.any()).optional().default([]),
    sizes: z.array(z.any()).optional().default([]),
    extras: z.array(z.any()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.originalPrice != null && data.originalPrice > 0) {
        return data.originalPrice > data.price;
      }
      return true;
    },
    {
      message: "Original price must be strictly greater than selling price",
      path: ["originalPrice"],
    }
  )
  .refine(
    (data) => {
      if (data.discountStartsAt && data.discountEndsAt) {
        const start = new Date(data.discountStartsAt).getTime();
        const end = new Date(data.discountEndsAt).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          return start < end;
        }
      }
      return true;
    },
    {
      message: "Discount start date must be before end date",
      path: ["discountEndsAt"],
    }
  );

export const menuItemUpdateSchema = z
  .object({
    categoryId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val)),
    name: z.string().trim().min(1, "Item name is required").max(120).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    price: z.coerce.number().min(0, "Price must be greater than or equal to 0").optional(),
    originalPrice: z.coerce
      .number()
      .min(0, "Original price must be greater than or equal to 0")
      .nullable()
      .optional(),
    discountStartsAt: z.string().nullable().optional(),
    discountEndsAt: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    badge: z
      .enum(MENU_ITEM_BADGES)
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val)),
    tags: z.array(z.enum(MENU_ITEM_TAGS)).optional(),
    ingredients: ingredientsSchema.optional(),
    isVisible: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    variants: z.array(z.any()).optional(),
    sizes: z.array(z.any()).optional(),
    extras: z.array(z.any()).optional(),
    isDeleted: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.originalPrice != null && data.price != null && data.originalPrice > 0) {
        return data.originalPrice > data.price;
      }
      return true;
    },
    {
      message: "Original price must be strictly greater than selling price",
      path: ["originalPrice"],
    }
  )
  .refine(
    (data) => {
      if (data.discountStartsAt && data.discountEndsAt) {
        const start = new Date(data.discountStartsAt).getTime();
        const end = new Date(data.discountEndsAt).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          return start < end;
        }
      }
      return true;
    },
    {
      message: "Discount start date must be before end date",
      path: ["discountEndsAt"],
    }
  );

