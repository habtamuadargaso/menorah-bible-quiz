"use client";

import { useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { CANONICAL_CATEGORIES } from "@/lib/questions/canon";
import type { AdminQuestionView } from "@/lib/admin/types";

const DIFFICULTIES = ["very-easy", "easy", "easy-plus", "medium", "medium-plus", "hard", "hard-plus", "expert", "master", "scholar"];
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  "needs-review": "bg-amber-500/20 text-amber-300",
  approved: "bg-emerald-500/20 text-emerald-300",
  published: "bg-sky-500/20 text-sky-300",
  rejected: "bg-red-500/20 text-red-300",
  archived: "bg-slate-700/40 text-slate-400",
};

export default function QuestionReviewPanel({
  secret,
  reviewer,
  questionId,
  onClose,
  onChanged,
}: {
  secret: string;
  reviewer: string;
  questionId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [question, setQuestion] = useState<AdminQuestionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  // Mission 6 Part 7: this modal previously had no keyboard support at all
  // — no Escape to close, and focus stayed wherever it was on the
  // underlying page (a keyboard/screen-reader user opening it would have
  // no idea it appeared). Standard dialog pattern: move focus in on open,
  // close on Escape, restore focus to whatever triggered it on close.
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function load() {
    setLoading(true);
    adminFetch<AdminQuestionView>(secret, `/api/admin/questions/${encodeURIComponent(questionId)}`)
      .then((data) => {
        setQuestion(data);
        setForm({
          enQuestion: data.translations.en?.question ?? "",
          enChoice0: data.translations.en?.choices[0] ?? "",
          enChoice1: data.translations.en?.choices[1] ?? "",
          enChoice2: data.translations.en?.choices[2] ?? "",
          enChoice3: data.translations.en?.choices[3] ?? "",
          enExplanation: data.translations.en?.explanation ?? "",
          amQuestion: data.translations.am?.question ?? "",
          amChoice0: data.translations.am?.choices[0] ?? "",
          amChoice1: data.translations.am?.choices[1] ?? "",
          amChoice2: data.translations.am?.choices[2] ?? "",
          amChoice3: data.translations.am?.choices[3] ?? "",
          amExplanation: data.translations.am?.explanation ?? "",
          reference: data.reference,
          book: data.book,
          level: String(data.level),
          difficulty: data.difficulty,
          category: data.canonicalCategory,
          tags: data.tags.join(", "),
          correctIndex: String(data.correctIndex),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load question."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  async function handleReview(status: "approved" | "published" | "rejected" | "needs-review" | "draft") {
    let reason: string | undefined;
    if (status === "rejected") {
      reason = window.prompt("Reason for rejecting this question:") ?? undefined;
      if (!reason?.trim()) return;
    }
    try {
      await adminFetch(secret, `/api/admin/questions/${encodeURIComponent(questionId)}/review`, {
        method: "POST",
        body: JSON.stringify({ status, reviewer, reason }),
      });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review action failed.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const patch = {
        reference: form.reference,
        book: form.book,
        level: Number(form.level),
        difficulty: form.difficulty as AdminQuestionView["difficulty"],
        canonicalCategory: form.category as AdminQuestionView["canonicalCategory"],
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        correctIndex: Number(form.correctIndex) as 0 | 1 | 2 | 3,
        translations: {
          ...(question?.translations.en || form.enQuestion
            ? {
                en: {
                  question: form.enQuestion,
                  choices: [form.enChoice0, form.enChoice1, form.enChoice2, form.enChoice3] as [string, string, string, string],
                  explanation: form.enExplanation,
                },
              }
            : {}),
          ...(question?.translations.am || form.amQuestion
            ? {
                am: {
                  question: form.amQuestion,
                  choices: [form.amChoice0, form.amChoice1, form.amChoice2, form.amChoice3] as [string, string, string, string],
                  explanation: form.amExplanation,
                },
              }
            : {}),
        },
      };
      await adminFetch(secret, `/api/admin/questions/${encodeURIComponent(questionId)}`, {
        method: "PATCH",
        body: JSON.stringify({ reviewer, patch }),
      });
      setEditing(false);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed — validator rejected this edit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-review-panel-heading"
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="question-review-panel-heading" className="text-lg font-bold text-amber-300">
            {questionId}
          </h2>
          <button ref={closeButtonRef} onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm">
            Close ✕
          </button>
        </div>

        {loading && <p className="mt-4 text-slate-400">Loading…</p>}
        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        {question && !loading && (
          <div className="mt-4 space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[question.review.status]}`}>
                {question.review.status}
              </span>
              {question.validation.errorCount > 0 && (
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                  {question.validation.errorCount} validation error(s)
                </span>
              )}
              {question.validation.warningCount > 0 && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                  {question.validation.warningCount} warning(s)
                </span>
              )}
              {question.hasEdits && <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">edited</span>}
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{question.verified ? "verified" : "unverified (AI draft)"}</span>
            </div>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <h3 className="mb-2 font-bold text-slate-300">Canonical metadata</h3>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Book: <span className="text-white">{question.book}</span></div>
                <div>Testament: <span className="text-white">{question.testament}</span></div>
                <div>Level: <span className="text-white">{question.level}</span></div>
                <div>Difficulty: <span className="text-white">{question.difficulty}</span></div>
                <div>Category: <span className="text-white">{question.canonicalCategory}</span></div>
                <div>Reference: <span className="text-white">{question.reference}</span></div>
              </div>
              <div className="mt-2 text-slate-400">Tags: <span className="text-white">{question.tags.join(", ") || "—"}</span></div>
            </section>

            {question.validation.messages.length > 0 && (
              <section className="rounded-xl border border-red-400/30 bg-red-500/5 p-4 text-xs text-red-300">
                {question.validation.messages.map((m, i) => (
                  <div key={i}>{m}</div>
                ))}
              </section>
            )}

            {!editing ? (
              <>
                {(["en", "am"] as const).map((lang) => {
                  const t = question.translations[lang];
                  return (
                    <section key={lang} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h3 className="mb-2 font-bold text-slate-300">{lang === "en" ? "English" : "Amharic"}</h3>
                      {t ? (
                        <>
                          <p className="font-semibold text-white">{t.question}</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {t.choices.map((c, i) => (
                              <li key={i} className={i === question.correctIndex ? "font-bold text-emerald-300" : "text-slate-400"}>
                                {i === question.correctIndex ? "✔ " : "· "}
                                {c}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-slate-400">{t.explanation}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                            status: {question.translationStatus[lang] ?? "missing"}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm italic text-slate-500">No {lang === "en" ? "English" : "Amharic"} translation yet.</p>
                      )}
                    </section>
                  );
                })}

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setEditing(true)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
                    ✎ Edit
                  </button>
                  <button onClick={() => handleReview("approved")} className="rounded-full bg-emerald-500/80 px-4 py-2 text-sm font-bold text-slate-950">
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview("published")}
                    disabled={question.review.status !== "approved"}
                    title={question.review.status !== "approved" ? "Approve this question first" : undefined}
                    className="rounded-full bg-sky-500/80 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Publish
                  </button>
                  <button onClick={() => handleReview("needs-review")} className="rounded-full bg-amber-500/80 px-4 py-2 text-sm font-bold text-slate-950">
                    Needs Review
                  </button>
                  <button onClick={() => handleReview("rejected")} className="rounded-full bg-red-500/80 px-4 py-2 text-sm font-bold text-white">
                    Reject
                  </button>
                  <button onClick={() => handleReview("draft")} className="rounded-full border border-white/15 px-4 py-2 text-sm">
                    Reset to Draft
                  </button>
                </div>

                {question.history.length > 0 && (
                  <section className="text-xs text-slate-500">
                    <h4 className="mb-1 font-bold uppercase tracking-wide">History</h4>
                    {question.history
                      .slice()
                      .reverse()
                      .map((h, i) => (
                        <div key={i}>
                          {new Date(h.at).toLocaleString()} — {h.reviewer}: {h.action} {h.detail ? `(${h.detail})` : ""}
                        </div>
                      ))}
                  </section>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {(["en", "am"] as const).map((lang) => (
                  <section key={lang} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-2 font-bold text-slate-300">{lang === "en" ? "English" : "Amharic"}</h3>
                    <textarea
                      value={form[`${lang}Question`]}
                      onChange={(e) => setForm((f) => ({ ...f, [`${lang}Question`]: e.target.value }))}
                      className="mb-2 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                      rows={2}
                      placeholder="Question text"
                    />
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        value={form[`${lang}Choice${i}`]}
                        onChange={(e) => setForm((f) => ({ ...f, [`${lang}Choice${i}`]: e.target.value }))}
                        className="mb-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                        placeholder={`Choice ${i + 1}`}
                      />
                    ))}
                    <textarea
                      value={form[`${lang}Explanation`]}
                      onChange={(e) => setForm((f) => ({ ...f, [`${lang}Explanation`]: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                      rows={2}
                      placeholder="Explanation"
                    />
                  </section>
                ))}

                <section className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <label>
                    Correct answer index
                    <select
                      value={form.correctIndex}
                      onChange={(e) => setForm((f) => ({ ...f, correctIndex: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <option key={i} value={i}>
                          Choice {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Reference
                    <input
                      value={form.reference}
                      onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    />
                  </label>
                  <label>
                    Book
                    <input
                      value={form.book}
                      onChange={(e) => setForm((f) => ({ ...f, book: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    />
                  </label>
                  <label>
                    Level
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.level}
                      onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    />
                  </label>
                  <label>
                    Difficulty
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    >
                      {CANONICAL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="col-span-2">
                    Tags (comma separated)
                    <input
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2"
                    />
                  </label>
                </section>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
                  >
                    {saving ? "Validating & saving…" : "Save (runs validator first)"}
                  </button>
                  <button onClick={() => setEditing(false)} className="rounded-full border border-white/15 px-5 py-2 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
