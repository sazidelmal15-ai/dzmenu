/**
 * Lightweight in-memory sliding-window rate limiter.
 * Designed for Next.js API routes (e.g. analytics tracking beacons).
 * Automatically cleans up expired timestamps to prevent memory leaks.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL_MS = 60_000; // Run garbage collection every 60s
let lastCleanup = Date.now();

function cleanupExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const threshold = now - windowMs;
  for (const [key, record] of store.entries()) {
    const valid = record.timestamps.filter((t) => t > threshold);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitOptions {
  limit: number; // Maximum requests allowed within window
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Checks if a key (e.g. client IP or composite identifier) exceeds the allowed rate limit.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpired(options.windowMs);

  const threshold = now - options.windowMs;
  const record = store.get(key) || { timestamps: [] };

  // Filter timestamps within current window
  const validTimestamps = record.timestamps.filter((t) => t > threshold);

  if (validTimestamps.length >= options.limit) {
    const oldest = validTimestamps[0] || now;
    const resetMs = Math.max(0, oldest + options.windowMs - now);

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetMs,
    };
  }

  // Record this request
  validTimestamps.push(now);
  store.set(key, { timestamps: validTimestamps });

  return {
    success: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - validTimestamps.length),
    resetMs: options.windowMs,
  };
}

/**
 * Helper to reset rate limits (primarily for automated testing).
 */
export function resetRateLimitStore(): void {
  store.clear();
}
