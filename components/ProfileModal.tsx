"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { loadProgress, levelForXp, type Progress } from "@/lib/progress";
import { ACHIEVEMENTS, loadUnlockedAchievements, type AchievementId } from "@/lib/achievements";

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { user, isGuest, signInWithEmail } = useAuth();
  const displayName = user?.displayName ?? t.common.guest;
  const [progress, setProgress] = useState<Progress>({ totalXp: 0, coins: 0, quizzesCompleted: 0 });
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);
  const [signInMessage, setSignInMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProgress(loadProgress());
      setUnlocked(loadUnlockedAchievements());
      setSignInMessage(null);
    }
  }, [open]);

  async function handleSignInClick() {
    const res = await signInWithEmail("");
    setSignInMessage(res.message);
  }

  const { level, xpIntoLevel, xpForNextLevel, progressPct } = levelForXp(progress.totalXp);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[24px] border border-gold-500/25 bg-navy-900 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-[#fbf6e8]">{t.profile.title}</h3>
              <button onClick={onClose} className="text-xl text-[#8d94a3] hover:text-gold-500">
                &times;
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 font-display text-xl font-bold text-gold-400">
                {displayName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-[#f3efe2]">{isGuest ? t.common.guest : displayName}</div>
                <div className="text-xs text-[#8d94a3]">
                  {t.common.level} {level}
                </div>
              </div>
            </div>

            <div className="mb-1 flex justify-between text-xs text-[#9aa1b0]">
              <span>{t.common.xp}</span>
              <span>
                {xpIntoLevel} / {xpForNextLevel}
              </span>
            </div>
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-3 py-3 text-center">
                <div className="font-display text-lg font-bold text-[#f3efe2]">{progress.quizzesCompleted}</div>
                <div className="mt-0.5 text-[11px] text-[#9aa1b0]">{t.profile.quizzesCompleted}</div>
              </div>
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-3 py-3 text-center">
                <div className="font-display text-lg font-bold text-[#f3efe2]">{progress.totalXp}</div>
                <div className="mt-0.5 text-[11px] text-[#9aa1b0]">{t.profile.totalXp}</div>
              </div>
              <div className="rounded-2xl border border-gold-500/20 bg-white/[0.04] px-3 py-3 text-center">
                <div className="font-display text-lg font-bold text-gold-300">{progress.coins}</div>
                <div className="mt-0.5 text-[11px] text-[#9aa1b0]">Coins</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-500">
                {t.profile.badgesHeading}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ACHIEVEMENTS.map((a) => {
                  const isUnlocked = unlocked.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      title={t.achievements.list[a.id].title}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-base ${
                        isUnlocked
                          ? "border-gold-500 bg-gold-500/20 text-gold-300"
                          : "border-white/10 bg-white/[0.03] text-[#4b5163]"
                      }`}
                    >
                      {a.icon}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="rounded-xl border border-gold-500/15 bg-gold-500/5 px-4 py-3 text-xs leading-relaxed text-gold-300/90">
              {signInMessage ?? (isGuest ? t.profile.guestNotice : "")}
            </p>

            {isGuest && (
              <button
                onClick={handleSignInClick}
                className="mt-4 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 py-3 text-sm font-bold text-navy-900 shadow-gold"
              >
                {t.common.signIn}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
