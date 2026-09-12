import type { Metadata } from "next";
import { BarChart2, TrendingUp, Users, Eye, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics | DZMenu",
  description: "View visitor traffic, popular dishes, and menu performance metrics.",
};

export default function AnalyticsPage() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <BarChart2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Analytics &amp; Insights
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                Live Stats
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Monitor QR code scans, menu visits, customer engagement, and top-selling dishes
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Empty Shell / Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total QR Scans", value: "0", change: "+0% this week", icon: Eye },
          { label: "Unique Visitors", value: "0", change: "+0% this week", icon: Users },
          { label: "Most Viewed Category", value: "—", change: "Awaiting data", icon: TrendingUp },
          { label: "Top Trending Dish", value: "—", change: "Awaiting data", icon: Sparkles },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-white rounded-2xl border border-[#F3F0E6] shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">{card.label}</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-gray-900">{card.value}</span>
                <p className="text-[11px] text-gray-400 mt-1">{card.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
          <BarChart2 size={32} />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          Analytics Dashboard
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md leading-relaxed">
          Real-time charts, table scan heatmaps, peak dining hours, and dish popularity graphs will appear here once customers scan your QR codes.
        </p>
      </div>
    </div>
  );
}
