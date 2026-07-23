/**
 * Mission 6 Part 7/10 — app-level accessibility preferences that go
 * beyond what the OS/browser already exposes (prefers-reduced-motion is
 * OS-controlled and read-only from JS; this lets a player force the same
 * effect even when their OS setting is off, e.g. a shared church tablet
 * where nobody has touched OS accessibility settings).
 *
 * KNOWN LIMITATION: the existing ~44 components that call framer-motion's
 * own useReducedMotion() directly still only see the OS-level signal —
 * retrofitting all of them to also check this override is a mechanical
 * change across many gameplay-adjacent files, out of scope for a single
 * polish pass per "do not redesign gameplay." New/touched components in
 * this mission (Confetti) use useAppReducedMotion() below instead.
 */
import { useEffect, useState } from "react";
import { useReducedMotion as useOSReducedMotion } from "framer-motion";

const REDUCED_MOTION_KEY = "menorah-bible-quiz-reduced-motion-override";
const HIGH_CONTRAST_KEY = "menorah-bible-quiz-high-contrast";

function isBrowser() {
  return typeof window !== "undefined";
}

export function isReducedMotionOverride(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(REDUCED_MOTION_KEY) === "1";
  } catch {
    return false;
  }
}

export function isHighContrastEnabled(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(HIGH_CONTRAST_KEY) === "1";
  } catch {
    return false;
  }
}

export function applyPreferenceClasses(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("force-reduced-motion", isReducedMotionOverride());
  document.documentElement.classList.toggle("high-contrast", isHighContrastEnabled());
}

export function setReducedMotionOverride(enabled: boolean): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(REDUCED_MOTION_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
  applyPreferenceClasses();
}

export function setHighContrastEnabled(enabled: boolean): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(HIGH_CONTRAST_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
  applyPreferenceClasses();
}

/** Combines the OS-level signal framer-motion already reads with this
 * app's manual override — prefer this over framer-motion's own
 * useReducedMotion() in any new component. */
export function useAppReducedMotion(): boolean {
  const osPrefers = useOSReducedMotion();
  const [override, setOverride] = useState(false);
  useEffect(() => {
    setOverride(isReducedMotionOverride());
  }, []);
  return Boolean(osPrefers) || override;
}
