/**
 * Subscription status enum.
 */
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED"
  | "INACTIVE";

/**
 * Subscription plan identifier.
 */
export type SubscriptionPlan = "STANDARD_ANNUAL";

/**
 * Subscription model attached to a restaurant tenant.
 */
export interface Subscription {
  id: string;
  restaurantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}
