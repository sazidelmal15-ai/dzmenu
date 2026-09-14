"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/admin";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Mission Control error boundary caught error:", error);
  }, [error]);

  return (
    <div className="py-8">
      <ErrorState
        title="Failed to load Mission Control data"
        message={error.message || "An unexpected error occurred while loading administrative dashboard metrics."}
        action={
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition shadow-xs"
          >
            Try Again / إعادة المحاولة
          </button>
        }
      />
    </div>
  );
}
