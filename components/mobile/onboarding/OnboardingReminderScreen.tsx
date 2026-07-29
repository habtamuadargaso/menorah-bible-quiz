"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { hapticLight } from "@/lib/mobile/haptics";
import { GOLD_OUTLINE_BUTTON_CLASS } from "./OnboardingShell";

// Mission 21.1 — matches the approved mockup: a horizontal header (bell
// left, heading+subheading right, left-aligned), a light iOS-style
// notification-banner preview card, then Enable/Not Now buttons and a
// small settings note. Whichever button is tapped both persists the
// choice (lib/mobile/onboarding.ts) and advances onboarding — this screen
// is never shown again after onboarding completes, so the user is never
// nagged a second time.
export default function OnboardingReminderScreen({
  heading,
  subheading,
  notificationTitle,
  notificationBody,
  enableLabel,
  notNowLabel,
  settingsNote,
  onEnable,
  onNotNow,
}: {
  heading: string;
  subheading: string;
  notificationTitle: string;
  notificationBody: string;
  enableLabel: string;
  notNowLabel: string;
  settingsNote: string;
  onEnable: () => void;
  onNotNow: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col justify-center gap-11 px-5">
      <div className="flex items-center gap-5">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, rotate: [0, -8, 8, -4, 4, 0] }
          }
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/15 shadow-gold"
        >
          <Bell className="h-12 w-12 text-gold-300" aria-hidden />
        </motion.div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] font-bold leading-[1.15] text-[#fbf6e8]">{heading}</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[#c6cbd6]">{subheading}</p>
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-card-sm bg-[#e7e8ec] px-4 py-4 shadow-premium"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#4a4d57]">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gold-500 text-navy-900">
              <Bell className="h-3 w-3" aria-hidden fill="currentColor" />
            </span>
            {notificationTitle}
          </span>
          <span className="text-xs text-[#6b6e78]">now</span>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-navy-950 text-lg" aria-hidden>
            🕎
          </span>
          <span className="mt-0.5 block text-sm leading-snug text-[#2b2d33]">{notificationBody}</span>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3.5">
        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          onClick={() => {
            hapticLight();
            onEnable();
          }}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 text-sm font-bold text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {enableLabel}
        </motion.button>
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onNotNow();
          }}
          className={GOLD_OUTLINE_BUTTON_CLASS}
        >
          {notNowLabel}
        </button>
        <p className="text-center text-xs text-[#7d8494]">{settingsNote}</p>
      </div>
    </div>
  );
}
