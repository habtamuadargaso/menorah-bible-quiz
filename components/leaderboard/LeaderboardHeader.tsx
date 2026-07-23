"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function LeaderboardHeader({
  heading,
  subheading,
  devModeBadge,
  showDevBadge,
}: {
  heading: string;
  subheading: string;
  devModeBadge: string;
  showDevBadge: boolean;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.header
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
      className="mx-auto max-w-5xl px-5 pb-6 pt-8 text-center"
    >
      {showDevBadge && (
        <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-300">
          ⚠ {devModeBadge}
        </div>
      )}
      <h1 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{heading}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#a7aebd] sm:text-[15px]">{subheading}</p>
    </motion.header>
  );
}
