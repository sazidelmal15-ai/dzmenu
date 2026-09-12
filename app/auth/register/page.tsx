import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import { isPlatformAdminRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Register Restaurant",
  description: "Create your restaurant account on DZMenu.",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    if (isPlatformAdminRole(user.role)) {
      redirect(ROUTES.ADMIN);
    } else {
      redirect(ROUTES.DASHBOARD);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <Link href={ROUTES.HOME} className="text-xl font-bold tracking-tight text-white">
            DZ<span className="text-amber-400">Menu</span>
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-white">Create Restaurant Account</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Sign up to get your digital menu and dynamic QR codes
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
