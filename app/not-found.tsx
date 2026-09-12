import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white">404 — Page Not Found</h2>
        <p className="text-sm text-slate-400">
          The page or restaurant menu you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link
            href={ROUTES.HOME}
            className="inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
