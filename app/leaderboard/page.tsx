"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LeaderboardPage from "@/components/leaderboard/LeaderboardPage";

export default function GlobalLeaderboardRoute() {
  const { t } = useLanguage();
  return (
    <main
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 rounded-full"
        >
          <span aria-hidden>←</span>
          {t.nav.home}
        </Link>
      </div>
      <LeaderboardPage />
    </main>
  );
}
