"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { loadProgress, levelForXp } from "@/lib/progress";
import LanguageSelector from "./LanguageSelector";
import SoundToggle from "./SoundToggle";
import ProfileModal from "./ProfileModal";

export default function Header({
  onHome,
  onCategories,
  onBible,
  onChurch,
  onLeaderboard,
}: {
  onHome: () => void;
  onCategories: () => void;
  onBible: () => void;
  onChurch: () => void;
  onLeaderboard: () => void;
}) {
  const { t } = useLanguage();
  const { user, isGuest } = useAuth();
  const displayName = user?.displayName ?? t.common.guest;
  const [level, setLevel] = useState(1);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setLevel(levelForXp(loadProgress().totalXp).level);
    // re-read whenever the profile modal closes, in case XP just changed
  }, [profileOpen]);

  return (
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gold-500/15 bg-navy-950/60 px-5 py-4 backdrop-blur-sm sm:px-8">
      <button onClick={onHome} className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" className="h-7 w-7 flex-shrink-0">
          <path
            d="M12 2v9M12 11c-2.5 0-4-1.6-4-4M12 11c2.5 0 4-1.6 4-4M12 11c-4 0-7 1.4-7 5v5h14v-5c0-3.6-3-5-7-5Z"
            stroke="#e8c15f"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="8" cy="6.4" r="1" fill="#e8c15f" />
          <circle cx="12" cy="4.6" r="1" fill="#e8c15f" />
          <circle cx="16" cy="6.4" r="1" fill="#e8c15f" />
        </svg>
        <span className="font-display text-lg font-semibold tracking-wide text-[#f7f0dc]">
          Menorah <span className="text-gold-500">Bible Quiz</span>
        </span>
      </button>

      <div className="flex items-center gap-3 sm:gap-5">
        <nav className="hidden items-center gap-5 text-sm font-medium text-[#c6cbd6] lg:flex">
          <button onClick={onHome} className="transition-colors hover:text-gold-500">
            {t.nav.home}
          </button>
          <button onClick={onCategories} className="transition-colors hover:text-gold-500">
            {t.nav.categories}
          </button>
          <button onClick={onBible} className="transition-colors hover:text-gold-500">
            {t.bible.heading}
          </button>
          <button onClick={onChurch} className="transition-colors hover:text-gold-500">
            {t.church.heading}
          </button>
          <button onClick={onLeaderboard} className="transition-colors hover:text-gold-500">
            {t.nav.leaderboard}
          </button>
        </nav>

        <div className="hidden items-center gap-1.5 rounded-full border border-gold-500/25 px-3 py-1 text-xs font-semibold text-gold-400 sm:flex">
          <span>{t.common.level}</span>
          <span className="text-gold-300">{level}</span>
        </div>

        <SoundToggle />
        <LanguageSelector />

        <button
          onClick={() => setProfileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/15 font-display text-sm font-bold text-gold-400 transition-colors hover:bg-gold-500/25"
          title={isGuest ? t.common.guest : displayName}
        >
          {displayName.charAt(0)}
        </button>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
