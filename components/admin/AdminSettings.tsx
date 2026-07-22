"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import type { AdminSettings } from "@/lib/admin/types";
import { CANONICAL_CATEGORIES } from "@/lib/questions/canon";

export default function AdminSettingsPanel({ secret }: { secret: string }) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AdminSettings>(secret, "/api/admin/settings")
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings."))
      .finally(() => setLoading(false));
  }, [secret]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await adminFetch(secret, "/api/admin/settings", { method: "POST", body: JSON.stringify(settings) });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-400">Loading settings…</p>;
  if (error) return <p className="text-red-300">{error}</p>;
  if (!settings) return null;

  return (
    <div>
      <h1 className="text-3xl font-black">⚙ Settings</h1>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Supported languages</h2>
        <p className="mt-1 text-sm text-slate-400">{settings.supportedLanguages.join(", ")}</p>
        <p className="mt-1 text-xs text-slate-500">
          Matches lib/i18n/locales.ts&apos;s FULLY_TRANSLATED_QUESTION_LANGS — changing this here does not change the app&apos;s actual language list,
          it only affects which languages this dashboard&apos;s filters/translation center highlight by default.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Translation defaults</h2>
        <label className="mt-2 block text-sm">
          Default target language for new translation work
          <select
            value={settings.translationDefaults.defaultTargetLanguage}
            onChange={(e) => setSettings({ ...settings, translationDefaults: { defaultTargetLanguage: e.target.value } })}
            className="mt-1 block rounded-lg border border-white/15 bg-slate-900 px-3 py-2"
          >
            <option value="am">Amharic</option>
            <option value="en">English</option>
          </select>
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Question generation defaults (AI Factory)</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Default difficulty
            <input
              value={settings.generationDefaults.defaultDifficulty}
              onChange={(e) => setSettings({ ...settings, generationDefaults: { ...settings.generationDefaults, defaultDifficulty: e.target.value } })}
              className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Default category
            <select
              value={settings.generationDefaults.defaultCategory}
              onChange={(e) => setSettings({ ...settings, generationDefaults: { ...settings.generationDefaults, defaultCategory: e.target.value } })}
              className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"
            >
              {CANONICAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Default level
            <input
              type="number"
              min={1}
              max={10}
              value={settings.generationDefaults.defaultLevel}
              onChange={(e) =>
                setSettings({ ...settings, generationDefaults: { ...settings.generationDefaults, defaultLevel: Number(e.target.value) } })
              }
              className="mt-1 block w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Informational only today — the AI Question Factory tab keeps its own independent form state (Part 1: not redesigned). Wiring these
          defaults into that form is a natural follow-up.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Validator options</h2>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.validatorOptions.treatDuplicateWordingAsError}
            onChange={(e) => setSettings({ ...settings, validatorOptions: { treatDuplicateWordingAsError: e.target.checked } })}
          />
          Treat duplicate wording as a hard error (currently a warning in lib/questions/validate.ts)
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Review workflow</h2>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.reviewWorkflow.requireReasonOnReject}
            onChange={(e) => setSettings({ ...settings, reviewWorkflow: { ...settings.reviewWorkflow, requireReasonOnReject: e.target.checked } })}
          />
          Require a reason when rejecting a question
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.reviewWorkflow.allowSelfApprove}
            onChange={(e) => setSettings({ ...settings, reviewWorkflow: { ...settings.reviewWorkflow, allowSelfApprove: e.target.checked } })}
          />
          Allow the same admin who edited a question to also approve it
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Development information</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-400">
          <li>
            Access control: real per-user Supabase Auth, gated by the <code>admin_users</code> table — see ADMIN.md. The
            QUESTION_ADMIN_SECRET header is kept only as a local-development fallback for before any admin account is
            provisioned; production should rely on signed-in admin accounts, not the shared secret.
          </li>
          <li>Review state + edits: stored in Supabase (question_review_overlay, question_review_history — the latter is an append-only audit trail), not the server filesystem.</li>
          <li>Imported questions: stored in Supabase (admin_imported_questions), merged with the canonical store at read time.</li>
          <li>Canonical question content itself: lib/questions/* (Mission 5C/5D), never modified by this dashboard.</li>
          <li>
            Separate pipeline: the AI Question Factory tab writes directly to the Supabase <code>questions</code> table
            (the same table live multiplayer rooms select published questions from) and is reviewed via its own
            &ldquo;Pending AI Review&rdquo; list — it does not go through this Review Queue.
          </li>
        </ul>
      </section>

      <button onClick={save} disabled={saving} className="mt-6 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">
        {saving ? "Saving…" : "Save settings"}
      </button>
      {saved && <span className="ml-3 text-sm text-emerald-300">Saved.</span>}
    </div>
  );
}
