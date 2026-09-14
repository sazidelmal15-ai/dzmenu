import type { AdminAuditAction } from "@/types/audit";

export interface AuditActionDefinition {
  action: AdminAuditAction;
  label: string;
  description: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
}

/**
 * Canonical registry of administrative actions.
 * Sourced exclusively from existing codebase definitions.
 */
export const AUDIT_ACTION_REGISTRY: Record<AdminAuditAction, AuditActionDefinition> = {
  ACTIVATE_PLAN: {
    action: "ACTIVATE_PLAN",
    label: "Plan Activated",
    description: "Subscription plan activated with server-authoritative pricing and terms.",
    badgeStyle: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
  },
  EXTEND_SUBSCRIPTION: {
    action: "EXTEND_SUBSCRIPTION",
    label: "Subscription Extended",
    description: "Tenant subscription period extended by administrative grant.",
    badgeStyle: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    },
  },
  GRANT_TRIAL: {
    action: "GRANT_TRIAL",
    label: "Free Trial Granted",
    description: "Temporary trial period granted to restaurant tenant.",
    badgeStyle: {
      bg: "bg-indigo-50",
      text: "text-indigo-800",
      border: "border-indigo-200",
    },
  },
  SUSPEND_RESTAURANT: {
    action: "SUSPEND_RESTAURANT",
    label: "Restaurant Suspended",
    description: "Tenant operations frozen and access blocked for policy or payment reason.",
    badgeStyle: {
      bg: "bg-rose-50",
      text: "text-rose-800",
      border: "border-rose-200",
    },
  },
  REACTIVATE_RESTAURANT: {
    action: "REACTIVATE_RESTAURANT",
    label: "Restaurant Reactivated",
    description: "Suspended tenant reinstated to operational status.",
    badgeStyle: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    },
  },
  ACTIVATE_ANNUAL: {
    action: "ACTIVATE_ANNUAL",
    label: "Annual Plan Activated",
    description: "Annual subscription activated (legacy standard action).",
    badgeStyle: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
  },
  EXTEND_ANNUAL: {
    action: "EXTEND_ANNUAL",
    label: "Annual Subscription Extended",
    description: "Annual subscription extended by 365 days (legacy standard action).",
    badgeStyle: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    },
  },
  CHANGE_PLAN: {
    action: "CHANGE_PLAN",
    label: "Plan Changed",
    description: "Tenant subscription tier changed to a different plan.",
    badgeStyle: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
    },
  },
  MANUAL_OVERRIDE: {
    action: "MANUAL_OVERRIDE",
    label: "Manual Override",
    description: "Direct administrative override of subscription or tenant properties.",
    badgeStyle: {
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-200",
    },
  },
};

/**
 * Resolves a human-readable action label from machine identifier.
 */
export function getAuditActionLabel(action: string): string {
  const def = AUDIT_ACTION_REGISTRY[action as AdminAuditAction];
  if (def) return def.label;
  const clean = action.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Resolves badge style classes for an action.
 */
export function getAuditActionBadgeStyle(action: string): { bg: string; text: string; border: string } {
  const def = AUDIT_ACTION_REGISTRY[action as AdminAuditAction];
  if (def) return def.badgeStyle;
  return {
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-200",
  };
}

/**
 * Returns all registered action items for filter dropdowns.
 */
export function getAllAuditActionDefinitions(): AuditActionDefinition[] {
  return Object.values(AUDIT_ACTION_REGISTRY);
}
