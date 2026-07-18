"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Full-screen 3-2-1-GO! overlay shown right before the host's start action
// redirects into the (unchanged) battle page. Purely presentational — it
// does not touch room/battle state itself; the caller supplies onComplete.
export default function Countdown({ goLabel, onComplete }: { goLabel: string; onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState<3 | 2 | 1 | 0>(3);

  useEffect(() => {
    // Under reduced motion, skip straight through with just enough delay
    // to read each number, no bouncing/scaling animation.
    const stepMs = reduceMotion ? 500 : 800;
    if (tick === 0) {
      const finish = window.setTimeout(onComplete, stepMs);
      return () => window.clearTimeout(finish);
    }
    const next = window.setTimeout(() => setTick((t) => (t - 1) as 3 | 2 | 1 | 0), stepMs);
    return () => window.clearTimeout(next);
  }, [tick, reduceMotion, onComplete]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/85 backdrop-blur-sm"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={tick}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.4 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: "backOut" }}
          className="font-display text-8xl font-bold text-gold-400 drop-shadow-[0_0_40px_rgba(232,193,95,0.6)] sm:text-9xl"
        >
          {tick === 0 ? goLabel : tick}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
