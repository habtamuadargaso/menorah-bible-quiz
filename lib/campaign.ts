import type { CategoryId } from "@/lib/categories";

export const PASSING_CORRECT_ANSWERS = 7;
export const CAMPAIGN_STORAGE_KEY = "menorah-bible-quiz-campaign";

export type CampaignProgress = Partial<Record<CategoryId, number>>;

function normalizeLevel(value: unknown) {
  const n = typeof value === "number" ? value : 1;
  return Math.min(10, Math.max(1, Math.floor(n)));
}

export function hasPassedLevel(correct: number, total: number) {
  if (total <= 0) return false;
  return correct >= PASSING_CORRECT_ANSWERS;
}

export function loadCampaignProgress(): CampaignProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, normalizeLevel(value)])) as CampaignProgress;
  } catch {
    return {};
  }
}

export function getHighestUnlockedLevel(categoryId: CategoryId, progress = loadCampaignProgress()) {
  return normalizeLevel(progress[categoryId] ?? 1);
}

export function saveCampaignProgress(progress: CampaignProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage failures.
  }
}

export function unlockNextCampaignLevel(categoryId: CategoryId, completedLevel: number) {
  const progress = loadCampaignProgress();
  const currentUnlocked = getHighestUnlockedLevel(categoryId, progress);
  const nextUnlocked = Math.min(10, Math.max(currentUnlocked, completedLevel + 1));
  const next = { ...progress, [categoryId]: nextUnlocked };
  saveCampaignProgress(next);
  return next;
}
