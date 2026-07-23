import type { CategoryId } from "@/lib/categories";
import type { Difficulty } from "./types";

/**
 * Shared between Solo Play (loadQuestionsForGame.ts) and Friends Battle
 * (friendsBattle/localQuestions.ts) — both merge Supabase-published
 * question_translations rows (raw, free-form `category`/`difficulty` text)
 * into the same local `Question` shape, so the mapping only lives once.
 */
const DATABASE_CATEGORY_BY_GAME_CATEGORY: Record<CategoryId, string[]> = {
  "old-testament": ["Old Testament", "old-testament"],
  "new-testament": ["New Testament", "new-testament"],
  "life-of-jesus": ["Life of Jesus", "life-of-jesus"],
  apostles: ["Apostles", "apostles"],
  "bible-characters": ["Bible Characters", "bible-characters"],
  "youth-challenge": ["Youth Challenge", "youth-challenge"],
  "psalms-proverbs": ["Psalms & Proverbs", "Psalms and Proverbs", "psalms-proverbs"],
  "faith-prayer": ["Faith & Prayer", "Faith and Prayer", "faith-prayer"],
  "gospel-challenge": ["Gospel Challenge", "gospel-challenge"],
  "hard-questions": ["Hard Questions", "hard-questions"],
};

function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryMatches(databaseCategory: string, categoryId: CategoryId): boolean {
  const normalizedDatabaseCategory = normalizeCategory(databaseCategory);
  return DATABASE_CATEGORY_BY_GAME_CATEGORY[categoryId].some(
    (acceptedValue) => normalizeCategory(acceptedValue) === normalizedDatabaseCategory
  );
}

/** Best-effort reverse lookup for contexts (Friends Battle) that don't
 * filter by category and just need *some* valid CategoryId for the shared
 * `Question` type. Falls back to "old-testament" for a database category
 * that matches none of the known game categories (e.g. free-form AI
 * Factory categories) — never surfaced to the player, purely a type-shape
 * requirement. */
export function categoryIdForDatabaseCategory(databaseCategory: string): CategoryId {
  const normalized = normalizeCategory(databaseCategory);
  const match = (Object.keys(DATABASE_CATEGORY_BY_GAME_CATEGORY) as CategoryId[]).find((categoryId) =>
    DATABASE_CATEGORY_BY_GAME_CATEGORY[categoryId].some((accepted) => normalizeCategory(accepted) === normalized)
  );
  return match ?? "old-testament";
}

export function mapDifficulty(value: string): Difficulty {
  const normalized = value.trim().toLowerCase();

  if (normalized === "hard" || normalized === "hard-plus" || normalized === "expert" || normalized === "master" || normalized === "scholar") {
    return "Hard";
  }

  if (normalized === "medium" || normalized === "medium-plus") {
    return "Medium";
  }

  return "Easy";
}
