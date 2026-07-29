/**
 * Mission 21 — local-only persistence for the first-launch onboarding
 * flow. Everything here is a localStorage read/write, same safe-by-default
 * shape as lib/preferences.ts (every function is a no-op returning a safe
 * default when localStorage is unavailable, e.g. SSR or private browsing).
 *
 * Deliberately does NOT touch Supabase or the real auth profile — the
 * mission calls for "no Supabase schema changes unless absolutely
 * required," and none of this data (personal goal, reminder choice, the
 * lightweight avatar/name/country/church picked during onboarding) is
 * required by any existing gameplay system, so it stays local.
 */

const COMPLETE_KEY = "menorah-bible-quiz-onboarding-complete";
const GOAL_KEY = "menorah-bible-quiz-onboarding-goal";
const REMINDER_KEY = "menorah-bible-quiz-onboarding-reminder";
const PROFILE_KEY = "menorah-bible-quiz-onboarding-profile";

export type OnboardingGoal =
  | "study"
  | "church"
  | "compete"
  | "devotion"
  | "family"
  | "knowledge";

export interface OnboardingProfile {
  avatar: string;
  displayName: string;
  country: string;
  church: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function hasCompletedOnboarding(): boolean {
  if (!isBrowser()) return true;
  try {
    return window.localStorage.getItem(COMPLETE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingComplete(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(COMPLETE_KEY, "1");
  } catch {
    // ignore
  }
}

/** Used by Settings → About → "View Tutorial Again" to replay onboarding. */
export function resetOnboarding(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(COMPLETE_KEY);
  } catch {
    // ignore
  }
}

export function saveOnboardingGoal(goal: OnboardingGoal): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(GOAL_KEY, goal);
  } catch {
    // ignore
  }
}

export function getOnboardingGoal(): OnboardingGoal | null {
  if (!isBrowser()) return null;
  try {
    return (window.localStorage.getItem(GOAL_KEY) as OnboardingGoal | null) ?? null;
  } catch {
    return null;
  }
}

export function setDailyReminderChoice(enabled: boolean): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(REMINDER_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function getDailyReminderChoice(): boolean | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(REMINDER_KEY);
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

export function saveOnboardingProfile(profile: OnboardingProfile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function getOnboardingProfile(): OnboardingProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingProfile;
  } catch {
    return null;
  }
}
