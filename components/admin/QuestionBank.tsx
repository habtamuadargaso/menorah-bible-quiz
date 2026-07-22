"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CANONICAL_CATEGORIES, BIBLE_BOOKS } from "@/lib/questions/canon";
import type { AdminQuestionView } from "@/lib/admin/types";
import type { BibleQuestion } from "@/lib/questions/types";
import QuestionReviewPanel from "./QuestionReviewPanel";

/** The subset of bulk actions Undo Last Bulk Action can reverse — every
 * action that changes review status or removes a question. "add-tag" and
 * "set-category" intentionally don't produce a snapshot (see runBulk). */
const UNDOABLE_ACTIONS = new Set(["approve", "reject", "needs-review", "archive", "publish", "delete"]);

type ReviewSnapshotEntry = {
  questionId: string;
  status: AdminQuestionView["review"]["status"];
  reviewer: string | null;
  reviewedAt: string | null;
  reason: string | null;
};

type LastBulkAction = {
  label: string;
  snapshot: ReviewSnapshotEntry[];
  /** Only set for a "delete" action — the full question payloads needed
   * to recreate rows an undo has to bring back, not just their review
   * status. */
  deletedQuestions?: BibleQuestion[];
};

/** Strips the admin-view-only fields (review/history/hasEdits/validation)
 * off an AdminQuestionView so it can be stored back as a plain
 * BibleQuestion payload — used when undoing a delete. */
function toStoredQuestion(q: AdminQuestionView): BibleQuestion {
  const { review: _review, history: _history, hasEdits: _hasEdits, validation: _validation, ...question } = q;
  return question;
}

