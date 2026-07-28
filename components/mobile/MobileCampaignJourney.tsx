"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { getHighestUnlockedLevel, type CampaignProgress } from "@/lib/campaign";
import { MAX_GAME_LEVEL } from "@/lib/levels";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CategoryIcon from "@/components/CategoryIcon";
import { hapticLight } from "@/lib/mobile/haptics";
import MobileAmbientGlow from "./MobileAmbientGlow";

// Mission 15.6 — mobile-only presentation of the campaign level list.
// Reuses the exact same unlock/completed/current derivation as
// components/CampaignMap.tsx (desktop, untouched) — this only changes how
// those three states are drawn: compact full-width rows instead of a
// square-card grid. onSelectLevel and the locked/disabled guard are
// identical to the desktop component, so clicking a row behaves exactly
// the same as clicking a desktop level card.
export default function MobileCampaignJourney({
  categoryId,
  activeLevel,
  progress,
  onSelectLevel,
}: {
  categoryId: CategoryId;
  activeLevel: number;
  progress: CampaignProgress;
  onSelectLevel: (level: number) => void;
}) {
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";
  const reduceMotion = useReducedMotion();
  const highestUnlocked = getHighestUnlockedLevel(categoryId, progress);
  const completedCount = Math.min(MAX_GAME_LEVEL, Math.max(0, highestUnlocked - 1));
  const progressPct = Math.round((completedCount / MAX_GAME_LEVEL) * 100);
  const categoryIcon = CATEGORIES.find((c) => c.id === categoryId)?.icon ?? "question";

  function tierLabel(level: number) {
    return level <= 3 ? t.campaign.foundation : level <= 7 ? t.campaign.growingDisciple : t.campaign.scriptureMaster;
  }

  return (
    <section className="relative px-4 pb-6 pt-4">
      <MobileAmbientGlow />
      <div className="rounded-card-sm border border-gold-500/25 bg-gradient-to-br from-gold-500/12 via-navy-900/40 to-transparent p-4 shadow-premium">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-gold-500/25"
            style={{ background: "radial-gradient(circle, rgba(232,193,95,0.18) 0%, rgba(232,193,95,0.03) 100%)" }}
          >
            <CategoryIcon icon={categoryIcon} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">{t.campaign.journey}</div>
            <h1 className="mt-0.5 truncate font-display text-xl font-bold text-[#fbf6e8]">
              {t.categories[categoryId]?.title}
            </h1>
            <div className="mt-0.5 text-xs text-[#a7aebd]">
              {t.common.level} {activeLevel}/{MAX_GAME_LEVEL}
            </div>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1.5 text-xs font-semibold text-[#9aa1b0]">
          {isAmharic
            ? `${completedCount} ከ ${MAX_GAME_LEVEL} ደረጃዎች ተጠናቅቀዋል`
            : `${completedCount} of ${MAX_GAME_LEVEL} levels completed`}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: MAX_GAME_LEVEL }).map((_, i) => {
          const level = i + 1;
          const locked = level > highestUnlocked;
          const completed = level < highestUnlocked;
          const current = level === activeLevel;

          return (
            <motion.button
              key={level}
              type="button"
              disabled={locked}
              onClick={() => {
                hapticLight();
                onSelectLevel(level);
              }}
              whileTap={!locked && !reduceMotion ? { scale: 0.98 } : undefined}
              className={`flex min-h-[60px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                current
                  ? "border-gold-400 bg-gold-500/15 shadow-[0_0_24px_rgba(232,193,95,0.3)]"
                  : completed
                  ? "border-emerald-400/30 bg-emerald-400/[0.06]"
                  : locked
                  ? "border-white/10 bg-white/[0.02] opacity-55"
                  : "border-white/10 bg-white/[0.04]"
              }`}
              aria-label={`${t.common.level} ${level} ${locked ? "locked" : completed ? "completed" : "unlocked"}`}
            >
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                  current
                    ? "bg-gold-500/25 text-gold-300"
                    : completed
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-white/[0.06] text-[#8d94a3]"
                }`}
              >
                {level}
              </span>

              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold ${locked ? "text-[#7c8394]" : "text-[#f3efe2]"}`}>
                  {tierLabel(level)}
                </span>
              </span>

              {completed && (
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                </span>
              )}

              {current && (
                <span className="flex-shrink-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-4 py-1.5 text-xs font-bold text-navy-900 shadow-gold">
                  {isAmharic ? "ቀጥል" : "Continue"}
                </span>
              )}

              {locked && (
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-[#6b7280]">
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
