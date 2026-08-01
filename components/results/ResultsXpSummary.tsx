"use client";

import AnimatedNumber from "@/components/mobile/AnimatedNumber";

export default function ResultsXpSummary({ baseXp, bonusXp, totalXp, labels }: { baseXp: number; bonusXp: number; totalXp: number; labels: { earned: string; bonus: string; total: string } }) {
  const rows = [
    { label: labels.earned, value: baseXp, tone: "text-purple-200" },
    { label: labels.bonus, value: bonusXp, tone: "text-gold-300" },
    { label: labels.total, value: totalXp, tone: "text-[#fbf6e8]" },
  ];
  return (
    <section aria-labelledby="xp-summary-heading" className="rounded-[24px] border border-purple-400/25 bg-white/[0.045] p-5 text-left shadow-[0_18px_44px_rgba(0,0,0,0.25)]">
      <h2 id="xp-summary-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-purple-200">{labels.total}</h2>
      <div className="mt-4 divide-y divide-white/10">
        {rows.map((row) => <div key={row.label} className="flex min-h-[44px] items-center justify-between gap-4 py-2"><span className="text-sm text-[#aeb5c3]">{row.label}</span><span className={`font-display text-xl font-bold ${row.tone}`}>+<AnimatedNumber value={row.value} duration={0.8} startFromZero /> XP</span></div>)}
      </div>
    </section>
  );
}
