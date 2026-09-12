import { z } from "zod";

/**
 * UUID Schema
 */
export const idSchema = z.string().uuid("Invalid unique identifier format");

/**
 * URL Slug Schema (lowercase alphanumeric with hyphens)
 */
export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must not exceed 50 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  );

/**
 * Standard pagination query parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Safe sanitized non-empty text string schema
 */
export const safeTextSchema = (minLength = 1, maxLength = 255) =>
  z
    .string()
    .trim()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must not exceed ${maxLength} characters`);
