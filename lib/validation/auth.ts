import { z } from "zod";
import { safeTextSchema, slugSchema } from "./common";

/**
 * Login input validation schema.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Restaurant Owner Signup validation schema.
 */
export const registerSchema = z.object({
  fullName: safeTextSchema(2, 100),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
  restaurantName: safeTextSchema(2, 100),
  restaurantSlug: slugSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Password reset request validation schema.
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
