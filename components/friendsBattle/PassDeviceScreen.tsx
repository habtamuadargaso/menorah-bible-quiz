"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";

export default function PassDeviceScreen({
  t,
  playerName,
  questionNumber,
  questionCount,
  onReady,
}: {
  t: UIStrings;
  playerName: string;
  questionNumber: number;
  questionCount: number;
  onReady: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tf = t.friendsBattle;

  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 text-center text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: "backOut" }}
        className="w-full max-w-sm rounded-card border border-white/10 bg-white/[0.04] p-8 shadow-premium"
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-500">
          {tf.questionOfTotalLabel.replace("{current}", String(questionNumber)).replace("{total}", String(questionCount))}
        </p>
        <p className="mt-6 text-sm text-[#a7aebd]">{tf.passDeviceToLabel}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#fbf6e8]" data-testid="pass-device-player-name">
          {playerName}
        </h1>

        <motion.button
          type="button"
          onClick={onReady}
          data-testid="fb-ready-button"
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="mt-8 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-4 text-base font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {tf.readyButton}
        </motion.button>
      </motion.div>
    </main>
  );
}
