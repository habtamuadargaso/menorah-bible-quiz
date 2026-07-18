"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import ComingSoonCard from "./ComingSoonCard";
import SectionBackdrop from "./SectionBackdrop";

export default function ChurchModeSection() {
  const { t } = useLanguage();

  return (
    <section id="church-mode" className="relative mx-auto max-w-5xl px-5 pb-24 pt-10">
      <SectionBackdrop tint="purple" />
      <div className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{t.church.heading}</h2>
        <p className="mt-2 text-[15px] text-[#a7aebd]">{t.church.subheading}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ComingSoonCard title={t.church.competition.title} subtitle={t.church.competition.subtitle} />
        <ComingSoonCard title={t.church.youthChallenge.title} subtitle={t.church.youthChallenge.subtitle} />
        <ComingSoonCard title={t.church.sundaySchool.title} subtitle={t.church.sundaySchool.subtitle} />
        <ComingSoonCard title={t.church.teamVsTeam.title} subtitle={t.church.teamVsTeam.subtitle} />
        <ComingSoonCard title={t.church.dashboard.title} subtitle={t.church.dashboard.subtitle} />
      </div>
    </section>
  );
}
