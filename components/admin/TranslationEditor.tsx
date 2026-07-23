"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { LANGUAGES } from "@/lib/i18n/locales";

interface SourceOrTarget {
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  explanation: string;
  reflection: string | null;
  status: string;
}

interface TargetTranslation extends SourceOrTarget {
  id: string;
  source_language: string | null;
  translation_provider: string | null;
  ai_model: string | null;
  generated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  quality_score: number | null;
  published_at: string | null;
  updated_at: string;
}

interface TranslationDetail {
  question: { id: string; level: number; category: string; book: string; chapter: number | null; difficulty: string; reference: string; status: string; source_type: string | null };
  source: SourceOrTarget | null;
  target: TargetTranslation | null;
}

const STATUS_LABEL: Record<string, string> = {
  missing: "Missing",
  ai_draft: "AI Draft",
  needs_review: "Needs Review",
  approved: "Approved (not live)",
  published: "Published / Live",
  rejected: "Rejected",
  archived: "Archived",
};

export default function TranslationEditor({
  secret,
  reviewer,
  questionId,
  targetLanguage,
  onClose,
  onChanged,
}: {
  secret: string;
  reviewer: string;
  questionId: string;
  targetLanguage: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<TranslationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ questionText: "", choice1: "", choice2: "", choice3: "", choice4: "", explanation: "", reflection: "" });

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const targetLanguageInfo = LANGUAGES.find((l) => l.code === targetLanguage);

  function load() {
    setLoading(true);
    adminFetch<TranslationDetail>(
      secret,
      `/api/admin/translations/detail?questionId=${encodeURIComponent(questionId)}&targetLanguage=${encodeURIComponent(targetLanguage)}`
    )
      .then((data) => {
        setDetail(data);
        setForm({
          questionText: data.target?.question_text ?? "",
          choice1: data.target?.choice_1 ?? "",
          choice2: data.target?.choice_2 ?? "",
          choice3: data.target?.choice_3 ?? "",
          choice4: data.target?.choice_4 ?? "",
          explanation: data.target?.explanation ?? "",
          reflection: data.target?.reflection ?? "",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [questionId, targetLanguage]);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!form.questionText.trim()) errs.push("Question text is required.");
    const choices = [form.choice1, form.choice2, form.choice3, form.choice4];
    if (choices.some((c) => !c.trim())) errs.push("All four choices are required.");
    else if (new Set(choices.map((c) => c.trim().toLowerCase())).size !== 4) errs.push("Choices must be unique — no duplicates.");
    if (!form.explanation.trim()) errs.push("Explanation is required.");
    return errs;
  }, [form]);

  async function handleGenerateNow() {
    setActionBusy("generate");
    setError(null);
    try {
      await adminFetch(secret, "/api/admin/translations/generate", {
        method: "POST",
        body: JSON.stringify({ questionIds: [questionId], targetLanguages: [targetLanguage], reviewer }),
      });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleSave() {
    if (!detail?.target || validationErrors.length > 0) return;
    setSaving(true);
    setError(null);
    try {
      await adminFetch(secret, `/api/admin/translations/${detail.target.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          reviewer,
          patch: {
            questionText: form.questionText,
            choice1: form.choice1,
            choice2: form.choice2,
            choice3: form.choice3,
            choice4: form.choice4,
            explanation: form.explanation,
            reflection: form.reflection || null,
          },
        }),
      });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed — the translation may have validation issues.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewAction(action: "approve" | "reject" | "publish" | "archive" | "regenerate") {
    if (!detail?.target) return;
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Reason for rejecting this translation:") ?? undefined;
      if (!reason?.trim()) return;
    }
    if (action === "publish" && !window.confirm("Publish this translation? It becomes visible to real players immediately.")) return;
    if (action === "archive" && !window.confirm("Archive this translation? If it's currently live, this removes it from gameplay.")) return;

    setActionBusy(action);
    setError(null);
    try {
      await adminFetch(secret, "/api/admin/translations/review", {
        method: "POST",
        body: JSON.stringify({ action, translationIds: [detail.target.id], reviewer, reason }),
      });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionBusy(null);
    }
  }

  const status = detail?.target?.status ?? "missing";
  const busy = actionBusy !== null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="translation-editor-heading"
        className="h-full w-full max-w-4xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="translation-editor-heading" className="text-lg font-bold text-amber-300">
            {questionId} → {targetLanguageInfo?.nativeName ?? targetLanguage}
          </h2>
          <button ref={closeButtonRef} onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm">
            Close ✕
          </button>
        </div>

        {loading && <p className="mt-4 text-slate-400">Loading…</p>}
        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        {detail && !loading && (
          <div className="mt-4 space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{STATUS_LABEL[status] ?? status}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                Level {detail.question.level} · {detail.question.reference}
              </span>
              {detail.target?.translation_provider && (
                <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs text-sky-300">
                  {detail.target.translation_provider} {detail.target.ai_model ? `(${detail.target.ai_model})` : ""}
                </span>
              )}
              {detail.target?.reviewed_by && <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Reviewed by {detail.target.reviewed_by}</span>}
            </div>

            {detail.target?.rejection_reason && (
              <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">Rejection reason: {detail.target.rejection_reason}</p>
            )}

            {!detail.source && <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">No approved/published English source exists for this question yet.</p>}

            {!detail.target ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-slate-300">No {targetLanguageInfo?.englishName ?? targetLanguage} translation exists yet.</p>
                <button
                  onClick={handleGenerateNow}
                  disabled={busy || !detail.source}
                  className="mt-4 rounded-full bg-sky-500/80 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {actionBusy === "generate" ? "Generating…" : "Generate Translation Now"}
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-2 font-bold text-slate-300">Source (English) — read only</h3>
                    {detail.source ? (
                      <>
                        <p className="font-semibold text-white">{detail.source.question_text}</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-400">
                          <li>1. {detail.source.choice_1}</li>
                          <li>2. {detail.source.choice_2}</li>
                          <li>3. {detail.source.choice_3}</li>
                          <li>4. {detail.source.choice_4}</li>
                        </ul>
                        <p className="mt-2 text-xs text-slate-400">{detail.source.explanation}</p>
                        {detail.source.reflection && <p className="mt-1 text-xs italic text-slate-500">{detail.source.reflection}</p>}
                      </>
                    ) : (
                      <p className="text-sm italic text-slate-500">No English source available.</p>
                    )}
                  </section>

                  <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-2 font-bold text-slate-300">Target ({targetLanguageInfo?.englishName ?? targetLanguage})</h3>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
                      Choice order is fixed to match the source (position 1↔1, 2↔2…) — the correct answer position lives on the shared
                      question, never per-translation, so it can&apos;t be changed here.
                    </p>
                    <textarea
                      value={form.questionText}
                      onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
                      className="mb-2 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                      rows={2}
                      placeholder="Translated question text"
                    />
                    {(["choice1", "choice2", "choice3", "choice4"] as const).map((key, i) => (
                      <input
                        key={key}
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="mb-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                        placeholder={`Choice ${i + 1}`}
                      />
                    ))}
                    <textarea
                      value={form.explanation}
                      onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                      rows={2}
                      placeholder="Translated explanation"
                    />
                    <textarea
                      value={form.reflection}
                      onChange={(e) => setForm((f) => ({ ...f, reflection: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-sm"
                      rows={2}
                      placeholder="Translated reflection (optional)"
                    />
                  </section>
                </div>

                {validationErrors.length > 0 && (
                  <section className="rounded-xl border border-red-400/30 bg-red-500/5 p-4 text-xs text-red-300">
                    {validationErrors.map((e, i) => (
                      <div key={i}>{e}</div>
                    ))}
                  </section>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || validationErrors.length > 0}
                    className="rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => handleReviewAction("approve")}
                    disabled={busy || !["ai_draft", "needs_review"].includes(status)}
                    className="rounded-full bg-emerald-500/80 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewAction("publish")}
                    disabled={busy || status !== "approved"}
                    title={status !== "approved" ? "Approve this translation first" : undefined}
                    className="rounded-full bg-sky-500/80 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => handleReviewAction("reject")}
                    disabled={busy || status === "published"}
                    className="rounded-full bg-red-500/80 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReviewAction("regenerate")}
                    disabled={busy || status === "published"}
                    title={status === "published" ? "Published translations are protected — archive first to replace." : undefined}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => handleReviewAction("archive")}
                    disabled={busy || status === "archived"}
                    className="rounded-full border border-red-400/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Archive
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
