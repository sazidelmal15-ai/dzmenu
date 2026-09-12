/**
 * DZMenu Theme System V2 — Declarative Condition Evaluation Engine
 *
 * Evaluates 100% JSON-serializable conditional expressions for dynamic editor controls.
 * No JavaScript closures or eval() used.
 */

import type {
  VisibilityCondition,
  ConditionRule,
  ConditionGroup,
} from "@/types/theme-contract";

/**
 * Safely traverses a dot-notated path in an object (e.g. "layout.show_header_banner").
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (!path) return obj;

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluates a single comparison rule against target values.
 */
function evaluateRule(rule: ConditionRule, settings: Record<string, unknown>): boolean {
  const actualValue = getNestedValue(settings, rule.field);

  switch (rule.operator) {
    case "equals":
      return actualValue === rule.value;

    case "not_equals":
      return actualValue !== rule.value;

    case "in":
      if (!Array.isArray(rule.value)) return false;
      return rule.value.includes(actualValue as never);

    case "not_in":
      if (!Array.isArray(rule.value)) return true;
      return !rule.value.includes(actualValue as never);

    case "contains":
      if (typeof actualValue === "string" && typeof rule.value === "string") {
        return actualValue.includes(rule.value);
      }
      if (Array.isArray(actualValue)) {
        return actualValue.includes(rule.value);
      }
      return false;

    case "truthy":
      return Boolean(actualValue);

    case "falsy":
      return !Boolean(actualValue);

    case "greater_than":
      if (typeof actualValue === "number" && typeof rule.value === "number") {
        return actualValue > rule.value;
      }
      return false;

    case "less_than":
      if (typeof actualValue === "number" && typeof rule.value === "number") {
        return actualValue < rule.value;
      }
      return false;

    default:
      return true;
  }
}

/**
 * Pure recursive evaluator for visibility conditions.
 * Supports single rules and nested AND/OR groups.
 */
export function evaluateCondition(
  condition: VisibilityCondition | undefined,
  settings: Record<string, unknown>
): boolean {
  if (!condition) return true;

  // ConditionGroup evaluation (AND / OR)
  if ("match" in condition && Array.isArray((condition as ConditionGroup).rules)) {
    const group = condition as ConditionGroup;
    if (group.match === "all") {
      return group.rules.every((child) => evaluateCondition(child, settings));
    }
    return group.rules.some((child) => evaluateCondition(child, settings));
  }

  // Single rule evaluation
  if ("field" in condition && "operator" in condition) {
    return evaluateRule(condition as ConditionRule, settings);
  }

  return true;
}
