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

/** Light tap — selection changes, toggles, tab switches. */
export function hapticSelection(): void {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
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
