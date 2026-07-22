"use client";

/**
 * Mission 6 Part 4 — a small reusable skeleton primitive so loading states
 * across the app (admin dashboard, question bank, stats) show a shape of
 * what's coming instead of a blank area or a lone "Loading…" string. Pure
 * CSS animation (Tailwind's animate-pulse), no framer-motion needed for
 * something this simple, and animate-pulse is already covered by the
 * global prefers-reduced-motion rule in globals.css.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} aria-hidden />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="mt-3 h-8 w-1/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-t border-white/5 p-3 first:border-t-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
