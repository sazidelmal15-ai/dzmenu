import "server-only";
import { getDb, type DatabaseAdapter } from "../client";
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
    periodEnd?: Date,
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription> {
    const db = dbOrTx || getDb();
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
  async findByRestaurantId(
    restaurantId: string,
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription | null> {
    const db = dbOrTx || getDb();
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
   * Activates a specific plan for a given duration in days.
   */
  async activatePlan(
    restaurantId: string,
    plan: string,
    durationDays: number,
    isTrial = false,
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription> {
    const db = dbOrTx || getDb();
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const status: SubscriptionStatus = isTrial ? "TRIALING" : "ACTIVE";

    const row = await db.queryOne<Subscription>(
      `INSERT INTO subscriptions (restaurant_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (restaurant_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()
       RETURNING id, restaurant_id AS "restaurantId", plan, status, 
                 current_period_start AS "currentPeriodStart", 
                 current_period_end AS "currentPeriodEnd", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [restaurantId, plan, status, startDate, endDate]
    );

    if (!row) {
      throw new Error(`Failed to activate plan ${plan} for restaurant ${restaurantId}`);
    }

    return row;
  },

  /**
   * Extends the subscription period by a specified number of days.
   * If subscription is currently active or in trial and unexpired, appends duration to existing end date.
   * If expired or inactive, starts a new period starting NOW.
   */
  async extendPeriod(
    restaurantId: string,
    durationDays: number,
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription> {
    const db = dbOrTx || getDb();
    const existing = await this.findByRestaurantId(restaurantId, db);

    const now = new Date();
    let startDate = now;
    let endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const plan = existing?.plan || "STANDARD_ANNUAL";
    let status: SubscriptionStatus = "ACTIVE";

    if (existing) {
      const isUnexpired = new Date(existing.currentPeriodEnd) > now;
      if (isUnexpired && (existing.status === "ACTIVE" || existing.status === "TRIALING" || existing.status === "TRIAL")) {
        startDate = new Date(existing.currentPeriodStart);
        endDate = new Date(new Date(existing.currentPeriodEnd).getTime() + durationDays * 24 * 60 * 60 * 1000);
        status = existing.status === "TRIAL" ? "TRIALING" : existing.status;
      }
    }

    const row = await db.queryOne<Subscription>(
      `INSERT INTO subscriptions (restaurant_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (restaurant_id) DO UPDATE SET
         status = $3,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()
       RETURNING id, restaurant_id AS "restaurantId", plan, status, 
                 current_period_start AS "currentPeriodStart", 
                 current_period_end AS "currentPeriodEnd", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [restaurantId, plan, status, startDate, endDate]
    );

    if (!row) {
      throw new Error(`Failed to extend subscription for restaurant ${restaurantId}`);
    }

    return row;
  },

  /**
   * Activates or extends a restaurant's annual subscription for durationDays (backward-compatible).
   */
  async activateOrExtend(
    restaurantId: string,
    durationDays = 365,
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription> {
    return this.extendPeriod(restaurantId, durationDays, dbOrTx);
  },

  /**
   * Grants or extends a free trial with flexible duration days and plan identifier.
   */
  async grantTrial(
    restaurantId: string,
    trialDays = 14,
    planId = "TRIAL_14_DAYS",
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription> {
    const db = dbOrTx || getDb();
    const existing = await this.findByRestaurantId(restaurantId, db);

    const now = new Date();
    let startDate = now;
    let endDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    // If already in active trial and not yet expired, extend from current end
    if (
      existing &&
      (existing.status === "TRIALING" || existing.status === "TRIAL") &&
      new Date(existing.currentPeriodEnd) > now
    ) {
      startDate = new Date(existing.currentPeriodStart);
      endDate = new Date(new Date(existing.currentPeriodEnd).getTime() + trialDays * 24 * 60 * 60 * 1000);
    }

    const row = await db.queryOne<Subscription>(
      `INSERT INTO subscriptions (restaurant_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, $2, 'TRIALING', $3, $4, NOW(), NOW())
       ON CONFLICT (restaurant_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         status = 'TRIALING',
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()
       RETURNING id, restaurant_id AS "restaurantId", plan, status, 
                 current_period_start AS "currentPeriodStart", 
                 current_period_end AS "currentPeriodEnd", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [restaurantId, planId, startDate, endDate]
    );

    if (!row) {
      throw new Error("Failed to grant trial subscription");
    }

    return row;
  },

  /**
   * Updates only the subscription status (e.g. SUSPENDED, ACTIVE, INACTIVE, EXPIRED).
   */
  async updateStatus(
    restaurantId: string,
    status: SubscriptionStatus,
    dbOrTx?: DatabaseAdapter
  ): Promise<Subscription> {
    const db = dbOrTx || getDb();
    const row = await db.queryOne<Subscription>(
      `UPDATE subscriptions
       SET status = $2, updated_at = NOW()
       WHERE restaurant_id = $1
       RETURNING id, restaurant_id AS "restaurantId", plan, status, 
                 current_period_start AS "currentPeriodStart", 
                 current_period_end AS "currentPeriodEnd", 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [restaurantId, status]
    );

    if (!row) {
      throw new Error(`Failed to update subscription status for restaurant ${restaurantId}`);
    }

    return row;
  },
};
