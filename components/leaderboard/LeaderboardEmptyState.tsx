"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function LeaderboardEmptyState({
  icon = "🏆",
  heading,
  body,
  actionLabel,
  onAction,
}: {
  icon?: string;
  heading: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
      className="mx-auto max-w-md rounded-card border border-white/10 bg-white/[0.03] p-10 text-center shadow-premium"
    >
      <div
        aria-hidden
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.03) 100%)" }}
      >
        {icon}
      </div>
      <div className="font-display text-lg font-semibold text-[#f3efe2]">{heading}</div>
      <p className="mt-2 text-sm leading-relaxed text-[#8d94a3]">{body}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-full border border-gold-500/45 px-6 py-2.5 text-sm font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
