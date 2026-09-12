import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import { isPlatformAdminRole } from "@/constants/roles";
import { restaurantQueries } from "@/lib/db/queries";
import { activateSubscriptionAction, logoutAction } from "@/lib/auth/actions";
import { ROUTES } from "@/constants/routes";
import {
  Building2,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform Administration",
  description: "DZMenu platform owner administration dashboard.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  if (!isPlatformAdminRole(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-zinc-100">
        <div className="max-w-md rounded-2xl border border-red-900/30 bg-zinc-900/80 p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-red-400">Access Denied / غير مصرح</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You do not have platform administrator privileges to access this area.
          </p>
        </div>
      </main>
    );
  }

  // Fetch all registered restaurants for admin management
  const restaurants = await restaurantQueries.getAllForAdmin();
  const now = Date.now();

  const totalCount = restaurants.length;
  const activeCount = restaurants.filter(
    (r) =>
      (r.subscriptionStatus === "ACTIVE" || r.subscriptionStatus === "TRIALING") &&
      r.subscriptionExpiresAt &&
      new Date(r.subscriptionExpiresAt).getTime() > now
  ).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <main className="min-h-screen bg-zinc-950 p-4 sm:p-8 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Owner Administration</h1>
              <p className="mt-0.5 text-xs text-zinc-400">
                Logged in as: <span className="font-semibold text-amber-400">{user.email}</span> ({user.role})
              </p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Overview Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Restaurants</span>
              <Building2 className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{totalCount}</div>
            <p className="text-[11px] text-zinc-500">All registered tenant restaurants</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{activeCount}</div>
            <p className="text-[11px] text-emerald-500/80">Paid & active digital menus</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending / Inactive</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400">{inactiveCount}</div>
            <p className="text-[11px] text-amber-500/80">Awaiting payment or expired</p>
          </div>
        </div>

        {/* Restaurant Subscriptions Management Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">إدارة اشتراكات المطاعم (Restaurant Subscriptions)</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                تفعيل وتمديد الاشتراكات السنوية بضغطة زر واحدة بعد تأكيد الدفع
              </p>
            </div>
          </div>

          {restaurants.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No restaurants registered yet. When a restaurant signs up, it will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="border-b border-zinc-800/80 bg-zinc-950/60 text-xs uppercase text-zinc-400 font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Restaurant / المطعم</th>
                    <th className="px-6 py-3.5">Owner / المالك</th>
                    <th className="px-6 py-3.5">Status / الحالة</th>
                    <th className="px-6 py-3.5">Expires At / الانتهاء</th>
                    <th className="px-6 py-3.5 text-right">Action / الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {restaurants.map((r) => {
                    const isActive =
                      (r.subscriptionStatus === "ACTIVE" || r.subscriptionStatus === "TRIALING") &&
                      r.subscriptionExpiresAt &&
                      new Date(r.subscriptionExpiresAt).getTime() > now;

                    return (
                      <tr key={r.id} className="hover:bg-zinc-800/20 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{r.name}</div>
                          <div className="text-xs font-mono text-amber-400/80">/{r.slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-zinc-200">{r.ownerName || "—"}</div>
                          <div className="text-xs text-zinc-500">{r.ownerEmail || "—"}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Active (مفعل)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                              <Lock className="h-3 w-3" />
                              Inactive (مقفل)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {r.subscriptionExpiresAt
                            ? new Date(r.subscriptionExpiresAt).toLocaleDateString("en-GB")
                            : "Not Activated"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={activateSubscriptionAction}>
                            <input type="hidden" name="restaurantId" value={r.id} />
                            <button
                              type="submit"
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                isActive
                                  ? "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                                  : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <RefreshCw className="h-3 w-3" />
                                  تمديد (+1 سنة)
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  تفعيل الاشتراك (1 سنة)
                                </>
                              )}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
