import type { AdminQuestionView } from "./types";

/**
 * Mission 9 requirement 8: the Question Bank / Review Queue must clearly
 * distinguish "Approved but not live" from "Published / Live" — a
 * question can only be one or the other by construction (see
 * publish_editorial_question() in supabase/migrations/
 * 20260729_mission9_editorial_publish_bridge.sql: it flips
 * question_review_overlay.status to 'published' in the SAME transaction
 * as the live insert, so "published" without a live row can only mean the
 * publish itself failed after that overlay write somehow — treated here
 * as "Publish failed" rather than silently showing "Published"). Shared
 * by QuestionBank.tsx (the table) and QuestionReviewPanel.tsx (the detail
 * view) so the two can never drift out of sync with each other.
 */
export function reviewStatusLabel(q: Pick<AdminQuestionView, "review" | "live">): string {
  switch (q.review.status) {
    case "draft":
      return "Draft";
    case "needs-review":
      return "Needs review";
    case "approved":
      return "Approved (not live)";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    case "published":
      return q.live.isLive ? "Published / Live" : "Publish failed";
    default:
      return q.review.status;
  }
}

export type StatusTone = "good" | "bad" | "warn" | "neutral";

export function reviewStatusTone(q: Pick<AdminQuestionView, "review" | "live">): StatusTone {
  switch (q.review.status) {
    case "rejected":
      return "bad";
    case "needs-review":
      return "warn";
    case "published":
      return q.live.isLive ? "good" : "bad";
    default:
      return "neutral";
  }
}

/** Shared Tailwind classes for each tone — imported by both
 * QuestionBank.tsx (table badge) and QuestionReviewPanel.tsx (detail
 * badge) so the two never drift out of sync visually either. */
export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  good: "bg-emerald-500/20 text-emerald-300",
  bad: "bg-red-500/20 text-red-300",
  warn: "bg-amber-500/20 text-amber-300",
  neutral: "bg-white/10 text-slate-200",
};