interface PageResponse {
  items: AdminQuestionView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const REVIEW_STATUSES = ["draft", "needs-review", "approved", "published", "rejected", "archived"];
const DIFFICULTY_TIERS = ["Easy", "Medium", "Hard"];

const EMPTY_FILTERS = {
  search: "",
  language: "",
  book: "",
  testament: "",
  level: "",
  difficulty: "",
  category: "",
  reviewStatus: "",
  hasExplanation: false,
  missingTranslations: false,
};

export default function QuestionBank({
  secret,
  reviewer,
  presetReviewStatus,
  title,
}: {
  secret: string;
  reviewer: string;
  presetReviewStatus?: string;
  title: string;
}) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, reviewStatus: presetReviewStatus ?? "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [lastBulkAction, setLastBulkAction] = useState<LastBulkAction | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.language) params.set("language", filters.language);
    if (filters.book) params.set("book", filters.book);
    if (filters.testament) params.set("testament", filters.testament);
    if (filters.level) params.set("level", filters.level);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.category) params.set("category", filters.category);
    if (filters.reviewStatus) params.set("reviewStatus", filters.reviewStatus);
    if (filters.hasExplanation) params.set("hasExplanation", "true");
    if (filters.missingTranslations) params.set("missingTranslations", "true");
    params.set("page", String(page));
    params.set("pageSize", "25");
    return params.toString();
  }, [filters, page]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminFetch<PageResponse>(secret, `/api/admin/questions?${queryString}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load questions."))
      .finally(() => setLoading(false));
  }, [secret, queryString]);

  useEffect(() => {
    load();
  }, [load]);

  function updateFilter(key: keyof typeof filters, value: string | boolean) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected(new Set());
  }

  function resetFilters() {
    setFilters({ ...EMPTY_FILTERS, reviewStatus: presetReviewStatus ?? "" });
    setPage(1);
    setSelected(new Set());
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data) return;
    setSelected((prev) => {
      if (data.items.every((q) => prev.has(q.id))) return new Set();
      return new Set(data.items.map((q) => q.id));
    });
  }

  function selectAllOnPage() {
    if (!data) return;
    setSelected(new Set(data.items.map((q) => q.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  /** Runs a bulk action against an explicit id list (not always `selected`
   * — "Approve All on Page" bypasses selection entirely). For any action
   * in UNDOABLE_ACTIONS, captures a snapshot of each affected question's
   * current review state (and, for "delete", its full content) from the
   * already-loaded page data BEFORE the request goes out, so Undo Last
   * Bulk Action has something to restore. */
  async function runBulk(action: string, ids: string[], extra?: { tag?: string; category?: string; reason?: string }, label?: string) {
    if (ids.length === 0) return;
    setBulkBusy(true);
    setBulkMessage(null);
    setError(null);

    const affectedRows = data?.items.filter((q) => ids.includes(q.id)) ?? [];
    const snapshot: ReviewSnapshotEntry[] = affectedRows.map((q) => ({
      questionId: q.id,
      status: q.review.status,
      reviewer: q.review.reviewer,
      reviewedAt: q.review.reviewedAt,
      reason: q.review.reason,
    }));
    const deletedQuestions = action === "delete" ? affectedRows.map(toStoredQuestion) : undefined;

    try {
      const result = await adminFetch<{ deleted?: string[]; skipped?: string[]; published?: string[] }>(secret, "/api/admin/bulk", {
        method: "POST",
        body: JSON.stringify({ action, questionIds: ids, reviewer, ...extra }),
      });

      if (label && UNDOABLE_ACTIONS.has(action) && snapshot.length > 0) {
        const affectedIds = new Set(action === "delete" ? result.deleted ?? [] : action === "publish" ? result.published ?? [] : ids);
        const relevantSnapshot = snapshot.filter((s) => affectedIds.has(s.questionId));
        if (relevantSnapshot.length > 0) {
          setLastBulkAction({
            label,
            snapshot: relevantSnapshot,
            deletedQuestions: action === "delete" ? (deletedQuestions ?? []).filter((q) => affectedIds.has(q.id)) : undefined,
          });
        }
      }

      if (action === "delete") {
        const skippedCount = result.skipped?.length ?? 0;
        setBulkMessage(
          `${result.deleted?.length ?? 0} question(s) deleted.` +
            (skippedCount > 0 ? ` ${skippedCount} skipped — not AI-imported drafts (the canonical bank is never deleted here).` : "")
        );
      } else if (action === "publish") {
        const skippedCount = result.skipped?.length ?? 0;
        setBulkMessage(
          `${result.published?.length ?? 0} question(s) published.` +
            (skippedCount > 0 ? ` ${skippedCount} skipped — only "approved" questions can be published.` : "")
        );
      }

      setSelected(new Set());
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  function approveAllOnPage() {
    if (!data || data.items.length === 0) return;
    if (!window.confirm(`Approve all ${data.items.length} question(s) on this page?`)) return;
    runBulk(
      "approve",
      data.items.map((q) => q.id),
      undefined,
      `Approve all on page (${data.items.length})`
    );
  }

  function publishApprovedSelected() {
    if (selected.size === 0) return;
    runBulk("publish", Array.from(selected), undefined, `Publish approved (${selected.size} selected)`);
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    const reason = window.prompt(
      `Reason for permanently deleting ${selected.size} question(s)?\n\nThis only removes AI-imported drafts — any selected canonical questions are skipped, never deleted.`
    );
    if (!reason?.trim()) return;
    if (!window.confirm(`Permanently delete ${selected.size} question(s)? You can reverse this immediately after with "Undo Last Bulk Action."`)) {
      return;
    }
    runBulk("delete", Array.from(selected), { reason: reason.trim() }, `Delete selected (${selected.size} selected)`);
  }

  async function undoLastBulkAction() {
    if (!lastBulkAction) return;
    setUndoBusy(true);
    setError(null);
    try {
      await adminFetch(secret, "/api/admin/bulk", {
        method: "POST",
        body: JSON.stringify({
          action: "restore",
          reviewer,
          items: lastBulkAction.snapshot,
          deletedQuestions: lastBulkAction.deletedQuestions,
        }),
      });
      setBulkMessage(`Undid: ${lastBulkAction.label}`);
      setLastBulkAction(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Undo failed.");
    } finally {
      setUndoBusy(false);
    }
  }

  function exportSelected() {
    if (!data) return;
    const rows = data.items.filter((q) => selected.has(q.id));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-questions.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const uniqueBooks = BIBLE_BOOKS.map((b) => b.book);

  return (
    <div>
      <h1 className="text-3xl font-black">{title}</h1>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search question, ID, reference, tags…"
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm lg:col-span-2"
          />
          <select value={filters.language} onChange={(e) => updateFilter("language", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any language</option>
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
          <select value={filters.book} onChange={(e) => updateFilter("book", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any book</option>
            {uniqueBooks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select value={filters.testament} onChange={(e) => updateFilter("testament", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any testament</option>
            <option value="old">Old Testament</option>
            <option value="new">New Testament</option>
          </select>
          <select value={filters.level} onChange={(e) => updateFilter("level", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any level</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
          <select value={filters.difficulty} onChange={(e) => updateFilter("difficulty", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any difficulty</option>
            {DIFFICULTY_TIERS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any category</option>
            {CANONICAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={filters.reviewStatus} onChange={(e) => updateFilter("reviewStatus", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any review status</option>
            {REVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={filters.hasExplanation} onChange={(e) => updateFilter("hasExplanation", e.target.checked)} />
            Has explanation
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={filters.missingTranslations} onChange={(e) => updateFilter("missingTranslations", e.target.checked)} />
            Missing translations
          </label>
          <button onClick={resetFilters} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold">
            Reset Filters
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <button onClick={selectAllOnPage} disabled={!data || data.items.length === 0} className="rounded-full border border-white/20 px-3 py-1.5 font-semibold disabled:opacity-40">
          Select All
        </button>
        {selected.size > 0 && (
          <button onClick={clearSelection} className="rounded-full border border-white/20 px-3 py-1.5 font-semibold">
            Clear selection
          </button>
        )}
        <button
          disabled={bulkBusy || !data || data.items.length === 0}
          onClick={approveAllOnPage}
          className="rounded-full bg-emerald-500/80 px-3 py-1.5 font-semibold text-slate-950 disabled:opacity-40"
        >
          Approve All on Page
        </button>
        {lastBulkAction && (
          <button
            disabled={undoBusy}
            onClick={undoLastBulkAction}
            className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 font-semibold text-sky-300 disabled:opacity-50"
            title={`Reverses: ${lastBulkAction.label}`}
          >
            {undoBusy ? "Undoing…" : `↺ Undo Last Bulk Action (${lastBulkAction.label})`}
          </button>
        )}
      </div>

      {bulkMessage && <p className="mt-2 text-sm text-slate-400">{bulkMessage}</p>}

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
          <span className="font-bold text-amber-300">{selected.size} selected</span>
          <button
            disabled={bulkBusy}
            onClick={() => runBulk("approve", Array.from(selected), undefined, `Approve selected (${selected.size})`)}
            className="rounded-full bg-emerald-500/80 px-3 py-1.5 font-semibold text-slate-950"
          >
            Approve selected
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              const reason = window.prompt("Reason for rejecting the selected questions:");
              if (reason?.trim()) runBulk("reject", Array.from(selected), { reason }, `Reject selected (${selected.size})`);
            }}
            className="rounded-full bg-red-500/80 px-3 py-1.5 font-semibold text-white"
          >
            Reject selected
          </button>
          <button
            disabled={bulkBusy}
            onClick={publishApprovedSelected}
            title="Only questions currently in 'approved' status will be published — anything else selected is skipped."
            className="rounded-full bg-sky-500/80 px-3 py-1.5 font-semibold text-slate-950"
          >
            Publish Approved
          </button>
          <button disabled={bulkBusy} onClick={() => runBulk("needs-review", Array.from(selected), undefined, `Needs Review (${selected.size})`)} className="rounded-full bg-amber-500/80 px-3 py-1.5 font-semibold text-slate-950">
            Needs Review
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              const tag = window.prompt("Tag to add:");
              if (tag?.trim()) runBulk("add-tag", Array.from(selected), { tag });
            }}
            className="rounded-full border border-white/20 px-3 py-1.5 font-semibold"
          >
            Add tag
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              const category = window.prompt(`Category (${CANONICAL_CATEGORIES.join(", ")}):`);
              if (category?.trim()) runBulk("set-category", Array.from(selected), { category });
            }}
            className="rounded-full border border-white/20 px-3 py-1.5 font-semibold"
          >
            Change category
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              if (window.confirm(`Archive ${selected.size} question(s)? This can be undone later by changing their status again.`)) {
                runBulk("archive", Array.from(selected), undefined, `Archive (${selected.size})`);
              }
            }}
            className="rounded-full border border-white/20 px-3 py-1.5 font-semibold"
          >
            Archive
          </button>
          <button
            disabled={bulkBusy}
            onClick={deleteSelected}
            title="Only removes AI-imported drafts — canonical questions in the selection are skipped, never deleted."
            className="rounded-full border border-red-400/50 bg-red-500/20 px-3 py-1.5 font-semibold text-red-300"
          >
            Delete Selected
          </button>
          <button onClick={exportSelected} className="rounded-full border border-white/20 px-3 py-1.5 font-semibold">
            Export selected
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <ErrorBanner message={`Couldn't load questions: ${error}`} onRetry={load} />
        </div>
      )}
      {loading && (
        <div className="mt-4">
          <SkeletonTable rows={8} columns={9} />
        </div>
      )}

      {data && !loading && (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="p-3">
                    <input type="checkbox" checked={data.items.length > 0 && data.items.every((q) => selected.has(q.id))} onChange={toggleSelectAll} />
                  </th>
                  <th className="p-3">ID</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Book / Ref</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Languages</th>
                  <th className="p-3">Review</th>
                  <th className="p-3">Validation</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((q) => (
                  <tr key={q.id} className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]" onClick={() => setOpenQuestionId(q.id)}>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelected(q.id)} />
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400">{q.id}</td>
                    <td className="max-w-xs truncate p-3">{q.translations.en?.question ?? q.translations.am?.question ?? "—"}</td>
                    <td className="p-3 text-slate-400">
                      {q.book}
                      <div className="text-xs">{q.reference}</div>
                    </td>
                    <td className="p-3">{q.level}</td>
                    <td className="p-3">{q.difficulty}</td>
                    <td className="p-3">{q.canonicalCategory}</td>
                    <td className="p-3">{Object.keys(q.translations).join(", ") || "—"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{q.review.status}</span>
                    </td>
                    <td className="p-3">
                      {q.validation.errorCount > 0 ? (
                        <span className="text-red-300">{q.validation.errorCount} err</span>
                      ) : q.validation.warningCount > 0 ? (
                        <span className="text-amber-300">{q.validation.warningCount} warn</span>
                      ) : (
                        <span className="text-emerald-300">clean</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-500">
                      No questions match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <span>
              {data.total} question(s) — page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-full border border-white/15 px-3 py-1 disabled:opacity-40">
                ← Prev
              </button>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} className="rounded-full border border-white/15 px-3 py-1 disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {openQuestionId && (
        <QuestionReviewPanel
          secret={secret}
          reviewer={reviewer}
          questionId={openQuestionId}
          onClose={() => setOpenQuestionId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
