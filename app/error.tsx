"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/errorReporting";

/**
 * Mission 7 Part 11: catches any error thrown while rendering a route
 * inside the root layout (the layout itself keeps rendering — see
 * global-error.tsx for the layout-level fallback). Without this, a thrown
 * error blanks the whole page with no way back for a player mid-quiz.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950 px-4 text-[#f3efe2]">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-white/[0.04] p-8 text-center shadow-premium backdrop-blur-md">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-300">Menorah Bible Quiz</p>
        <h1 className="mt-3 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-[#a7aebd]">
          This screen hit an unexpected error. Your progress up to this point is saved — try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-3 text-sm font-bold text-navy-900 shadow-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
