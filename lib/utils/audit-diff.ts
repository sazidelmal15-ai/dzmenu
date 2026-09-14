import type { AdminAuditStateSnapshot, AuditDiffItem, AuditDiffSummary } from "@/types/audit";
import { getPlanDefinition } from "@/constants/subscriptions";

/**
 * Human-friendly field label mappings for state snapshots.
 */
const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  restaurantStatus: "Restaurant Status",
  subscriptionStatus: "Subscription Status",
  subscriptionPlan: "Subscription Plan",
  plan: "Plan",
  currentPeriodStart: "Period Started",
  currentPeriodEnd: "Period Expires",
  periodStart: "Period Started",
  periodEnd: "Period Expires",
  subscriptionExpiresAt: "Expires At",
  price: "Price",
  currency: "Currency",
  isTrial: "Trial Status",
  trialDays: "Trial Duration",
  durationDays: "Extension Duration",
  name: "Restaurant Name",
  slug: "Restaurant Slug",
  isSubdomainLocked: "Subdomain Locked",
};

/**
 * Formats a raw snapshot value into a clean human-readable representation.
 */
export function formatSnapshotValue(field: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  // Handle Dates / Date strings
  if (
    field.toLowerCase().includes("date") ||
    field.toLowerCase().includes("end") ||
    field.toLowerCase().includes("start") ||
    field.toLowerCase().includes("at")
  ) {
    if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch {
        // Fallback to string
      }
    }
  }

  // Handle Plans
  if (field === "subscriptionPlan" || field === "plan") {
    if (typeof value === "string") {
      const def = getPlanDefinition(value);
      if (def) return def.name;
      const clean = value.replace(/_/g, " ").toLowerCase();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }

  // Handle Booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle Prices / Numbers
  if (field === "price" && typeof value === "number") {
    return `${value.toLocaleString()} DZD`;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }

  return String(value);
}

/**
 * Performs a deep equality comparison between two snapshot values.
 */
function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;

  // Compare dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (typeof a === "string" && typeof b === "string") {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    if (!isNaN(da) && !isNaN(db) && a.includes("T") && b.includes("T")) {
      return da === db;
    }
    return a === b;
  }

  // Compare objects
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
}

/**
 * Computes a structured, human-readable state difference between previousState and newState.
 * Returns only meaningful differences (ignores identical keys).
 */
export function computeStateDiff(
  previousState: AdminAuditStateSnapshot | null,
  newState: AdminAuditStateSnapshot | null
): AuditDiffSummary {
  const items: AuditDiffItem[] = [];

  const prev = previousState || {};
  const next = newState || {};

  const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));

  for (const key of allKeys) {
    const prevVal = prev[key];
    const nextVal = next[key];

    // Skip if values are identical
    if (areValuesEqual(prevVal, nextVal)) {
      continue;
    }

    const label = FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

    if (prevVal === undefined || prevVal === null) {
      items.push({
        field: key,
        label,
        changeType: "ADDED",
        previousValue: null,
        newValue: nextVal,
        formattedPrevious: "—",
        formattedNew: formatSnapshotValue(key, nextVal),
      });
    } else if (nextVal === undefined || nextVal === null) {
      items.push({
        field: key,
        label,
        changeType: "REMOVED",
        previousValue: prevVal,
        newValue: null,
        formattedPrevious: formatSnapshotValue(key, prevVal),
        formattedNew: "—",
      });
    } else {
      items.push({
        field: key,
        label,
        changeType: "MODIFIED",
        previousValue: prevVal,
        newValue: nextVal,
        formattedPrevious: formatSnapshotValue(key, prevVal),
        formattedNew: formatSnapshotValue(key, nextVal),
      });
    }
  }

  return {
    items,
    hasChanges: items.length > 0,
  };
}
