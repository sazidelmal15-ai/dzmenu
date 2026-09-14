import type { PlanDefinition } from "@/types/subscription";

/**
 * Server-authoritative registry of subscription plans.
 * Client cannot override price, currency, or default durations.
 */
export const PLAN_REGISTRY: Record<string, PlanDefinition> = {
  // Primary Plan Identities
  STANDARD: {
    id: "STANDARD",
    name: "Standard Plan",
    price: 10000,
    currency: "DZD",
    defaultDurationDays: 365,
    description: "Full access to digital menu management and QR code generation.",
    features: ["Unlimited items", "QR codes", "All gourmet themes", "Multi-language support"],
  },
  ECONOMY: {
    id: "ECONOMY",
    name: "Economy Plan",
    price: 5000,
    currency: "DZD",
    defaultDurationDays: 180,
    description: "Essential menu management for small kiosks and cafes.",
    features: ["Up to 50 items", "Standard QR code", "Default theme"],
  },
  HIGH: {
    id: "HIGH",
    name: "High / Enterprise Plan",
    price: 25000,
    currency: "DZD",
    defaultDurationDays: 365,
    description: "Advanced branding, priority support, and multi-branch management.",
    features: ["Unlimited items", "Custom domain", "Multi-branch", "Priority 24/7 support"],
  },
  PRO: {
    id: "PRO",
    name: "Pro Plan",
    price: 15000,
    currency: "DZD",
    defaultDurationDays: 365,
    description: "Professional tier with analytics and enhanced branding.",
    features: ["Unlimited items", "Advanced analytics", "Custom themes"],
  },
  TRIAL: {
    id: "TRIAL",
    name: "Free Trial",
    price: 0,
    currency: "DZD",
    defaultDurationDays: 14,
    isTrial: true,
    description: "Full feature exploration period.",
    features: ["All Standard features for testing"],
  },

  // Backward-Compatibility Aliases (Map legacy duration-suffixed keys to base plans)
  STANDARD_ANNUAL: {
    id: "STANDARD",
    name: "Standard Plan (Annual)",
    price: 10000,
    currency: "DZD",
    defaultDurationDays: 365,
    description: "Full access to digital menu management and customizable templates.",
    features: ["Unlimited items", "QR codes", "All gourmet themes", "Multi-language support"],
  },
  TRIAL_14_DAYS: {
    id: "TRIAL",
    name: "Free Trial (14 Days)",
    price: 0,
    currency: "DZD",
    defaultDurationDays: 14,
    isTrial: true,
    description: "Full feature exploration period.",
    features: ["All Standard features for testing"],
  },
  MONTHLY: {
    id: "STANDARD",
    name: "Standard Plan (Monthly)",
    price: 1500,
    currency: "DZD",
    defaultDurationDays: 30,
    description: "Flexible month-to-month access.",
    features: ["Unlimited items", "Standard QR code"],
  },
};

/**
 * Backward compatibility alias for SUBSCRIPTION_PLANS.
 */
export const SUBSCRIPTION_PLANS = PLAN_REGISTRY;

export const DEFAULT_CURRENCY = "DZD";

/**
 * Resolves a plan definition by ID (case-insensitive).
 */
export function getPlanDefinition(planId: string): PlanDefinition | null {
  if (!planId) return null;
  const normalized = planId.trim().toUpperCase();
  return PLAN_REGISTRY[normalized] || null;
}

