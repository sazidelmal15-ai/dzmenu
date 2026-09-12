import "server-only";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { COOKIES, SESSION_COOKIE_OPTIONS } from "@/constants/cookies";
import { sessionQueries, userQueries } from "@/lib/db/queries";
import type { AuthSession } from "@/types/auth";

/**
 * Hash a plain session token with SHA-256 for secure database lookup.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Creates and persists a new authenticated session in PostgreSQL.
 * Sets an HTTP-only, secure, SameSite=Lax cookie on the client response.
 */
export async function createSession(
  userId: string
): Promise<{ token: string; session: AuthSession }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const expiresAt = new Date(now + 1000 * 60 * 60 * 24 * 7); // 7 days from now
  const sessionId = `sess_${now}_${crypto.randomBytes(8).toString("hex")}`;

  // Read client request telemetry if available
  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent") || null;
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  // Persist hashed session in the database
  await sessionQueries.create(
    sessionId,
    userId,
    tokenHash,
    expiresAt,
    userAgent,
    ipAddress
  );

  // Fetch sanitized user identity and restaurant memberships
  const user = await userQueries.findById(userId);
  if (!user) {
    throw new Error("Cannot create session for non-existent or inactive user");
  }

  const restaurants = await userQueries.findUserMemberships(userId);

  const authSession: AuthSession = {
    sessionId,
    userId,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      restaurants,
      isActive: user.isActive,
    },
    createdAt: now,
    expiresAt: expiresAt.getTime(),
  };

  // Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIES.SESSION_TOKEN,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { token, session: authSession };
}

/**
 * Verifies a plain session token from the cookie against the database.
 */
export async function verifySessionToken(
  token: string
): Promise<AuthSession | null> {
  if (!token || typeof token !== "string" || token.length < 32) {
    return null;
  }

  try {
    const tokenHash = hashSessionToken(token);
    const result = await sessionQueries.findByTokenHash(tokenHash);

    if (!result) {
      return null;
    }

    // Retrieve active restaurant memberships for the user
    const restaurants = await userQueries.findUserMemberships(result.userId);

    return {
      sessionId: result.sessionId,
      userId: result.userId,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        restaurants,
        isActive: result.user.isActive,
      },
      createdAt: result.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 7,
      expiresAt: result.expiresAt.getTime(),
    };
  } catch (err) {
    // If DB is unreachable or query fails, fail securely by returning null
    if (process.env.NODE_ENV !== "test") {
      console.error("Session verification error:", err);
    }
    return null;
  }
}

/**
 * Destroys the current authenticated session:
 * Deletes the session row from PostgreSQL and removes the session cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIES.SESSION_TOKEN);

  if (sessionCookie?.value) {
    try {
      const tokenHash = hashSessionToken(sessionCookie.value);
      await sessionQueries.deleteByTokenHash(tokenHash);
    } catch {
      // Ignore cleanup error if DB is unreachable
    }
  }

  // Delete cookie from client
  cookieStore.delete(COOKIES.SESSION_TOKEN);
}

/**
 * Extracts and verifies the current session from incoming request cookies.
 */
export async function getVerifiedSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIES.SESSION_TOKEN);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}
