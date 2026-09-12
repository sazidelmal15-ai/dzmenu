import type { SubscriptionPlan } from "@/types/subscription";

/**
 * Subscription Pricing and Plan Constraints
 */
export const SUBSCRIPTION_PLANS = {
  STANDARD_ANNUAL: {
    id: "STANDARD_ANNUAL" as SubscriptionPlan,
    name: "Standard Annual Plan",
    price: 10000,
    currency: "DZD",
    billingPeriodDays: 365,
    description: "Full access to digital menu management and customizable templates.",
  },
} as const;

export const DEFAULT_CURRENCY = "DZD";
