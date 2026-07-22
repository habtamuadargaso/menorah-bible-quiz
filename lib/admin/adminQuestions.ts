import { getCanonicalQuestionStore } from "@/lib/questions/store";
import { validateQuestionBank, type ValidationIssue } from "@/lib/questions/validate";
import { normalizeDifficultyTier } from "@/lib/questions/canon";
import type { BibleQuestion, SupportedQuestionLanguage } from "@/lib/questions/types";
import { loadImportedQuestions, loadReviewState } from "./reviewStore";
import type { AdminQuestionView, QuestionOverlay, ReviewStatus } from "./types";

/** Applies a QuestionOverlay's edits on top of a canonical BibleQuestion.
 * The canonical arrays in lib/questions/* are never mutated — this always
 * produces a new object. */
function applyOverlay(base: BibleQuestion, overlay: QuestionOverlay): BibleQuestion {
  return {
    ...base,
    ...overlay.edits,
    translations: overlay.edits.translations
      ? { ...base.translations, ...overlay.edits.translations }
      : base.translations,
  };
}

export interface AdminQuestionFilters {
  search?: string;
  language?: SupportedQuestionLanguage;
  book?: string;
  testament?: "old" | "new";
  level?: number;
  difficulty?: "Easy" | "Medium" | "Hard";
  category?: string;
  reviewStatus?: ReviewStatus;
  translationStatusLanguage?: SupportedQuestionLanguage;
  translationStatus?: "complete" | "machine" | "missing";
  hasExplanation?: boolean;
  missingTranslations?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminQuestionPage {
  items: AdminQuestionView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function matchesSearch(q: BibleQuestion, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  if (q.id.toLowerCase().includes(needle)) return true;
  if (q.reference.toLowerCase().includes(needle)) return true;
  if (q.tags.some((t) => t.toLowerCase().includes(needle))) return true;
  for (const translation of Object.values(q.translations)) {
    if (translation?.question.toLowerCase().includes(needle)) return true;
  }
  return false;
}

/** Builds the full admin view of every canonical question once per
 * request: merges review overlays, runs the validator a single time over
 * the whole store (not per-question — validator output is grouped by id
 * afterward), so filtering/pagination is cheap in-memory work. */
export async function getAllAdminQuestions(): Promise<AdminQuestionView[]> {
  const imported = await loadImportedQuestions();
  const canonical = [...getCanonicalQuestionStore(), ...imported];
  const overlayState = await loadReviewState();
  const report = validateQuestionBank(canonical);

  const issuesByQuestion = new Map<string, ValidationIssue[]>();
  for (const issue of report.issues) {
    if (!issuesByQuestion.has(issue.questionId)) issuesByQuestion.set(issue.questionId, []);
    issuesByQuestion.get(issue.questionId)!.push(issue);
  }

  return canonical.map((base) => {
    const overlay = overlayState[base.id];
    const merged = overlay ? applyOverlay(base, overlay) : base;
    const issues = issuesByQuestion.get(base.id) ?? [];
    return {
      ...merged,
      review: overlay?.review ?? { status: "draft", reviewer: null, reviewedAt: null, reason: null },
      history: overlay?.history ?? [],
      hasEdits: Boolean(overlay && Object.keys(overlay.edits).length > 0),
      validation: {
        errorCount: issues.filter((i) => i.severity === "error").length,
        warningCount: issues.filter((i) => i.severity === "warning").length,
        messages: issues.map((i) => `[${i.severity}] ${i.code}: ${i.message}`),
      },
    };
  });
}

export async function getAdminQuestionById(id: string): Promise<AdminQuestionView | null> {
  const all = await getAllAdminQuestions();
  return all.find((q) => q.id === id) ?? null;
}

export async function queryAdminQuestions(filters: AdminQuestionFilters): Promise<AdminQuestionPage> {
  const all = await getAllAdminQuestions();

  const filtered = all.filter((q) => {
    if (filters.search && !matchesSearch(q, filters.search)) return false;
    if (filters.language && !q.translations[filters.language]) return false;
    if (filters.book && q.book !== filters.book) return false;
    if (filters.testament && q.testament !== filters.testament) return false;
    if (filters.level && q.level !== filters.level) return false;
    if (filters.difficulty && normalizeDifficultyTier(q.difficulty) !== filters.difficulty) return false;
    if (filters.category && q.canonicalCategory !== filters.category) return false;
    if (filters.reviewStatus && q.review.status !== filters.reviewStatus) return false;
    if (filters.hasExplanation === true) {
      const hasAny = Object.values(q.translations).some((t) => t && t.explanation.trim().length > 0);
      if (!hasAny) return false;
    }
    if (filters.missingTranslations === true) {
      const languageCount = Object.keys(q.translations).length;
      if (languageCount >= 2) return false; // en + am is "complete enough" for this app today
    }
    if (filters.translationStatusLanguage && filters.translationStatus) {
      const actual = q.translationStatus[filters.translationStatusLanguage] ?? "missing";
      if (actual !== filters.translationStatus) return false;
    }
    return true;
  });

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export interface DuplicateGroup {
  reason: "same-reference" | "normalized-wording" | "similar-wording";
  language: SupportedQuestionLanguage;
  questionIds: string[];
  sample: string;
}

function normalizeWording(text: string): string {
  return text.trim().toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}

/** Levenshtein-free "similar wording" heuristic: shares a large fraction
 * of its normalized words with another question. Cheap, no external
 * dependency, good enough to flag candidates for a human to look at —
 * this never merges anything automatically (Part 14). */
function wordOverlapRatio(a: string, b: string): number {
  const wordsA = new Set(normalizeWording(a).split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(normalizeWording(b).split(" ").filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared += 1;
  return shared / Math.min(wordsA.size, wordsB.size);
}

export async function findDuplicateCandidates(): Promise<DuplicateGroup[]> {
  const all = await getAllAdminQuestions();
  const groups: DuplicateGroup[] = [];

  // Same Bible reference, same level — a common sign of an accidental
  // near-duplicate question about the exact same verse.
  const byReference = new Map<string, AdminQuestionView[]>();
  for (const q of all) {
    const key = `${q.reference}`;
    if (!byReference.has(key)) byReference.set(key, []);
    byReference.get(key)!.push(q);
  }
  for (const [reference, group] of byReference) {
    if (group.length > 1) {
      groups.push({
        reason: "same-reference",
        language: "en",
        questionIds: group.map((q) => q.id),
        sample: reference,
      });
    }
  }

  // Normalized-identical wording (already an error in the validator, but
  // surfaced here too grouped for review convenience).
  for (const lang of ["en", "am"] as SupportedQuestionLanguage[]) {
    const byWording = new Map<string, AdminQuestionView[]>();
    for (const q of all) {
      const t = q.translations[lang];
      if (!t) continue;
      const key = normalizeWording(t.question);
      if (!byWording.has(key)) byWording.set(key, []);
      byWording.get(key)!.push(q);
    }
    for (const [wording, group] of byWording) {
      if (group.length > 1) {
        groups.push({
          reason: "normalized-wording",
          language: lang,
          questionIds: group.map((q) => q.id),
          sample: wording,
        });
      }
    }
  }

  // Similar (not identical) wording — high word overlap between two
  // different questions, worth a human glance even though not an error.
  const enQuestions = all.filter((q) => q.translations.en);
  for (let i = 0; i < enQuestions.length; i += 1) {
    for (let j = i + 1; j < enQuestions.length; j += 1) {
      const a = enQuestions[i];
      const b = enQuestions[j];
      if (a.id === b.id) continue;
      const ratio = wordOverlapRatio(a.translations.en!.question, b.translations.en!.question);
      if (ratio >= 0.7) {
        groups.push({
          reason: "similar-wording",
          language: "en",
          questionIds: [a.id, b.id],
          sample: `${a.translations.en!.question} <-> ${b.translations.en!.question}`,
        });
      }
    }
  }

  return groups;
}
