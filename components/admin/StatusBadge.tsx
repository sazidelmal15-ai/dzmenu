import React from "react";
import type { SubscriptionStatus } from "@/types/subscription";
import type { RestaurantStatus } from "@/types/restaurant";

export type AdminDisplayStatus = SubscriptionStatus | RestaurantStatus | "ALL";

interface StatusBadgeProps {
  status: AdminDisplayStatus | string | null | undefined;
  size?: "sm" | "md";
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  size = "md",
  className = "",
  showDot = true,
}: StatusBadgeProps) {
  const normalized = (status || "INACTIVE").toUpperCase();

  let dotColor = "bg-zinc-400";
  let badgeStyle = "bg-zinc-100 text-zinc-700 border-zinc-200/80";
  let label = "Inactive";

  switch (normalized) {
    case "ACTIVE":
      dotColor = "bg-emerald-500";
      badgeStyle = "bg-emerald-50/90 text-emerald-800 border-emerald-200/80";
      label = "Active";
      break;

    case "TRIAL":
    case "TRIALING":
      dotColor = "bg-amber-500";
      badgeStyle = "bg-amber-50/90 text-amber-800 border-amber-200/80";
      label = "Trial";
      break;

    case "SUSPENDED":
      dotColor = "bg-rose-500";
      badgeStyle = "bg-rose-50/90 text-rose-800 border-rose-200/80";
      label = "Suspended";
      break;

    case "EXPIRED":
    case "PAST_DUE":
    case "CANCELED":
      dotColor = "bg-zinc-400";
      badgeStyle = "bg-zinc-100 text-zinc-600 border-zinc-200/80";
      label = "Expired";
      break;

    case "INACTIVE":
    case "ARCHIVED":
    default:
      dotColor = "bg-zinc-400";
      badgeStyle = "bg-zinc-100 text-zinc-600 border-zinc-200/80";
      label = "Inactive";
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-tight ${sizeClasses} ${badgeStyle} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotColor}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
