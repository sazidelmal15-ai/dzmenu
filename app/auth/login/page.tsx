import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import { isPlatformAdminRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your DZMenu platform account.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  // If already authenticated, redirect to appropriate area
  if (user) {
    if (isPlatformAdminRole(user.role)) {
      redirect(ROUTES.ADMIN);
    } else {
      redirect(ROUTES.DASHBOARD);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <Link href={ROUTES.HOME} className="text-xl font-bold tracking-tight text-white">
            DZ<span className="text-amber-400">Menu</span>
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-white">Sign In</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Enter your email and password to access your account
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center text-xs text-zinc-400 space-y-2 border-t border-zinc-800/80 pt-4">
          <p>
            Don&apos;t have a restaurant account?{" "}
            <Link href={ROUTES.REGISTER} className="font-semibold text-amber-400 hover:underline">
              Create Account
            </Link>
          </p>
          <p className="text-zinc-500">
            Initial platform admin: <span className="font-mono text-zinc-400">admin@dzmenu.local</span>
          </p>
        </div>
      </div>
    </main>
  );
}
