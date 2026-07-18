"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ReadyButton = memo(function ReadyButton({
  isReady,
  disabled,
  onToggle,
  readyLabel,
  notReadyLabel,
}: {
  isReady: boolean;
  disabled?: boolean;
  onToggle: () => void;
  readyLabel: string;
  notReadyLabel: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isReady}
      whileHover={reduceMotion || disabled ? undefined : { y: -2, scale: 1.02 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
      className={`w-full rounded-full px-6 py-3.5 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-60 ${
        isReady
          ? "border border-white/15 bg-white/[0.04] text-[#c6cbd6] hover:bg-white/[0.07]"
          : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-navy-950 shadow-[0_0_28px_rgba(52,211,153,0.35)]"
      }`}
    >
      {isReady ? notReadyLabel : `✓ ${readyLabel}`}
    </motion.button>
  );
});

export default ReadyButton;
