/**
 * Cookie Names and Security Configuration
 */
export const COOKIES = {
  SESSION_TOKEN: "dzmenu_session",
} as const;

/**
 * Standard secure cookie options for session management
 */
export const SESSION_COOKIE_OPTIONS = {
  name: COOKIES.SESSION_TOKEN,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
};
