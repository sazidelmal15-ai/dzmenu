import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries } from "@/lib/db/queries";
import { ROUTES } from "@/constants/routes";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default async function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const userRestaurants = await restaurantQueries.findByUserId(user.id);
  const restaurant = userRestaurants[0] || null;

  return (
    <div className="flex min-h-screen bg-[#FAF9F5]">
      {/* Persistent Sidebar */}
      <Sidebar restaurant={restaurant} user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} restaurant={restaurant} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
