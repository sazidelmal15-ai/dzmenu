"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { restaurantQueries, subscriptionQueries, userQueries, themeQueries } from "@/lib/db/queries";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession } from "./session";
import { requireRole } from "@/lib/permissions/guards";
import { PLATFORM_ADMIN_ROLES, isPlatformAdminRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export type LoginActionResult = AuthActionResult;

/**
 * Generate a URL-friendly slug from a restaurant name.
 */
function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `restaurant-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Server action to handle restaurant owner self-serve registration.
 */
export async function registerAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawFullName = formData.get("fullName");
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawRestaurantName = formData.get("restaurantName");

  const validation = registerSchema.safeParse({
    fullName: rawFullName,
    email: rawEmail,
    password: rawPassword,
    restaurantName: rawRestaurantName,
  });

  if (!validation.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, password, restaurantName } = validation.data;

  let shouldRedirect = false;

  try {
    // 1. Check if user with this email already exists
    const existingUser = await userQueries.findByEmailWithPassword(email);
    if (existingUser) {
      return {
        success: false,
        error: "An account with this email address already exists. Please sign in.",
      };
    }

    // 2. Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);

    // 3. Create user record
    const user = await userQueries.create(
      email,
      passwordHash,
      fullName,
      "RESTAURANT_OWNER"
    );

    // 4. Generate unique slug and create restaurant record
    let slug = generateSlug(restaurantName);
    const existingRestaurant = await restaurantQueries.findBySlug(slug);
    if (existingRestaurant) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const restaurant = await restaurantQueries.create(restaurantName, slug);

    // 5. Attach user as RESTAURANT_OWNER of the new restaurant
    await restaurantQueries.addMember(user.id, restaurant.id, "RESTAURANT_OWNER");

    // 6. Initialize inactive subscription (requiring admin activation/payment)
    await subscriptionQueries.create(
      restaurant.id,
      "STANDARD_ANNUAL",
      "INACTIVE",
      new Date(Date.now() - 1000)
    );

    // 7. Initialize default active theme for the restaurant
    const defaultTheme = await themeQueries.createFromPreset(restaurant.id, "gourmet");
    await themeQueries.publishAtomic(defaultTheme.id, restaurant.id);

    // 8. Establish authenticated session
    await createSession(user.id);

    shouldRedirect = true;
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Registration error:", error);
    }

    return {
      success: false,
      error: "An error occurred while creating your account. Please try again.",
    };
  }

  if (shouldRedirect) {
    redirect(ROUTES.DASHBOARD);
  }

  return { success: true };
}

/**
 * Server action to handle login form submission.
 */
export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      success: false,
      error: "Please provide a valid email and password.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  let redirectDestination: string | null = null;

  try {
    const user = await userQueries.findByEmailWithPassword(email);

    if (!user || !user.isActive) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    await createSession(user.id);

    redirectDestination = isPlatformAdminRole(user.role)
      ? ROUTES.ADMIN
      : ROUTES.DASHBOARD;
  } catch (error) {
    console.error("Login error details:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: process.env.NODE_ENV === "development"
        ? `Error: ${errorMsg}`
        : "An unexpected error occurred during sign in. Please try again.",
    };
  }

  if (redirectDestination) {
    redirect(redirectDestination);
  }

  return { success: true };
}

/**
 * Server action to log out current user.
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect(ROUTES.LOGIN);
}

/**
 * Admin action to activate or extend a restaurant's annual subscription (backward-compatible).
 * Defense-in-depth: explicit role guard at action entry point + lifecycle service internal guard.
 */
export async function activateSubscriptionAction(formData: FormData): Promise<void> {
  await requireRole(PLATFORM_ADMIN_ROLES);

  const restaurantId = formData.get("restaurantId") as string;
  if (restaurantId) {
    const { adminLifecycleService } = await import("@/lib/admin/lifecycle-service");
    await adminLifecycleService.extendAnnual(restaurantId, { durationDays: 365 });
    revalidatePath(ROUTES.ADMIN);
  }
}
