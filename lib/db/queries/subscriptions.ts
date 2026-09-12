import "server-only";
import { getDb } from "../client";
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";

/**
 * Subscription query helpers.
 */
export const subscriptionQueries = {
  /**
   * Creates an initial subscription record for a restaurant.
   */
  async create(
    restaurantId: string,
    plan: SubscriptionPlan = "STANDARD_ANNUAL",
    status: SubscriptionStatus = "INACTIVE" as SubscriptionStatus,
    periodEnd?: Date
  ): Promise<Subscription> {
    const db = getDb();
    const end = periodEnd || new Date(Date.now() - 1000); // Default to expired/inactive until activated
    const row = await db.queryOne<Subscription>(
      `INSERT INTO subscriptions (restaurant_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW())
       ON CONFLICT (restaurant_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING id, restaurant_id AS "restaurantId", plan, status, 
                 current_period_start AS "currentPeriodStart", 
                 current_period_end AS "currentPeriodEnd", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [restaurantId, plan, status, end]
    );

    if (!row) {
      throw new Error("Failed to create subscription record");
    }

    return row;
  },

  /**
   * Fetches the subscription for a specific restaurant tenant.
   */
  async findByRestaurantId(restaurantId: string): Promise<Subscription | null> {
    const db = getDb();
    return db.queryOne<Subscription>(
      `SELECT id, restaurant_id AS "restaurantId", plan, status, 
              current_period_start AS "currentPeriodStart", 
              current_period_end AS "currentPeriodEnd", 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM subscriptions
       WHERE restaurant_id = $1`,
      [restaurantId]
    );
  },

  /**
   * Activates or extends a restaurant's annual subscription for 365 days.
   */
  async activateOrExtend(restaurantId: string, durationDays = 365): Promise<Subscription> {
    const db = getDb();
    const existing = await this.findByRestaurantId(restaurantId);

    const now = new Date();
    let startDate = now;
    let endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // If already active and not expired, extend from existing expiration date
    if (existing && existing.status === "ACTIVE" && new Date(existing.currentPeriodEnd) > now) {
      startDate = new Date(existing.currentPeriodStart);
      endDate = new Date(new Date(existing.currentPeriodEnd).getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    const row = await db.queryOne<Subscription>(
      `INSERT INTO subscriptions (restaurant_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, 'STANDARD_ANNUAL', 'ACTIVE', $2, $3, NOW(), NOW())
       ON CONFLICT (restaurant_id) DO UPDATE SET
         status = 'ACTIVE',
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()
       RETURNING id, restaurant_id AS "restaurantId", plan, status, 
                 current_period_start AS "currentPeriodStart", 
                 current_period_end AS "currentPeriodEnd", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [restaurantId, startDate, endDate]
    );

    if (!row) {
      throw new Error("Failed to activate/extend subscription");
    }

    return row;
  },
};
