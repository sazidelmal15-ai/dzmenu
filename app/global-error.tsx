"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-center text-white">
        <div className="max-w-md space-y-4 rounded-xl border border-red-900/30 bg-slate-900 p-8 shadow-xl">
          <h2 className="text-2xl font-bold">System Error</h2>
          <p className="text-sm text-slate-400">
            A critical error occurred. Please refresh or try again later.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
