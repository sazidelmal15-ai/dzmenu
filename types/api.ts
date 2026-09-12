/**
 * Standardized success response structure for API endpoints.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standardized error response structure for API endpoints.
 * Never exposes raw SQL queries, internal paths, or stack traces to clients.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Unified API response envelope.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
