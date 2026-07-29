"use client";

import { memo, useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

// Mission 20 — reusable count-up for any number shown on the mobile
// dashboard (XP, coins, streak, level-complete stats). Purely presentational:
// it receives an already-computed number from the caller (lib/progress.ts /
// lib/profileStats.ts / QuizResult) and tweens the DISPLAYED digits from
// whatever it last showed to the new value — it never computes or stores
// game state itself, so XP/coin/streak math is completely untouched.
// Memoized since it re-renders on every animation frame while tweening.
function AnimatedNumber({
  value,
  duration = 0.7,
  formatter,
  startFromZero = false,
}: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  /** Mission 20 — count up from 0 on first mount (celebration screens) instead of the default "only animate real changes" behavior (dashboard chips, where a fresh page load isn't a "change"). */
  startFromZero?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(startFromZero ? 0 : value);
  const prevRef = useRef(startFromZero ? 0 : value);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Skip the tween on first mount (e.g. a fresh page load) — only
    // animate real changes, per "only when values change" — unless the
    // caller explicitly asked for a count-up-from-zero entrance.
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!startFromZero || reduceMotion) {
        prevRef.current = value;
        setDisplay(value);
        return;
      }
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate: (v) => setDisplay(Math.round(v)),
      });
      prevRef.current = value;
      return () => controls.stop();
    }
    if (reduceMotion || prevRef.current === value) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }
    const from = prevRef.current;
    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prevRef.current = value;
    return () => controls.stop();
  }, [value, duration, reduceMotion, startFromZero]);

  const text = formatter ? formatter(display) : display.toLocaleString();
  return <>{text}</>;
}

export default memo(AnimatedNumber);
