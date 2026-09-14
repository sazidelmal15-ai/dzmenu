/**
 * Sensitive key patterns to match for automatic redaction (case-insensitive substring/regex matches).
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /pass_?hash/i,
  /secret/i,
  /token/i,
  /api_?key/i,
  /auth(orization)?/i,
  /private_?key/i,
  /credential/i,
  /hash/i,
  /cookie/i,
  /session_?id/i,
];

const MAX_DEPTH = 5;
const MAX_ARRAY_LENGTH = 50;
const MAX_OBJECT_KEYS = 50;
const MAX_STRING_LENGTH = 500;
const REDACTED_PLACEHOLDER = "[REDACTED]";

/**
 * Checks if a property key name represents sensitive information.
 */
export function isSensitiveKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key) || pattern.test(normalizedKey));
}

/**
 * Recursively sanitizes and redacts metadata objects before browser exposure.
 * Enforces depth limits, length limits, key allowlisting/redaction, and circular reference safety.
 */
export function redactSensitiveMetadata<T>(
  data: T,
  depth = 0,
  seen = new WeakSet<object>()
): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Primitive types
  if (typeof data === "string") {
    if (data.length > MAX_STRING_LENGTH) {
      return (data.slice(0, MAX_STRING_LENGTH) + "… [truncated]") as unknown as T;
    }
    return data;
  }

  if (typeof data === "number" || typeof data === "boolean" || typeof data === "bigint") {
    return data;
  }

  if (typeof data === "function" || typeof data === "symbol") {
    return undefined as unknown as T;
  }

  // Depth limit protection
  if (depth > MAX_DEPTH) {
    return "[Nested Data Truncated]" as unknown as T;
  }

  // Handle Dates
  if (data instanceof Date) {
    return data;
  }

  // Handle circular references
  if (typeof data === "object") {
    if (seen.has(data as object)) {
      return "[Circular Reference]" as unknown as T;
    }
    seen.add(data as object);
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    const limitedArray = data.slice(0, MAX_ARRAY_LENGTH);
    const sanitized = limitedArray.map((item) =>
      redactSensitiveMetadata(item, depth + 1, seen)
    );
    if (data.length > MAX_ARRAY_LENGTH) {
      sanitized.push(`… [${data.length - MAX_ARRAY_LENGTH} more items truncated]` as unknown as T);
    }
    return sanitized as unknown as T;
  }

  // Handle Objects
  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    const entries = Object.entries(data);
    const limitedEntries = entries.slice(0, MAX_OBJECT_KEYS);

    for (const [key, value] of limitedEntries) {
      if (isSensitiveKey(key)) {
        result[key] = REDACTED_PLACEHOLDER;
      } else {
        result[key] = redactSensitiveMetadata(value, depth + 1, seen);
      }
    }

    if (entries.length > MAX_OBJECT_KEYS) {
      result["_truncated"] = `[${entries.length - MAX_OBJECT_KEYS} more properties truncated]`;
    }

    return result as unknown as T;
  }

  return data;
}
