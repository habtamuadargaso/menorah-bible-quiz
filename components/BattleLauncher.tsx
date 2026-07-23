"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BattleLauncher({ onStart }: { onStart: () => void }) {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-5xl px-5 pb-12">
      <motion.button
        whileHover={{ y: -6, scale: 1.015 }}
        whileTap={{ scale: .99 }}
        onClick={onStart}
        className="w-full rounded-card border border-gold-500/35 bg-glass-gold p-6 text-left shadow-premium outline-none transition-all hover:border-gold-500/55 hover:shadow-[0_0_36px_rgba(232,193,95,0.3)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 sm:p-8"
      >
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[.24em] text-gold-500">{t.battle.newMode}</div>
            <div className="mt-2 font-display text-3xl font-bold text-[#fbf6e8]">⚔ {t.battle.title}</div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a7aebd]">{t.battle.launcherDescription}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[t.battle.badgeRoomCode, t.battle.badgeSeparateDevices, t.battle.badgeOnline, t.battle.badgeRealtime].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-200"
                  >
                    ✔ {badge}
                  </span>
                )
              )}
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-7 py-3 font-extrabold text-navy-950">{t.battle.play}</span>
        </div>
      </motion.button>
    </section>
  );
}
