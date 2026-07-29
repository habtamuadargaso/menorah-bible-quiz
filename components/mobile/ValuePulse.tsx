"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Mission 20 — wraps a coin/streak/level display and plays a quick
// scale + brightness pulse whenever `value` changes, and never on first
// mount (a fresh page load isn't a "change"). Uses the `key`-remount trick:
// bumping `pulseKey` forces a fresh motion.span whose initial->animate
// tween replays every time, without needing to re-trigger `animate` on an
// already-mounted element. Purely presentational — never touches the
// coin/streak/level value itself.
export default function ValuePulse({ value, children }: { value: number | string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [pulseKey, setPulseKey] = useState(0);
  const prevRef = useRef(value);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = value;
      return;
    }
    if (prevRef.current !== value) {
      prevRef.current = value;
      setPulseKey((k) => k + 1);
    }
  }, [value]);

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.span
      key={pulseKey}
      initial={pulseKey === 0 ? false : { scale: 1, filter: "brightness(1)" }}
      animate={
        pulseKey === 0
          ? undefined
          : { scale: [1, 1.18, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="inline-flex items-center gap-1"
    >
      {children}
    </motion.span>
  );
}
