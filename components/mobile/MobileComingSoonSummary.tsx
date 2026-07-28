"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Mission 15.5 — replaces long grids of ComingSoonCard placeholders in the
// mobile scroll (item 2: "show only features users can actually use").
// The full list of what's planned still exists — it just now lives under
// Settings' "Coming Soon" section (app/settings/page.tsx) instead of taking
// up home-screen space. This card only summarizes count + a couple of
// titles and links there; it never invents new features or copy.
export default function MobileComingSoonSummary({
  heading,
  items,
  isAmharic,
}: {
  heading: string;
  items: string[];
  isAmharic: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const preview = items.slice(0, 2).join(" · ");

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
    >
      <Link
        href="/settings#coming-soon"
        className="flex items-center justify-between gap-3 rounded-card-sm border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-colors hover:border-gold-500/25 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-gold-400">{heading}</div>
          <div className="mt-0.5 truncate text-xs text-[#8d94a3]">{preview}</div>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-gold-400">
          {isAmharic ? "ይመልከቱ" : "See all"}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}
