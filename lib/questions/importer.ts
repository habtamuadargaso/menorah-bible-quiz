import { getCanonicalQuestionStore } from "./store";
import { validateQuestionBank } from "./validate";
import type { BibleQuestion } from "./types";

export interface ImportRejection {
  index: number;
  input: unknown;
  errors: string[];
}

export interface ImportResult {
  accepted: BibleQuestion[];
  rejected: ImportRejection[];
}

function isBibleQuestionShape(value: unknown): value is BibleQuestion {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.level === "number" &&
    typeof v.category === "string" &&
    typeof v.canonicalCategory === "string" &&
    typeof v.book === "string" &&
    (v.testament === "old" || v.testament === "new") &&
    typeof v.difficulty === "string" &&
    typeof v.correctIndex === "number" &&
    typeof v.reference === "string" &&
    Array.isArray(v.tags) &&
    typeof v.verified === "boolean" &&
    typeof v.translations === "object" &&
    v.translations !== null &&
    typeof v.translationStatus === "object" &&
    v.translationStatus !== null
  );
}

/**
 * Part 8's importer. Designed for a future "drop a JSON file of new
 * questions in" workflow — nothing calls this automatically yet (see
 * Mission 5C's report for why AI-generated content specifically must
 * never be imported without a human setting verified=true first).
 *
 * Validates every candidate against the FULL existing bank (so duplicate
 * ids/wording against already-shipped questions are caught, not just
 * duplicates within the new batch) and only accepts candidates with zero
 * validation errors. Rejected candidates keep their original input plus
 * the exact reasons, so a human can fix and resubmit.
 */
export function importQuestions(candidates: unknown[], existing: BibleQuestion[] = getCanonicalQuestionStore()): ImportResult {
  const shapeRejected: ImportRejection[] = [];
  const shaped: Array<{ index: number; question: BibleQuestion }> = [];

  candidates.forEach((candidate, index) => {
    if (isBibleQuestionShape(candidate)) {
      shaped.push({ index, question: candidate });
    } else {
      shapeRejected.push({
        index,
        input: candidate,
        errors: ["Does not match the BibleQuestion shape (missing or mistyped required field) — see lib/questions/types.ts."],
      });
    }
  });

  const combined = [...existing, ...shaped.map((s) => s.question)];
  const report = validateQuestionBank(combined);

  const errorsByQuestionId = new Map<string, string[]>();
  for (const issue of report.issues) {
    if (issue.severity !== "error") continue;
    if (!errorsByQuestionId.has(issue.questionId)) errorsByQuestionId.set(issue.questionId, []);
    errorsByQuestionId.get(issue.questionId)!.push(issue.message);
  }

  const accepted: BibleQuestion[] = [];
  const rejected: ImportRejection[] = [...shapeRejected];

  for (const { index, question } of shaped) {
    const errors = errorsByQuestionId.get(question.id) ?? [];
    if (errors.length === 0) {
      accepted.push(question);
    } else {
      rejected.push({ index, input: question, errors });
    }
  }

  return { accepted, rejected };
}
