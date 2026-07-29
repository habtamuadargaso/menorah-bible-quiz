"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { hapticLight } from "@/lib/mobile/haptics";

type Theme = "gold" | "navy-outline";
// Mission 17.5 — controlled per-action accent (section 4: "give each main
// mobile action a controlled accent"). Card background stays dark navy
// either way (THEME_CLASSES above) — accent only tints the icon chip,
// border, and focus glow, using the centralized tokens from
// tailwind.config.ts rather than one-off inline colors.
export type ActionAccent = "blue" | "amber" | "purple" | "violet" | "teal";

const THEME_CLASSES: Record<Theme, string> = {
  gold: "border-gold-500/25 bg-glass-gold shadow-premium hover:border-gold-500/45",
  "navy-outline": "border-white/10 bg-white/[0.04] shadow-premium hover:border-gold-500/30",
};

const ACCENT_CLASSES: Record<ActionAccent, { border: string; icon: string }> = {
  blue: { border: "border-blue-400/25 hover:border-blue-400/45", icon: "bg-blue-500/15 text-blue-300" },
  amber: { border: "border-amber-400/25 hover:border-amber-400/45", icon: "bg-amber-500/15 text-amber-300" },
  purple: { border: "border-fuchsia-400/25 hover:border-fuchsia-400/45", icon: "bg-fuchsia-500/15 text-fuchsia-300" },
  violet: { border: "border-purple-400/25 hover:border-purple-400/45", icon: "bg-purple-500/15 text-purple-300" },
  teal: { border: "border-teal-400/25 hover:border-teal-400/45", icon: "bg-teal-500/15 text-teal-300" },
};

function CardContent({
  icon,
  title,
  subtitle,
  theme,
  accent,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  theme: Theme;
  accent?: ActionAccent;
}) {
  const accentClasses = accent ? ACCENT_CLASSES[accent] : null;
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
      viewport={{ once: true, margin: "-10px" }}
      whileTap={reduceMotion ? undefined : { scale: 0.97, transition: { duration: 0.15 } }}
      className={`relative flex min-h-[64px] w-full items-center gap-3 overflow-hidden rounded-card-sm border px-4 py-3.5 text-left backdrop-blur-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
        accentClasses ? `bg-white/[0.04] shadow-premium ${accentClasses.border}` : THEME_CLASSES[theme]
      }`}
    >
      {/* Mission 18 — subtle inner highlight, a 1px sheen along the top edge
          rather than a full glow, so every card reads as premium without
          every card glowing (section 8's "not every card glows" rule). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <span
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
          accentClasses ? accentClasses.icon : "bg-navy-900/60 text-gold-400"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-[#f7f0dc]">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-[#9aa1b0]">{subtitle}</span>}
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#6b7280]" aria-hidden />
    </motion.div>
  );
}

// Mission 15 — shared tappable card for the mobile home dashboard (Solo
// Play, Live Battle, Friends Battle, Church Mode, Leaderboard, Profile).
// Either onClick (reuses an existing handler already owned by the page,
// e.g. app/page.tsx's handlePlaySingle) or href (an existing route) is
// provided by the caller — this component never invents new navigation.
export default function MobileActionCard({
  icon,
  title,
  subtitle,
  theme = "gold",
  accent,
  onClick,
  href,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  theme?: Theme;
  accent?: ActionAccent;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className="block" onClick={hapticLight}>
        <CardContent icon={icon} title={title} subtitle={subtitle} theme={theme} accent={accent} />
      </Link>
    );
  }
  return (
    <button
      onClick={() => {
        hapticLight();
        onClick?.();
      }}
      className="block w-full"
    >
      <CardContent icon={icon} title={title} subtitle={subtitle} theme={theme} accent={accent} />
    </button>
  );
}
