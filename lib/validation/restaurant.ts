import { z } from "zod";
import { safeTextSchema, slugSchema } from "./common";

/**
 * Restaurant creation validation schema.
 */
export const createRestaurantSchema = z.object({
  name: safeTextSchema(2, 100),
  slug: slugSchema,
  description: z.string().max(500).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  currency: z.string().length(3).default("DZD"),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

/**
 * Restaurant update validation schema.
 */
export const updateRestaurantSchema = createRestaurantSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"]).optional(),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
