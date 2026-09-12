"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";
import type { AuthActionResult } from "@/lib/auth/actions";
import { ROUTES } from "@/constants/routes";

const initialState: AuthActionResult = {
  success: false,
};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="restaurantName"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
        >
          Restaurant Name / اسم المطعم
        </label>
        <input
          id="restaurantName"
          name="restaurantName"
          type="text"
          required
          disabled={isPending}
          placeholder="e.g. Le Gourmet Alger"
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        {state?.fieldErrors?.restaurantName && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.restaurantName[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
        >
          Your Full Name / الاسم الكامل
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          disabled={isPending}
          placeholder="e.g. Ahmed Benali"
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        {state?.fieldErrors?.fullName && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.fullName[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
        >
          Email Address / البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="owner@restaurant.dz"
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
        >
          Password / كلمة المرور (min 8 chars)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          placeholder="••••••••••••"
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating Account..." : "Create Restaurant Account"}
        </button>
      </div>

      <div className="text-center text-xs text-zinc-400 pt-2">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="font-semibold text-amber-400 hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
