import React from "react";

interface KpiCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  indicatorColor?: "emerald" | "amber" | "rose" | "zinc" | "blue";
  icon?: React.ReactNode;
}

export function KpiCard({
  label,
  value,
  subtext,
  indicatorColor = "zinc",
  icon,
}: KpiCardProps) {
  const dotColorClasses = {
    emerald: "bg-emerald-500 ring-4 ring-emerald-50",
    amber: "bg-amber-500 ring-4 ring-amber-50",
    rose: "bg-rose-500 ring-4 ring-rose-50",
    zinc: "bg-zinc-400 ring-4 ring-zinc-50",
    blue: "bg-blue-500 ring-4 ring-blue-50",
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 tracking-tight">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {icon && <span className="text-zinc-400">{icon}</span>}
          <span
            className={`h-2 w-2 rounded-full ${dotColorClasses[indicatorColor]}`}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
          {value}
        </span>
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-zinc-500 font-normal leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}
