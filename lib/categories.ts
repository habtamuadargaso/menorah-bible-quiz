export type CategoryId =
  | "old-testament"
  | "new-testament"
  | "life-of-jesus"
  | "apostles"
  | "bible-characters"
  | "youth-challenge"
  | "psalms-proverbs"
  | "faith-prayer"
  | "gospel-challenge"
  | "hard-questions";

export type IconName =
  | "scroll"
  | "cross"
  | "lamp"
  | "star"
  | "flame"
  | "book"
  | "crown"
  | "pray"
  | "fish"
  | "question";

export interface CategoryMeta {
  id: CategoryId;
  icon: IconName;
}

// Category titles/descriptions are translated per-language in
// lib/i18n/translations/*.ts (see t.categories[id]). This list only holds
// the language-independent identity (id + icon) so the display order and
// icon stay in sync across every language.
export const CATEGORIES: CategoryMeta[] = [
  { id: "old-testament", icon: "scroll" },
  { id: "new-testament", icon: "cross" },
  { id: "life-of-jesus", icon: "lamp" },
  { id: "apostles", icon: "fish" },
  { id: "bible-characters", icon: "star" },
  { id: "youth-challenge", icon: "crown" },
  { id: "psalms-proverbs", icon: "book" },
  { id: "faith-prayer", icon: "pray" },
  { id: "gospel-challenge", icon: "flame" },
  { id: "hard-questions", icon: "question" },
];
