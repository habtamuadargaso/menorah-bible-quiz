"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One of the three large Home Options cards: Create Room, Join Room, or
// the disabled Quick Match placeholder.
export default function HomeOptionCard({
  icon,
  title,
  description,
  tone = "gold",
  comingSoon,
  comingSoonLabel,
  delay = 0,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "gold" | "purple";
  comingSoon?: boolean;
  comingSoonLabel?: string;
  delay?: number;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.45, delay, ease: "easeOut" }}
      whileHover={reduceMotion || comingSoon ? undefined : { y: -4 }}
      className={`relative overflow-hidden rounded-card border p-6 shadow-premium-lg backdrop-blur-md sm:p-7 ${
        comingSoon
          ? "border-white/10 bg-white/[0.03] opacity-80"
          : tone === "gold"
            ? "border-gold-500/30 bg-glass-gold hover:border-gold-500/55"
            : "border-purple-400/30 bg-glass-purple hover:border-purple-400/55"
      } transition-colors`}
    >
      {comingSoon && comingSoonLabel && (
        <div className="absolute right-4 top-4 rounded-full border border-gold-500/30 bg-navy-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-400">
          {comingSoonLabel}
        </div>
      )}
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
        style={{
          background:
            tone === "gold"
              ? "radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.03) 100%)"
              : "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.03) 100%)",
        }}
        aria-hidden
      >
        {icon}
      </div>
      <h2 className="font-display text-xl font-bold text-[#fbf6e8] sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#a7aebd]">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </motion.div>
  );
}
