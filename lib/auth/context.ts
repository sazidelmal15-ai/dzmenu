import "server-only";
import { getVerifiedSession } from "./session";
import type { AuthSession, CurrentUser } from "@/types/auth";

/**
 * Retrieves the verified session for the current incoming server request.
 * Returns null if the request is unauthenticated or has an invalid/expired session.
 */
export async function getSession(): Promise<AuthSession | null> {
  return getVerifiedSession();
}

/**
 * Retrieves the authenticated user identity for the current incoming server request.
 * Returns null if the user is unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getVerifiedSession();
  if (!session || !session.user || !session.user.isActive) {
    return null;
  }
  return session.user;
}
