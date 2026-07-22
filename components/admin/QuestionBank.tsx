"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CANONICAL_CATEGORIES, BIBLE_BOOKS } from "@/lib/questions/canon";
import type { AdminQuestionView } from "@/lib/admin/types";
import QuestionReviewPanel from "./QuestionReviewPanel";

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

  async function runBulk(action: string, extra?: { tag?: string; category?: string; reason?: string }) {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await adminFetch(secret, "/api/admin/bulk", {
        method: "POST",
        body: JSON.stringify({ action, questionIds: Array.from(selected), reviewer, ...extra }),
      });
      setSelected(new Set());
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed.");
    } finally {
      setBulkBusy(false);
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

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
          <span className="font-bold text-amber-300">{selected.size} selected</span>
          <button disabled={bulkBusy} onClick={() => runBulk("approve")} className="rounded-full bg-emerald-500/80 px-3 py-1.5 font-semibold text-slate-950">
            Approve selected
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              const reason = window.prompt("Reason for rejecting the selected questions:");
              if (reason?.trim()) runBulk("reject", { reason });
            }}
            className="rounded-full bg-red-500/80 px-3 py-1.5 font-semibold text-white"
          >
            Reject selected
          </button>
          <button disabled={bulkBusy} onClick={() => runBulk("needs-review")} className="rounded-full bg-amber-500/80 px-3 py-1.5 font-semibold text-slate-950">
            Needs Review
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              const tag = window.prompt("Tag to add:");
              if (tag?.trim()) runBulk("add-tag", { tag });
            }}
            className="rounded-full border border-white/20 px-3 py-1.5 font-semibold"
          >
            Add tag
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              const category = window.prompt(`Category (${CANONICAL_CATEGORIES.join(", ")}):`);
              if (category?.trim()) runBulk("set-category", { category });
            }}
            className="rounded-full border border-white/20 px-3 py-1.5 font-semibold"
          >
            Change category
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => {
              if (window.confirm(`Archive ${selected.size} question(s)? This can be undone later by changing their status again.`)) {
                runBulk("archive");
              }
            }}
            className="rounded-full border border-white/20 px-3 py-1.5 font-semibold"
          >
            Archive
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
