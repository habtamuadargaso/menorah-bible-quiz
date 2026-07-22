import type { BibleQuestion } from "@/lib/questions/types";

export type ReviewStatus = "draft" | "needs-review" | "approved" | "published" | "rejected" | "archived";

export interface ReviewRecord {
  status: ReviewStatus;
  reviewer: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

/** Server-side-only overlay a human admin applies on top of a canonical
 * question: review workflow state plus any content edits made through the
 * dashboard. Keyed by BibleQuestion.id. Never touches the canonical
 * TypeScript source files (lib/questions/*) — see lib/admin/reviewStore.ts
 * for the full rationale. */
export interface QuestionOverlay {
  review: ReviewRecord;
  /** Partial edits applied on top of the canonical question. Only fields
   * an admin has actually changed are present. */
  edits: Partial<
    Pick<BibleQuestion, "level" | "difficulty" | "category" | "canonicalCategory" | "book" | "reference" | "tags" | "correctIndex">
  > & {
    translations?: BibleQuestion["translations"];
  };
  history: Array<{ at: string; reviewer: string | null; action: string; detail?: string }>;
}

export type AdminReviewStateFile = Record<string, QuestionOverlay>;

/** Which editorial store a question's row actually lives in — the curated
 * canonical bank (lib/questions/*) or an admin_imported_questions row.
 * Mission 9: shown as a "Source" badge in the Question Bank. */
export type EditorialSourceType = "canonical" | "imported";

/** Whether (and where) an editorial question has been published to
 * public.questions via the Mission 9 editorial-to-live bridge. */
export interface LivePublicationStatus {
  isLive: boolean;
  liveQuestionId: string | null;
  /** public.questions.status for the live row, if one exists. In practice
   * this is always 'published' — the bridge only ever creates rows with
   * that status — but it's read straight from the DB rather than assumed,
   * so a future direct edit to that row is reflected here too. */
  liveStatus: string | null;
}

/** A canonical question with its overlay merged in — what the admin UI
 * actually reads and displays. */
export interface AdminQuestionView extends BibleQuestion {
  review: ReviewRecord;
  history: QuestionOverlay["history"];
  hasEdits: boolean;
  validation: {
    errorCount: number;
    warningCount: number;
    messages: string[];
  };
  sourceType: EditorialSourceType;
  live: LivePublicationStatus;
}

/** Per-question result of an editorial-to-live publish attempt (single or
 * bulk) — Mission 9 requirement 6: bulk publish must return per-item
 * outcomes, not just an aggregate success/failure. */
export type PublishOutcome = "published" | "already_live" | "skipped_duplicate" | "ineligible" | "failed";

export interface PublishResult {
  questionId: string;
  outcome: PublishOutcome;
  detail?: string;
  liveQuestionId?: string;
}

export interface AdminSettings {
  supportedLanguages: string[];
  translationDefaults: {
    defaultTargetLanguage: string;
  };
  generationDefaults: {
    defaultDifficulty: string;
    defaultCategory: string;
    defaultLevel: number;
  };
  validatorOptions: {
    treatDuplicateWordingAsError: boolean;
  };
  reviewWorkflow: {
    requireReasonOnReject: boolean;
    allowSelfApprove: boolean;
  };
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  supportedLanguages: ["en", "am"],
  translationDefaults: { defaultTargetLanguage: "am" },
  generationDefaults: { defaultDifficulty: "easy", defaultCategory: "Old Testament", defaultLevel: 1 },
  validatorOptions: { treatDuplicateWordingAsError: false },
  reviewWorkflow: { requireReasonOnReject: true, allowSelfApprove: false },
};
