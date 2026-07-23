"use client";

import { motion, useReducedMotion } from "framer-motion";

function Shimmer({ className }: { className: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={`overflow-hidden rounded-lg bg-white/[0.06] ${className}`}>
      {!reduceMotion && (
        <motion.div
          className="h-full w-1/3 bg-white/10"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

export default function LeaderboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto max-w-5xl px-5">
      <div className="mb-8 flex items-end justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Shimmer className="h-16 w-16 rounded-full" />
            <Shimmer className="h-3 w-20" />
            <Shimmer className={`w-24 ${i === 1 ? "h-28" : i === 0 ? "h-20" : "h-16"}`} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <Shimmer className="h-6 w-6 flex-shrink-0" />
            <Shimmer className="h-9 w-9 flex-shrink-0 rounded-full" />
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-4 w-12 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
