"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type Theme = "gold" | "navy-outline";

const THEME_CLASSES: Record<Theme, string> = {
  gold: "border-gold-500/25 bg-glass-gold shadow-premium hover:border-gold-500/45",
  "navy-outline": "border-white/10 bg-white/[0.04] shadow-premium hover:border-gold-500/30",
};

function CardContent({
  icon,
  title,
  subtitle,
  theme,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  theme: Theme;
}) {
  return (
    <div
      className={`flex min-h-[64px] w-full items-center gap-3 rounded-card-sm border px-4 py-3.5 text-left backdrop-blur-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${THEME_CLASSES[theme]}`}
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-navy-900/60 text-gold-400">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-[#f7f0dc]">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-[#9aa1b0]">{subtitle}</span>}
      </span>
    </div>
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
  onClick,
  href,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  theme?: Theme;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className="block">
        <CardContent icon={icon} title={title} subtitle={subtitle} theme={theme} />
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="block w-full">
      <CardContent icon={icon} title={title} subtitle={subtitle} theme={theme} />
    </button>
  );
}
