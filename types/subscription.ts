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
 * Decoupled from duration. Supports custom and standard plans.
 */
export type SubscriptionPlan =
  | "STANDARD"
  | "STANDARD_ANNUAL"
  | "ECONOMY"
  | "HIGH"
  | "PRO"
  | "MONTHLY"
  | "TRIAL"
  | "TRIAL_14_DAYS"
  | "FREE_TRIAL"
  | "CUSTOM"
  | (string & {});

/**
 * Server-authoritative plan definition.
 */
export interface PlanDefinition {
  id: string;
  name: string;
  price: number; // in DZD
  currency: string;
  defaultDurationDays: number;
  description: string;
  isTrial?: boolean;
  features?: string[];
}

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

