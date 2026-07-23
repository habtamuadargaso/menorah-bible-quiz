"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";

export default function AnswerSavedScreen({
  t,
  nextPlayerName,
}: {
  t: UIStrings;
  /** null once every player has answered — the group reveal is next, not another turn. */
  nextPlayerName: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const tf = t.friendsBattle;

  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 text-center text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <motion.div
        role="status"
        aria-live="polite"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: "backOut" }}
        className="w-full max-w-sm rounded-card border border-emerald-400/30 bg-emerald-500/10 p-8 shadow-premium"
      >
        <span className="text-4xl" aria-hidden>
          ✅
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold text-emerald-300">{tf.answerSavedHeading}</h1>
        <p className="mt-3 text-sm text-[#c6cbd6]">
          {nextPlayerName ? tf.answerSavedBody.replace("{name}", nextPlayerName) : tf.lastQuestionAnswerSavedBody}
        </p>
      </motion.div>
    </main>
  );
}
