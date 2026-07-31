"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoreVertical, Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { loadProgress, levelForXp } from "@/lib/progress";
import LanguageSelector from "@/components/LanguageSelector";
import SoundToggle from "@/components/SoundToggle";

// Mission 15 — simplified mobile top header: logo, level pill, a compact
// "more" sheet holding language + sound (kept off the always-visible row so
// the bar stays uncluttered at phone widths), settings, and profile access.
// Desktop keeps components/Header.tsx's full nav untouched.
export default function MobileTopBar({
  title,
  onHome,
}: {
  title?: string;
  onHome?: () => void;
}) {
  const { t } = useLanguage();
  const { user, isGuest } = useAuth();
  const displayName = user?.displayName ?? t.common.guest;
  const [level, setLevel] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLevel(levelForXp(loadProgress().totalXp).level);
  }, []);

  // Mission 27 — standardized on public/branding/ (single source of
  // truth). A custom `title` (e.g. a specific game screen's name) gets
  // the symbol mark next to it; with no override, the compact horizontal
  // lockup is shown (no tagline — this bar is too tight for one).
  const logo = title ? (
    <span className="flex items-center gap-2">
      <img src="/branding/logo-symbol.svg" alt="" className="h-6 w-6 flex-shrink-0" />
      <span className="truncate font-display text-base font-semibold text-[#f7f0dc]">{title}</span>
    </span>
  ) : (
    <img src="/branding/logo-horizontal-compact.svg" alt="Menorah Bible Quiz" className="h-7 w-auto" />
  );

  return (
    <div className="relative z-20 flex min-h-[60px] items-center justify-between gap-2 border-b border-gold-500/20 bg-navy-950/90 px-3 py-2 backdrop-blur-md md:hidden">
      {onHome ? (
        <button
          onClick={onHome}
          className="flex min-h-[44px] items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {logo}
        </button>
      ) : (
        <Link
          href="/"
          className="flex min-h-[44px] items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {logo}
        </Link>
      )}

      <div className="flex flex-shrink-0 items-center gap-1">
        <div className="flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/[0.06] px-2 py-1 text-[11px] font-semibold text-gold-400">
          <span className="hidden min-[370px]:inline">{t.common.level}</span>
          <span className="text-gold-300">{level}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.settings.title}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/30 text-gold-400 outline-none transition-colors hover:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-30 flex w-52 flex-col gap-3 rounded-card-sm border border-gold-500/25 bg-navy-900/95 p-4 shadow-premium-lg backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#c6cbd6]">{t.settings.soundLabel}</span>
                <SoundToggle />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#c6cbd6]">{t.settings.languageLabel}</span>
                <LanguageSelector />
              </div>
            </div>
          )}
        </div>

        <Link
          href="/settings"
          aria-label={t.settings.navLabel}
          title={t.settings.navLabel}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/30 text-gold-400 outline-none transition-colors hover:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </Link>

        <Link
          href="/profile"
          aria-label={t.profile.title}
          title={isGuest ? t.common.guest : displayName}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/15 font-display text-sm font-bold text-gold-400 outline-none transition-colors hover:bg-gold-500/25 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {displayName.charAt(0)}
        </Link>
      </div>
    </div>
  );
}
