import { AppError } from "@/lib/utils/errors";

/**
 * 401 Unauthorized: Thrown when request lacks valid authentication credentials.
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required. Please log in.") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden: Thrown when authenticated user lacks required platform/role permissions.
 */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource.") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * 403 Tenant Access Denied: Thrown when user attempts cross-restaurant access.
 */
export class TenantAccessDeniedError extends AppError {
  public readonly requestedRestaurantId: string;

  constructor(
    restaurantId: string,
    message = "You do not have access to this restaurant's resources."
  ) {
    super(message, 403, "TENANT_ACCESS_DENIED", { restaurantId });
    this.name = "TenantAccessDeniedError";
    this.requestedRestaurantId = restaurantId;
  }
}

/**
 * 404 Not Found: Thrown when a requested resource does not exist.
 */
export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * 402 Payment Required: Thrown when an active subscription is required to perform write operations.
 */
export class SubscriptionRequiredError extends AppError {
  public readonly restaurantId: string;

  constructor(
    restaurantId: string,
    message = "An active subscription is required to perform this action. Please renew or activate your subscription."
  ) {
    super(message, 402, "SUBSCRIPTION_REQUIRED", { restaurantId });
    this.name = "SubscriptionRequiredError";
    this.restaurantId = restaurantId;
  }
}

/**
 * 402 Subscription Expired: Thrown when the restaurant's subscription has expired or is inactive.
 */
export class SubscriptionExpiredError extends AppError {
  public readonly restaurantId: string;

  constructor(
    restaurantId: string,
    message = "Your subscription has expired or is currently inactive. Menu modifications are locked."
  ) {
    super(message, 402, "SUBSCRIPTION_EXPIRED", { restaurantId });
    this.name = "SubscriptionExpiredError";
    this.restaurantId = restaurantId;
  }
}
