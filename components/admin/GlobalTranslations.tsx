"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { makeToastId, ToastStack, type ToastMessage } from "@/components/ui/Toast";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import TranslationEditor from "./TranslationEditor";

type TranslationStatus = "missing" | "ai_draft" | "needs_review" | "approved" | "published" | "rejected" | "archived";

interface TranslationListItem {
  questionId: string;
  level: number;
  book: string;
  reference: string;
  category: string;
  sourceType: string | null;
  sourceLanguage: string;
  sourceText: string | null;
  targetLanguage: string;
  translation: {
    id: string | null;
    status: TranslationStatus;
    questionText: string | null;
    explanation: string | null;
    generatedAt: string | null;
    reviewedBy: string | null;
    publishedAt: string | null;
    rejectionReason: string | null;
    validation: "clean" | "incomplete" | "n/a";
  };
}

interface PageResponse {
  items: TranslationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface LanguageStatRow {
  code: string;
  englishName: string;
  total: number;
  ai_draft: number;
  needs_review: number;
  approved: number;
  published: number;
  rejected: number;
  archived: number;
  missing: number;
  completionPercent: number;
}

interface StatsResponse {
  totalPublishedQuestions: number;
  byLanguage: LanguageStatRow[];
  recentTranslationFailures: number;
}

const STATUS_LABEL: Record<TranslationStatus, string> = {
  missing: "Missing",
  ai_draft: "AI Draft",
  needs_review: "Needs Review",
  approved: "Approved (not live)",
  published: "Published / Live",
  rejected: "Rejected",
  archived: "Archived",
};

const STATUS_CLASS: Record<TranslationStatus, string> = {
  missing: "bg-white/10 text-slate-300",
  ai_draft: "bg-sky-500/20 text-sky-300",
  needs_review: "bg-amber-500/20 text-amber-300",
  approved: "bg-slate-500/20 text-slate-200",
  published: "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-red-500/20 text-red-300",
  archived: "bg-slate-700/40 text-slate-400",
};

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  canonical: { label: "Editorial", className: "bg-sky-500/20 text-sky-300" },
  imported: { label: "Imported", className: "bg-purple-500/20 text-purple-300" },
};

const STATUS_FILTERS: TranslationStatus[] = ["missing", "ai_draft", "needs_review", "approved", "published", "rejected", "archived"];

const EMPTY_FILTERS = { level: "", status: "", sourceType: "", search: "" };

