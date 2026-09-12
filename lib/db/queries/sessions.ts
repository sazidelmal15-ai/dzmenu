import "server-only";
import { getDb } from "../client";
import type { UserRole } from "@/types/auth";

export interface SessionWithUser {
  sessionId: string;
  userId: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: UserRole;
    isActive: boolean;
  };
}

/**
 * Database Session Queries
 */
export const sessionQueries = {
  /**
   * Persists a new hashed session in the database.
   */
  async create(
    sessionId: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent?: string | null,
    ipAddress?: string | null
  ): Promise<void> {
    const db = getDb();
    await db.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [sessionId, userId, tokenHash, expiresAt, userAgent || null, ipAddress || null]
    );
  },

  /**
   * Finds an active session and user by token SHA-256 hash.
   */
  async findByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    const db = getDb();
    const row = await db.queryOne<{
      sessionId: string;
      userId: string;
      expiresAt: Date;
      u_id: string;
      u_email: string;
      u_fullName: string | null;
      u_role: UserRole;
      u_isActive: boolean;
    }>(
      `SELECT s.id AS "sessionId", s.user_id AS "userId", s.expires_at AS "expiresAt",
              u.id AS "u_id", u.email AS "u_email", u.full_name AS "u_fullName", 
              u.role AS "u_role", u.is_active AS "u_isActive"
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 
         AND s.expires_at > NOW() 
         AND u.deleted_at IS NULL 
         AND u.is_active = TRUE`,
      [tokenHash]
    );

    if (!row) {
      return null;
    }

    return {
      sessionId: row.sessionId,
      userId: row.userId,
      expiresAt: row.expiresAt,
      user: {
        id: row.u_id,
        email: row.u_email,
        fullName: row.u_fullName,
        role: row.u_role,
        isActive: row.u_isActive,
      },
    };
  },

  /**
   * Deletes a session row by token hash (revocation/logout).
   */
  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const db = getDb();
    await db.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
  },

  /**
   * Deletes all sessions for a user (e.g., password reset / account suspension).
   */
  async deleteByUserId(userId: string): Promise<void> {
    const db = getDb();
    await db.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  },
};
