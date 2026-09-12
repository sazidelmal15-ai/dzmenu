import type { ApiErrorResponse } from "@/types/api";

/**
 * Base Application Error class with HTTP status code and machine-readable error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Formats any error safely for API responses without leaking internal details or stack traces.
 */
export function formatErrorResponse(error: unknown): {
  status: number;
  body: ApiErrorResponse;
} {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
    };
  }

  // Generic/Unknown error: never expose internal stack trace or raw SQL in production
  const isDev = process.env.NODE_ENV === "development";
  const errorMessage =
    isDev && error instanceof Error
      ? error.message
      : "An unexpected error occurred. Please try again later.";

  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: errorMessage,
      },
    },
  };
}
