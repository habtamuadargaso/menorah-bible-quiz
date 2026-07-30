"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import ComingSoonCard from "./ComingSoonCard";
import SectionBackdrop from "./SectionBackdrop";

// Hardcoded (rather than computed with Math.cos/Math.sin at render time) because
// server and client can round transcendental functions to different last bits,
// which React reports as a hydration mismatch once serialized to a JSX attribute
// string. Values are `70 + cos(PI/6*i + PI)*34` / `60 + sin(PI/6*i + PI)*34`,
// rounded to 3dp.
const WINDOW_RAYS = [
  { x2: 36, y2: 60 },
  { x2: 40.555, y2: 43 },
  { x2: 53, y2: 30.555 },
  { x2: 70, y2: 26 },
  { x2: 87, y2: 30.555 },
  { x2: 99.445, y2: 43 },
];

// A gentle cathedral-window motif — a pointed arch with a cross mullion
// and stained-glass-style radiating panes — shared across the Church
// Mode cards to give the section its own quiet identity.
function CathedralWindowMotif() {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full">
      <path
        d="M30 130V60a40 40 0 0 1 80 0v70Z"
        stroke="currentColor"
        strokeWidth={1.2}
        fill="none"
      />
      <path d="M70 130V45M30 90h80" stroke="currentColor" strokeWidth={1} />
      {WINDOW_RAYS.map((ray, i) => (
        <line
          key={i}
          x1="70"
          y1="60"
          x2={ray.x2}
          y2={ray.y2}
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.7}
        />
      ))}
    </svg>
  );
}

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
        <ComingSoonCard
          title={t.church.competition.title}
          subtitle={t.church.competition.subtitle}
          motif={<CathedralWindowMotif />}
        />
        <ComingSoonCard
          title={t.church.youthChallenge.title}
          subtitle={t.church.youthChallenge.subtitle}
          motif={<CathedralWindowMotif />}
        />
        <ComingSoonCard
          title={t.church.sundaySchool.title}
          subtitle={t.church.sundaySchool.subtitle}
          motif={<CathedralWindowMotif />}
        />
        <ComingSoonCard
          title={t.church.teamVsTeam.title}
          subtitle={t.church.teamVsTeam.subtitle}
          motif={<CathedralWindowMotif />}
        />
        <ComingSoonCard
          title={t.church.dashboard.title}
          subtitle={t.church.dashboard.subtitle}
          motif={<CathedralWindowMotif />}
        />
      </div>
    </section>
  );
}
