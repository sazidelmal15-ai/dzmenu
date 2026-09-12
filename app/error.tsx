"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error telemetry on client if needed without exposing sensitive data
    console.error("Application error:", error.digest || "An error occurred");
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4 rounded-xl border border-red-900/30 bg-slate-900/80 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-sm text-slate-400">
          An unexpected error occurred while processing your request.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
