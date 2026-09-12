import "server-only";
import { env } from "@/lib/env";
import pg from "pg";

const { Pool } = pg;

/**
 * Replaceable Database Client Interface.
 * Shields application business logic from specific PostgreSQL drivers or ORM libraries.
 */
export interface DatabaseAdapter {
  query<T = unknown>(text: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null>;
  transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T>;
}

/**
 * Standard PostgreSQL Pooled Adapter.
 */
const globalForDb = globalThis as unknown as {
  __postgresPool?: pg.Pool;
  __activeDbAdapter?: DatabaseAdapter;
};

class PostgresDatabaseAdapter implements DatabaseAdapter {
  private getPool(): pg.Pool {
    if (!globalForDb.__postgresPool) {
      const isRemoteDb =
        env.DATABASE_URL.includes("supabase.com") ||
        env.DATABASE_URL.includes("sslmode=") ||
        process.env.NODE_ENV === "production";

      // Strip query parameters
      const cleanUrl = env.DATABASE_URL.replace(/[\?&]sslmode=[^&]+/g, "").replace(/\?$/, "");

      globalForDb.__postgresPool = new Pool({
        connectionString: cleanUrl,
        ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });

      globalForDb.__postgresPool.on("error", (err) => {
        if (process.env.NODE_ENV !== "test") {
          console.error("Unexpected database pool error:", err.message);
        }
      });
    }

    return globalForDb.__postgresPool;
  }

  async query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
    const maxRetries = 2;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pool = this.getPool();
        const result = await pool.query(text, params);
        return result.rows as T[];
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          msg.includes("Connection terminated") ||
          msg.includes("connection timeout") ||
          msg.includes("timeout exceeded") ||
          msg.includes("ECONNRESET") ||
          msg.includes("ETIMEDOUT") ||
          msg.includes("ENOTFOUND") ||
          msg.includes("getaddrinfo") ||
          msg.includes("ECONNREFUSED");

        if (isTransient && attempt < maxRetries) {
          console.warn(`[PostgresAdapter] Transient DB error (attempt ${attempt}/${maxRetries}), retrying...`, msg);
          // If connection dropped or DNS failed, reset pool to force fresh connection
          if (msg.includes("ENOTFOUND") || msg.includes("Connection terminated") || msg.includes("ECONNRESET")) {
            try {
              if (globalForDb.__postgresPool) {
                globalForDb.__postgresPool.end().catch(() => {});
                globalForDb.__postgresPool = undefined;
              }
            } catch {
              // ignore
            }
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  async queryOne<T = unknown>(
    text: string,
    params: unknown[] = []
  ): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async transaction<T>(
    callback: (adapter: DatabaseAdapter) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const txAdapter: DatabaseAdapter = {
        query: async <R = unknown>(text: string, params: unknown[] = []): Promise<R[]> => {
          const res = await client.query(text, params);
          return res.rows as R[];
        },
        queryOne: async <R = unknown>(
          text: string,
          params: unknown[] = []
        ): Promise<R | null> => {
          const rows = await txAdapter.query<R>(text, params);
          return rows.length > 0 ? rows[0] : null;
        },
        transaction: async () => {
          throw new Error("Nested transactions are not supported");
        },
      };

      const result = await callback(txAdapter);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

let activeDbAdapter: DatabaseAdapter = new PostgresDatabaseAdapter();

/**
 * Replace the active database adapter (e.g., during tests or mock setups)
 */
export function setDatabaseAdapter(adapter: DatabaseAdapter): void {
  activeDbAdapter = adapter;
}

/**
 * Access the active database adapter.
 */
export function getDb(): DatabaseAdapter {
  return activeDbAdapter;
}
