import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, themeQueries } from "@/lib/db/queries";
import { THEME_DEFINITIONS } from "@/lib/themes/definitions";
import ThemeEditorClient from "@/components/theme-editor/ThemeEditorClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Theme Editor | DZMenu",
  description: "Customize your restaurant digital menu theme with live desktop and mobile preview.",
};

interface ThemeEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ThemeEditorPage({ params }: ThemeEditorPageProps) {
  const { id } = await params;

  // 1. Strict Authentication Check
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?returnUrl=${encodeURIComponent(`/themes/${id}/editor`)}`);
  }

  // 2. Strict Multi-Tenant Theme and Restaurant Ownership Resolution
  // Directly resolves the specific restaurant that owns this theme among all restaurants the user belongs to
  const result = await themeQueries.findThemeForUser(id, user.id);

  if (!result) {
    // Check if the user has any restaurant at all to provide clear feedback
    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    if (!userRestaurants || userRestaurants.length === 0) {
      return (
        <div className="min-h-screen bg-[#0E1013] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#181B20] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={28} />
            </div>
            <h1 className="text-lg font-bold text-white">No Restaurant Found</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your user account is not associated with any active restaurant. Please create or join a restaurant first.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition"
            >
              <ArrowLeft size={14} />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }

    // User has restaurants, but does not own this specific theme
    return (
      <div className="min-h-screen bg-[#0E1013] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#181B20] border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
            <Lock size={30} />
          </div>
          <div className="space-y-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              Access Denied • غير مصرح بالوصول
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              لا يمكنك تعديل هذا التصميم. هذا الثيم غير موجود أو يتبع لمطعم آخر غير مسجل بحسابك الحالي.
            </p>
            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10 text-[11px] text-red-300/80 font-mono">
              Target ID: {id} • Security verification failed
            </div>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/themes"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-950 hover:bg-gray-200 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Back to Themes Library</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { theme, restaurant } = result;
  const isLive = restaurant.activeThemeId === theme.id;
  const definition = THEME_DEFINITIONS[theme.presetId] || THEME_DEFINITIONS.gourmet;

  return (
    <ThemeEditorClient
      theme={{ ...theme, isLive }}
      restaurant={restaurant}
      definition={definition}
    />
  );
}
