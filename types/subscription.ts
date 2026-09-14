export type SubscriptionStatus =
  | "TRIALING"
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED"
  | "INACTIVE"
  | "SUSPENDED";

/**
 * Subscription plan identifier.
 */
export type SubscriptionPlan = "STANDARD_ANNUAL" | "TRIAL_14_DAYS" | "FREE_TRIAL" | "CUSTOM";

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
