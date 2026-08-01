"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import {
  getMusicVolume,
  getSfxVolume,
  isMusicEnabled,
  isSoundEnabled,
  setMusicEnabled,
  setMusicVolume,
  setSfxVolume,
  setSoundEnabled,
} from "@/lib/sound";
import {
  isHighContrastEnabled,
  isReducedMotionOverride,
  setHighContrastEnabled,
  setReducedMotionOverride,
} from "@/lib/preferences";
import { resetOnboarding } from "@/lib/mobile/onboarding";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { hapticLight } from "@/lib/mobile/haptics";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        hapticLight();
        onChange(!checked);
      }}
      className="relative h-11 w-12 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
    >
      <span aria-hidden className={`absolute left-0 top-2 h-7 w-12 rounded-full transition-colors ${checked ? "bg-gold-500" : "bg-white/15"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}

/**
 * Mission 6 Part 10 — unified player settings. Consolidates preferences
 * that previously lived only in scattered header controls (language,
 * sound) or didn't exist at all (music/sound separated with volume,
 * reduced motion override, high contrast). Everything here persists to
 * localStorage via lib/sound.ts / lib/preferences.ts and takes effect
 * immediately — no separate "save" step.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ts = t.settings;

  const [mounted, setMounted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [sfxVolume, setSfxVolumeState] = useState(1);
  const [musicVolume, setMusicVolumeState] = useState(0.28);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    setMusicOn(isMusicEnabled());
    setSfxVolumeState(getSfxVolume());
    setMusicVolumeState(getMusicVolume());
    setReducedMotionState(isReducedMotionOverride());
    setHighContrastState(isHighContrastEnabled());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main id="main-content" className="min-h-screen w-full px-4 py-12 sm:px-8" style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}>
        <div className="mx-auto max-w-2xl" role="status" aria-label="Loading settings">
          <Skeleton className="mx-auto h-10 w-48" />
          <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
          <div className="mt-8 space-y-5"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        </div>
      </main>
    );
  }

  const sectionClass = "rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium";
  const labelClass = "flex items-center justify-between gap-4";

  return (
    <main
      id="main-content"
      className="min-h-screen w-full px-4 py-12 text-[#f3efe2] sm:px-8"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-2xl">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{ts.title}</h1>
          <p className="mt-2 text-[15px] text-[#a7aebd]">{ts.subtitle}</p>
        </motion.header>

        <div className="flex flex-col gap-5">
          <section className={sectionClass}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{ts.languageHeading}</h2>
            <div className={labelClass}>
              <span className="text-sm text-[#c6cbd6]">{ts.languageLabel}</span>
              <LanguageSelector />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{ts.audioHeading}</h2>

            <div className={labelClass}>
              <span className="text-sm text-[#c6cbd6]">{ts.musicLabel}</span>
              <Toggle
                checked={musicOn}
                onChange={(v) => {
                  setMusicOn(v);
                  setMusicEnabled(v);
                }}
                label={ts.musicLabel}
              />
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-[#9aa1b0]">{ts.musicVolumeLabel}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                disabled={!musicOn}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMusicVolumeState(v);
                  setMusicVolume(v);
                }}
                className="w-full accent-gold-400 disabled:opacity-40"
                aria-label={ts.musicVolumeLabel}
              />
            </label>

            <div className={`${labelClass} mt-5`}>
              <span className="text-sm text-[#c6cbd6]">{ts.soundLabel}</span>
              <Toggle
                checked={soundOn}
                onChange={(v) => {
                  setSoundOn(v);
                  setSoundEnabled(v);
                }}
                label={ts.soundLabel}
              />
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-[#9aa1b0]">{ts.soundVolumeLabel}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sfxVolume}
                disabled={!soundOn}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSfxVolumeState(v);
                  setSfxVolume(v);
                }}
                className="w-full accent-gold-400 disabled:opacity-40"
                aria-label={ts.soundVolumeLabel}
              />
            </label>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{ts.accessibilityHeading}</h2>

            <div className={labelClass}>
              <div>
                <span className="text-sm text-[#c6cbd6]">{ts.reducedMotionLabel}</span>
                <p className="mt-0.5 text-xs text-[#7d8494]">{ts.reducedMotionHint}</p>
              </div>
              <Toggle
                checked={reducedMotion}
                onChange={(v) => {
                  setReducedMotionState(v);
                  setReducedMotionOverride(v);
                }}
                label={ts.reducedMotionLabel}
              />
            </div>

            <div className={`${labelClass} mt-5`}>
              <div>
                <span className="text-sm text-[#c6cbd6]">{ts.highContrastLabel}</span>
                <p className="mt-0.5 text-xs text-[#7d8494]">{ts.highContrastHint}</p>
              </div>
              <Toggle
                checked={highContrast}
                onChange={(v) => {
                  setHighContrastState(v);
                  setHighContrastEnabled(v);
                }}
                label={ts.highContrastLabel}
              />
            </div>
          </section>

          {/* Mission 21 — mobile-only replay entry point for the first-launch
              onboarding tour (Settings → About → View Tutorial Again).
              md:hidden because onboarding itself is mobile-only; showing
              this on desktop would add a visible element to a page desktop
              also uses, which the "desktop remains unchanged" rule forbids. */}
          <section className={`${sectionClass} md:hidden`}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.onboarding.replay.heading}</h2>
            <div className={labelClass}>
              <p className="text-sm text-[#c6cbd6]">{t.onboarding.replay.description}</p>
              <button
                type="button"
                onClick={() => {
                  resetOnboarding();
                  router.push("/");
                }}
                className="min-h-[44px] flex-shrink-0 rounded-full border border-gold-500/30 px-4 text-sm font-semibold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                {t.onboarding.replay.button}
              </button>
            </div>
          </section>

          <section id="coming-soon" className={sectionClass}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{t.common.comingSoon}</h2>
            <div className="flex flex-col gap-3">
              {[
                t.challenges.daily,
                t.challenges.weekly,
                t.bible.readingPlan,
                t.bible.favorites,
                t.bible.prayerJournal,
                t.church.competition,
                t.church.youthChallenge,
                t.church.sundaySchool,
                t.church.teamVsTeam,
                t.church.dashboard,
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-[#f3efe2]">{item.title}</div>
                    <div className="mt-0.5 text-xs text-[#8d94a3]">{item.subtitle}</div>
                  </div>
                  <span className="mt-0.5 flex-shrink-0 rounded-full border border-gold-500/25 bg-navy-950/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-400">
                    {t.common.comingSoon}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {ts.backToHome}
          </button>
        </div>
      </div>
    </main>
  );
}
