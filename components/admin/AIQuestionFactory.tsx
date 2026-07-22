"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { makeToastId, ToastStack, type ToastMessage } from "@/components/ui/Toast";

type Result = {
  generated?: number;
  translations?: number;
  level?: number;
  correctAnswerPositions?: number[];
  message?: string;
  error?: string;
};

type PendingFactoryQuestion = {
  id: string;
  level: number;
  category: string;
  book: string;
  chapter: number | null;
  difficulty: string;
  reference: string;
  status: string;
  created_at: string;
  question_translations: Array<{ language_code: string; question_text: string }>;
};

const LANGUAGES = [
  ["en", "English"],
  ["am", "Amharic"],
  ["om", "Afaan Oromo"],
  ["ti", "Tigrinya"],
  ["sw", "Swahili"],
  ["ar", "Arabic"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["de", "German"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["hi", "Hindi"],
  ["zh", "Chinese"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
] as const;

const OLD_TESTAMENT = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua",
  "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
  "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
  "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
  "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel",
  "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
];

const NEW_TESTAMENT = [
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus",
  "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

/**
 * Mission 5E Part 1: this is the pre-existing AI Bible Question Factory
 * (previously the entire content of app/admin/questions/page.tsx),
 * extracted verbatim into its own component so it can live as one tab in
 * the new dashboard. Its behavior, fields, and the /api/questions/generate
 * contract are UNCHANGED — this still writes straight to Supabase exactly
 * as before. The only difference from the original page: the admin secret
 * is now the dashboard's shared sign-in (passed in as a prop) instead of
 * its own separate input, since re-entering the same secret per-tab would
 * be pure friction now that it lives inside a bigger dashboard.
 */
export default function AIQuestionFactory({ secret, reviewer }: { secret: string; reviewer: string }) {
  const [book, setBook] = useState("Genesis");
  const [chapter, setChapter] = useState("");
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState("very-easy");
  const [count, setCount] = useState(10);
  const [languages, setLanguages] = useState<string[]>(["en", "am"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState<PendingFactoryQuestion[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [bulkActionBusy, setBulkActionBusy] = useState<"publish" | "reject" | "delete" | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((type: ToastMessage["type"], text: string) => {
    setToasts((prev) => [...prev, { id: makeToastId(), type, text }]);
  }, []);

  const loadPending = useCallback(() => {
    setPendingLoading(true);
    setPendingError(null);
    adminFetch<{ items: PendingFactoryQuestion[] }>(secret, "/api/admin/factory-review")
      .then((data) => {
        setPending(data.items);
        // Drop any selection for rows that no longer exist in the fresh list.
        setSelectedPending((prev) => new Set(Array.from(prev).filter((id) => data.items.some((q) => q.id === id))));
      })
      .catch((err) => setPendingError(err instanceof Error ? err.message : "Failed to load pending questions."))
      .finally(() => setPendingLoading(false));
  }, [secret]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  function togglePendingSelected(id: string) {
    setSelectedPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPending() {
    setSelectedPending((prev) => (prev.size === pending.length ? new Set() : new Set(pending.map((q) => q.id))));
  }

  /**
   * Unlike the Review Queue (Question Bank tab), approving here is a
   * single, immediate, irreversible step: this list is backed by the
   * `questions` table that live multiplayer rooms actually select from
   * (see start_battle() in supabase/migrations/20260719_online_live_battle.sql,
   * which only ever picks status='published' rows) — there is no
   * intermediate "approved but not yet published" state and no built-in
   * undo. So publishing gets an explicit confirmation, and rejecting
   * requires a reason, matching the audit expectations the rest of the
   * dashboard already holds bulk actions to.
   */
  async function reviewQuestion(id: string, status: "published" | "rejected") {
    if (status === "published" && !window.confirm("Publish this question? It becomes visible to real players in live games immediately.")) {
      return;
    }
    let reason: string | undefined;
    if (status === "rejected") {
      reason = window.prompt("Reason for rejecting this question:") ?? undefined;
      if (!reason?.trim()) return;
    }
    setReviewBusy(id);
    setPendingError(null);
    try {
      await adminFetch(secret, "/api/admin/factory-review", {
        method: "POST",
        body: JSON.stringify({ questionIds: [id], status, reason, reviewer }),
      });
      setPending((prev) => prev.filter((q) => q.id !== id));
      pushToast("success", status === "published" ? "Question published." : "Question rejected.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Review action failed.";
      setPendingError(message);
      pushToast("error", message);
    } finally {
      setReviewBusy(null);
    }
  }

  /**
   * Shared by all three bulk buttons: one confirmation (a window.prompt
   * doubles as the confirmation for reject, since Cancel aborts exactly
   * like window.confirm would) per action, one batched API request
   * carrying every selected id, then clear selection + refresh + toast.
   */
  async function runBulkReview(status: "published" | "rejected" | "deleted", reason?: string) {
    const ids = Array.from(selectedPending);
    if (ids.length === 0) return;
    const busyKey = status === "published" ? "publish" : status === "rejected" ? "reject" : "delete";
    setBulkActionBusy(busyKey);
    setPendingError(null);
    try {
      const result = await adminFetch<{ deleted?: string[]; skipped?: string[] }>(secret, "/api/admin/factory-review", {
        method: "POST",
        body: JSON.stringify({ questionIds: ids, status, reason, reviewer }),
      });

      if (status === "deleted") {
        const deletedCount = result.deleted?.length ?? 0;
        const skippedCount = result.skipped?.length ?? 0;
        pushToast(
          "success",
          `${deletedCount} question(s) deleted.` +
            (skippedCount > 0 ? ` ${skippedCount} skipped — already published, never deleted here.` : "")
        );
      } else {
        pushToast("success", `${ids.length} question(s) ${status === "published" ? "published" : "rejected"}.`);
      }

      setSelectedPending(new Set());
      loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk action failed.";
      setPendingError(message);
      pushToast("error", message);
    } finally {
      setBulkActionBusy(null);
    }
  }

  function bulkPublish() {
    const count = selectedPending.size;
    if (count === 0) return;
    if (!window.confirm(`Publish ${count} selected question(s)? They become visible to real players in live games immediately.`)) return;
    runBulkReview("published");
  }

  function bulkReject() {
    const count = selectedPending.size;
    if (count === 0) return;
    const reason = window.prompt(`Reason for rejecting ${count} selected question(s):`);
    if (!reason?.trim()) return;
    runBulkReview("rejected", reason.trim());
  }

  function bulkDelete() {
    const count = selectedPending.size;
    if (count === 0) return;
    if (!window.confirm(`Permanently delete ${count} selected draft question(s)? This cannot be undone.`)) return;
    runBulkReview("deleted");
  }

  const category = NEW_TESTAMENT.includes(book) ? "New Testament" : "Old Testament";

  const selectedNames = useMemo(
    () => LANGUAGES.filter(([code]) => languages.includes(code)).map(([, name]) => name).join(", "),
    [languages]
  );

  function toggleLanguage(code: string) {
    if (code === "en") return;
    setLanguages((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]));
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({
          book,
          chapter: chapter ? Number(chapter) : null,
          level,
          difficulty,
          count,
          category,
          languages,
        }),
      });
      const data = (await response.json()) as Result;
      if (!response.ok) throw new Error(data.error || "Question generation failed.");
      setResult(data);
      loadPending();
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Question generation failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.32em] text-amber-400">Menorah Administration</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">AI Bible Question Factory</h1>
        <p className="mx-auto mt-4 max-w-3xl text-slate-300">
          Generate unique multilingual Bible questions and save them to Supabase as drafts — nothing here reaches
          players until you approve it below (CLAUDE.md: never auto-publish AI-generated content).
        </p>
      </header>

      <form onSubmit={generate} className="mt-10 rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="mb-2 block font-semibold">Bible book</span>
            <select
              value={book}
              onChange={(event) => {
                setBook(event.target.value);
                setChapter("");
              }}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            >
              <optgroup label="Old Testament">
                {OLD_TESTAMENT.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </optgroup>
              <optgroup label="New Testament">
                {NEW_TESTAMENT.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </optgroup>
            </select>
          </label>

          <label>
            <span className="mb-2 block font-semibold">Chapter</span>
            <input
              type="number"
              min={1}
              value={chapter}
              onChange={(event) => setChapter(event.target.value)}
              placeholder="Empty means entire book"
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            />
          </label>

          <label>
            <span className="mb-2 block font-semibold">Game level</span>
            <select
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Level {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block font-semibold">Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            >
              <option value="very-easy">Very Easy</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
              <option value="scholar">Bible Scholar</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block font-semibold">Number of questions</span>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(100, Number(event.target.value))))}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            />
          </label>

          <div>
            <span className="mb-2 block font-semibold">Category</span>
            <div className="rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-slate-300">{category}</div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Languages</h2>
          <p className="mt-1 text-sm text-amber-300">Selected: {selectedNames}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {LANGUAGES.map(([code, name]) => {
              const selected = languages.includes(code);
              return (
                <label
                  key={code}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                    selected ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-slate-900"
                  }`}
                >
                  <input type="checkbox" checked={selected} disabled={code === "en"} onChange={() => toggleLanguage(code)} />
                  {name}
                </label>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-amber-400 px-6 py-4 text-lg font-extrabold text-slate-950 disabled:opacity-60"
        >
          {loading ? "Generating, validating, and saving..." : "Generate & Save"}
        </button>
      </form>

      {result && (
        <section
          className={`mt-6 rounded-2xl border p-5 ${
            result.error ? "border-red-400/40 bg-red-400/10" : "border-emerald-400/40 bg-emerald-400/10"
          }`}
        >
          <h2 className="text-xl font-bold">{result.error ? "Generation failed" : "Questions saved successfully"}</h2>
          <p className="mt-2">{result.error || result.message}</p>
          {!result.error && (
            <p className="mt-2 text-sm text-slate-300">
              Questions: {result.generated ?? 0} · Translations: {result.translations ?? 0}
            </p>
          )}
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Pending AI Review ({pending.length})</h2>
          <button
            onClick={loadPending}
            disabled={pendingLoading}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {pendingLoading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Draft questions generated above, not yet visible to players. Approving here publishes immediately to live
          games (there is no separate &ldquo;approved&rdquo; staging step for this list, unlike the Review Queue tab) — rejecting
          requires a reason for the audit trail.
        </p>
        {pendingError && <p className="mt-2 text-sm text-red-300">{pendingError}</p>}

        {pending.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <label className="flex items-center gap-2 font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={pending.length > 0 && selectedPending.size === pending.length}
                onChange={toggleSelectAllPending}
              />
              Select All
            </label>
            <span className="font-bold text-amber-300">{selectedPending.size} selected</span>
            <button
              disabled={selectedPending.size === 0 || bulkActionBusy !== null}
              onClick={bulkPublish}
              className="rounded-full bg-emerald-500/80 px-3 py-1.5 font-semibold text-slate-950 disabled:opacity-40"
            >
              {bulkActionBusy === "publish" ? "Publishing…" : "Approve & Publish Selected"}
            </button>
            <button
              disabled={selectedPending.size === 0 || bulkActionBusy !== null}
              onClick={bulkReject}
              className="rounded-full bg-red-500/80 px-3 py-1.5 font-semibold text-white disabled:opacity-40"
            >
              {bulkActionBusy === "reject" ? "Rejecting…" : "Reject Selected"}
            </button>
            <button
              disabled={selectedPending.size === 0 || bulkActionBusy !== null}
              onClick={bulkDelete}
              title="Only removes AI-generated draft questions — anything already published is skipped, never deleted here."
              className="rounded-full border border-red-400/50 bg-red-500/20 px-3 py-1.5 font-semibold text-red-300 disabled:opacity-40"
            >
              {bulkActionBusy === "delete" ? "Deleting…" : "Delete Selected"}
            </button>
          </div>
        )}

        {pending.length === 0 ? (
          <p className="mt-4 text-sm italic text-slate-500">{pendingLoading ? "Loading…" : "Nothing pending review."}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((q) => {
              const enText = q.question_translations.find((t) => t.language_code === "en")?.question_text ?? q.question_translations[0]?.question_text ?? "(no translation yet)";
              const rowDisabled = reviewBusy === q.id || bulkActionBusy !== null;
              return (
                <li key={q.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    className="mt-1 shrink-0"
                    checked={selectedPending.has(q.id)}
                    disabled={bulkActionBusy !== null}
                    onChange={() => togglePendingSelected(q.id)}
                  />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">
                      Level {q.level} · {q.category} · {q.reference} · {q.difficulty} · status: {q.status}
                    </p>
                    <p className="mt-2 text-sm text-slate-100">{enText}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => reviewQuestion(q.id, "published")}
                        disabled={rowDisabled}
                        className="rounded-full bg-emerald-500/80 px-4 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-50"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => reviewQuestion(q.id, "rejected")}
                        disabled={rowDisabled}
                        className="rounded-full bg-red-500/80 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
