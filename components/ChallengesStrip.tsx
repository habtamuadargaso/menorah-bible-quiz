"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import ComingSoonCard from "./ComingSoonCard";
import DailyReward from "./DailyReward";

export default function ChallengesStrip() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-5xl px-5 pb-4 pt-2">
      <h2 className="mb-6 text-center font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">
        {t.challenges.heading}
      </h2>
      <div className="mb-5">
        <DailyReward />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ComingSoonCard title={t.challenges.daily.title} subtitle={t.challenges.daily.subtitle} />
        <ComingSoonCard title={t.challenges.weekly.title} subtitle={t.challenges.weekly.subtitle} />
      </div>
    </section>
  );
}