export default function GlobalTranslations({ secret, reviewer }: { secret: string; reviewer: string }) {
  const targetLanguageOptions = LANGUAGES.filter((l) => l.code !== "en");
  const [targetLanguage, setTargetLanguage] = useState(targetLanguageOptions[0]?.code ?? "am");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  const pushToast = useCallback((type: ToastMessage["type"], text: string) => {
    setToasts((prev) => [...prev, { id: makeToastId(), type, text }]);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("targetLanguage", targetLanguage);
    if (filters.level) params.set("level", filters.level);
    if (filters.status) params.set("status", filters.status);
    if (filters.sourceType) params.set("sourceType", filters.sourceType);
    if (filters.search) params.set("search", filters.search);
    params.set("page", String(page));
    params.set("pageSize", "25");
    return params.toString();
  }, [targetLanguage, filters, page]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminFetch<PageResponse>(secret, `/api/admin/translations?${queryString}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load translations."))
      .finally(() => setLoading(false));
  }, [secret, queryString]);

  const loadStats = useCallback(() => {
    adminFetch<StatsResponse>(secret, "/api/admin/translations/stats")
      .then(setStats)
      .catch(() => setStats(null));
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected(new Set());
  }

  function changeTargetLanguage(code: LangCode) {
    setTargetLanguage(code);
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
    setSelected((prev) => (data.items.every((i) => prev.has(i.questionId)) ? new Set() : new Set(data.items.map((i) => i.questionId))));
  }

  function refreshAfterAction() {
    setSelected(new Set());
    load();
    loadStats();
  }

  function selectedTranslationIds(): string[] {
    if (!data) return [];
    return data.items.filter((i) => selected.has(i.questionId) && i.translation.id).map((i) => i.translation.id!);
  }

  async function runReviewAction(action: "approve" | "reject" | "publish" | "archive" | "regenerate", reason?: string) {
    const translationIds = selectedTranslationIds();
    if (translationIds.length === 0) {
      pushToast("error", "None of the selected rows have an existing translation to act on.");
      return;
    }
    setBulkBusy(action);
    try {
      const { results } = await adminFetch<{ results: Array<{ outcome: string }> }>(secret, "/api/admin/translations/review", {
        method: "POST",
        body: JSON.stringify({ action, translationIds, reviewer, reason }),
      });
      pushToast("success", summarizeOutcomes(results.map((r) => r.outcome)));
      refreshAfterAction();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBulkBusy(null);
    }
  }

  function approveSelected() {
    const count = selectedTranslationIds().length;
    if (count === 0) return;
    if (!window.confirm(`Approve ${count} translation(s)?`)) return;
    runReviewAction("approve");
  }

  function rejectSelected() {
    const count = selectedTranslationIds().length;
    if (count === 0) return;
    const reason = window.prompt(`Reason for rejecting ${count} translation(s):`);
    if (!reason?.trim()) return;
    runReviewAction("reject", reason.trim());
  }

  function publishSelected() {
    const count = selectedTranslationIds().length;
    if (count === 0) return;
    if (!window.confirm(`Publish ${count} translation(s)? Only ones currently "approved" qualify — they become visible to real players immediately.`)) return;
    runReviewAction("publish");
  }

  function archiveSelected() {
    const count = selectedTranslationIds().length;
    if (count === 0) return;
    if (!window.confirm(`Archive ${count} translation(s)? This removes any currently-live ones from gameplay.`)) return;
    runReviewAction("archive");
  }

  function regenerateSelected() {
    const count = selectedTranslationIds().length;
    if (count === 0) return;
    if (!window.confirm(`Regenerate ${count} translation(s) with AI? Published translations are always protected and will be skipped.`)) return;
    runReviewAction("regenerate");
  }

  async function translateSelected() {
    const questionIds = Array.from(selected);
    if (questionIds.length === 0) return;
    if (!window.confirm(`Generate AI translations for ${questionIds.length} question(s) into ${targetLanguageName()}?`)) return;
    await runGenerate(questionIds);
  }

  async function translateAllMissingOnPage() {
    if (!data) return;
    const missingIds = data.items.filter((i) => i.translation.status === "missing").map((i) => i.questionId);
    if (missingIds.length === 0) {
      pushToast("error", "Nothing missing on this page.");
      return;
    }
    if (!window.confirm(`Generate AI translations for all ${missingIds.length} missing question(s) on this page into ${targetLanguageName()}?`)) return;
    await runGenerate(missingIds);
  }

  async function runGenerate(questionIds: string[]) {
    setBulkBusy("generate");
    try {
      const { results } = await adminFetch<{ results: Array<{ outcome: string }> }>(secret, "/api/admin/translations/generate", {
        method: "POST",
        body: JSON.stringify({ questionIds, targetLanguages: [targetLanguage], reviewer }),
      });
      pushToast("success", summarizeOutcomes(results.map((r) => r.outcome)));
      refreshAfterAction();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBulkBusy(null);
    }
  }

  function targetLanguageName(): string {
    return LANGUAGES.find((l) => l.code === targetLanguage)?.englishName ?? targetLanguage;
  }

  const currentStatRow = stats?.byLanguage.find((l) => l.code === targetLanguage);

  return (
    <div>
      <h1 className="text-3xl font-black">🗣️ Global Translations</h1>
      <p className="mt-2 text-slate-400">
        Translate approved English questions into other languages — AI drafts require explicit human approval and publish before
        they ever reach a real player (mirrors the same rule the AI Question Factory follows). Separate from the Translation Center
        tab, which compares the editorial English/Amharic pool only.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="text-sm font-semibold text-slate-300">
          Target language
          <select
            value={targetLanguage}
            onChange={(e) => changeTargetLanguage(e.target.value as LangCode)}
            className="ml-2 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
          >
            {targetLanguageOptions.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.englishName})
              </option>
            ))}
          </select>
        </label>
        {currentStatRow && (
          <div className="flex flex-wrap gap-2 text-xs">
            <StatPill label="Published" value={currentStatRow.published} tone="good" />
            <StatPill label="Approved (not live)" value={currentStatRow.approved} />
            <StatPill label="Needs review" value={currentStatRow.needs_review} tone="warn" />
            <StatPill label="AI draft" value={currentStatRow.ai_draft} />
            <StatPill label="Rejected" value={currentStatRow.rejected} tone="bad" />
            <StatPill label="Missing" value={currentStatRow.missing} tone="warn" />
            <StatPill label="Completion" value={`${currentStatRow.completionPercent}%`} />
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search question, reference, id…"
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm md:col-span-2"
          />
          <select value={filters.level} onChange={(e) => updateFilter("level", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any level</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Any status</option>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            value={filters.sourceType}
            onChange={(e) => updateFilter("sourceType", e.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">Any source</option>
            <option value="ai-factory">AI Factory</option>
            <option value="canonical">Editorial</option>
            <option value="imported">Imported</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <button onClick={toggleSelectAll} disabled={!data || data.items.length === 0} className="rounded-full border border-white/20 px-3 py-1.5 font-semibold disabled:opacity-40">
          Select All
        </button>
        <span className="font-bold text-amber-300">{selected.size} selected</span>
        <button
          disabled={selected.size === 0 || bulkBusy !== null}
          onClick={translateSelected}
          className="rounded-full bg-sky-500/80 px-3 py-1.5 font-semibold text-slate-950 disabled:opacity-40"
        >
          {bulkBusy === "generate" ? "Translating…" : "Translate Selected"}
        </button>
        <button
          disabled={bulkBusy !== null || !data || data.items.every((i) => i.translation.status !== "missing")}
          onClick={translateAllMissingOnPage}
          title={`Generates translations for every "Missing" row currently on this page into ${targetLanguageName()}`}
          className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 font-semibold text-sky-300 disabled:opacity-40"
        >
          Translate All Missing on Page
        </button>
        <button disabled={bulkBusy !== null} onClick={approveSelected} className="rounded-full bg-emerald-500/80 px-3 py-1.5 font-semibold text-slate-950 disabled:opacity-40">
          Approve Selected
        </button>
        <button disabled={bulkBusy !== null} onClick={rejectSelected} className="rounded-full bg-red-500/80 px-3 py-1.5 font-semibold text-white disabled:opacity-40">
          Reject Selected
        </button>
        <button disabled={bulkBusy !== null} onClick={publishSelected} className="rounded-full bg-sky-500/80 px-3 py-1.5 font-semibold text-slate-950 disabled:opacity-40">
          Publish Selected
        </button>
        <button disabled={bulkBusy !== null} onClick={regenerateSelected} className="rounded-full border border-white/20 px-3 py-1.5 font-semibold disabled:opacity-40">
          Regenerate Selected
        </button>
        <button
          disabled={bulkBusy !== null}
          onClick={archiveSelected}
          className="rounded-full border border-red-400/50 bg-red-500/20 px-3 py-1.5 font-semibold text-red-300 disabled:opacity-40"
        >
          Archive Selected
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={`Couldn't load translations: ${error}`} onRetry={load} />
        </div>
      )}
      {loading && (
        <div className="mt-4">
          <SkeletonTable rows={8} columns={8} />
        </div>
      )}

      {data && !loading && (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="p-3">
                    <input type="checkbox" checked={data.items.length > 0 && data.items.every((i) => selected.has(i.questionId))} onChange={toggleSelectAll} />
                  </th>
                  <th className="p-3">Source (English)</th>
                  <th className="p-3">Target ({targetLanguageName()})</th>
                  <th className="p-3">Level / Ref</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Last generated</th>
                  <th className="p-3">Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.questionId}
                    className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                    onClick={() => setEditingQuestionId(item.questionId)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(item.questionId)} onChange={() => toggleSelected(item.questionId)} />
                    </td>
                    <td className="max-w-xs truncate p-3 text-slate-300">{item.sourceText ?? "—"}</td>
                    <td className="max-w-xs truncate p-3">
                      {item.translation.questionText ?? <span className="italic text-slate-500">Not yet translated</span>}
                    </td>
                    <td className="p-3 text-slate-400">
                      L{item.level}
                      <div className="text-xs">{item.reference}</div>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${STATUS_CLASS[item.translation.status]}`}>{STATUS_LABEL[item.translation.status]}</span>
                      {item.translation.validation === "incomplete" && (
                        <div className="mt-1 text-[10px] font-semibold text-red-300">incomplete</div>
                      )}
                    </td>
                    <td className="p-3">
                      {item.sourceType && SOURCE_BADGE[item.sourceType] ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SOURCE_BADGE[item.sourceType].className}`}>
                          {SOURCE_BADGE[item.sourceType].label}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">AI Factory</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-400">{item.translation.generatedAt ? new Date(item.translation.generatedAt).toLocaleString() : "—"}</td>
                    <td className="p-3 text-xs text-slate-400">{item.translation.reviewedBy ?? "—"}</td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
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

      {editingQuestionId && (
        <TranslationEditor
          secret={secret}
          reviewer={reviewer}
          questionId={editingQuestionId}
          targetLanguage={targetLanguage}
          onClose={() => setEditingQuestionId(null)}
          onChanged={refreshAfterAction}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number | string; tone?: "good" | "bad" | "warn" }) {
  const toneClass = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-slate-200";
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="text-slate-400">{label}: </span>
      <span className={`font-bold ${toneClass}`}>{value}</span>
    </span>
  );
}

function summarizeOutcomes(outcomes: string[]): string {
  const counts = new Map<string, number>();
  for (const o of outcomes) counts.set(o, (counts.get(o) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([outcome, count]) => `${count} ${outcome.replace(/_/g, " ")}`)
    .join(" · ");
}
