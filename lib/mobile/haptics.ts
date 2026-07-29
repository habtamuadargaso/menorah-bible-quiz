import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * Thin, safe-by-default wrapper around @capacitor/haptics: every function
 * is a no-op on the regular website (Capacitor.isNativePlatform() is false
 * in any ordinary browser tab, including this app's own PWA install), so
 * call sites don't need their own native-platform guard, and a haptics
 * call can never throw or delay a UI interaction on the web. Errors from
 * the native call itself (e.g. a device with haptics disabled in system
 * settings) are swallowed the same way — feedback is enhancement, never a
 * dependency of the interaction it's attached to.
 */

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** A correct answer, a win, a level-up — anything worth celebrating. */
export function hapticSuccess(): void {
  if (!isNative()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

/** A wrong answer or a blocked action. */
export function hapticError(): void {
  if (!isNative()) return;
  Haptics.notification({ type: NotificationType.Error }).catch(() => {});
}

// Mission 17 — Light/Medium/Heavy/Warning taxonomy for general UI touch
// feedback (buttons, cards, nav, reward claims, level-complete), kept
// distinct from hapticSuccess/hapticError above (which back Friends
// Battle's reveal screen and stay untouched). Same no-op-on-web,
// swallow-errors guarantee as every other function in this file.

// Mission 20 — retuned mapping: Light now covers every everyday tap
// (button/card, a correct answer, claiming a reward), Medium is reserved
// for finishing a level, and Heavy is saved for a genuinely bigger moment
// (a new achievement/badge), so the heaviest feedback stays rare instead
// of firing on every quiz.

/** Lightest impact — a plain button/card tap, a correct answer, a reward claim. */
export function hapticLight(): void {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** A level finishing (pass or fail) — a firmer tap than routine feedback. */
export function hapticMedium(): void {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

/** A major achievement — e.g. a brand-new badge just unlocked. */
export function hapticHeavy(): void {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
}

/** A wrong answer. */
export function hapticWarning(): void {
  if (!isNative()) return;
  Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}
