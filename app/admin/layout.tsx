import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import { isPlatformAdminRole } from "@/constants/roles";
import { restaurantQueries, auditLogQueries } from "@/lib/db/queries";
import { ROUTES } from "@/constants/routes";
import { MissionControlShell, ErrorState } from "@/components/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mission Control — DZMenu Platform Administration",
  description: "Operational mission control and tenant lifecycle management for DZMenu.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Strict Server-Side Authorization Barrier
  if (!isPlatformAdminRole(user.role)) {
    return (
      <main className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6">
        <ErrorState
          isAccessDenied
          title="Access Denied / غير مصرح"
          message="You do not have platform administrator privileges to access DZMenu Mission Control."
          action={
            <Link
              href={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition shadow-xs"
            >
              Back to Restaurant Dashboard
            </Link>
          }
        />
      </main>
    );
  }

  // Fetch live aggregated operational KPIs and audit count for header/nav shell
  const [stats, auditCount] = await Promise.all([
    restaurantQueries.getPlatformKpiStats(),
    auditLogQueries.count(),
  ]);

  return (
    <MissionControlShell user={user} stats={stats} auditCount={auditCount}>
      {children}
    </MissionControlShell>
  );
}
