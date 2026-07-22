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
