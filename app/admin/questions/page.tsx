"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { adminFetch } from "@/lib/admin/apiClient";
import { createClient } from "@/lib/supabase/client";
import { SkeletonCard } from "@/components/ui/Skeleton";

// Mission 6 Part 8: this dashboard has 10 fairly heavy tabs (tables,
// panels, forms), but a visit only ever needs ONE of them at a time. Code
// -splitting each tab means the admin bundle only ships what the current
// tab needs instead of all ten up front — the other nine load on demand
// the moment their nav item is clicked, not before.
const loadingFallback = (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);
const AIQuestionFactory = dynamic(() => import("@/components/admin/AIQuestionFactory"), { loading: () => loadingFallback });
const DashboardOverview = dynamic(() => import("@/components/admin/DashboardOverview"), { loading: () => loadingFallback });
const QuestionBank = dynamic(() => import("@/components/admin/QuestionBank"), { loading: () => loadingFallback });
const TranslationCenter = dynamic(() => import("@/components/admin/TranslationCenter"), { loading: () => loadingFallback });
const GlobalTranslations = dynamic(() => import("@/components/admin/GlobalTranslations"), { loading: () => loadingFallback });
const ValidationCenter = dynamic(() => import("@/components/admin/ValidationCenter"), { loading: () => loadingFallback });
const ImportExportPanel = dynamic(() => import("@/components/admin/ImportExportPanel"), { loading: () => loadingFallback });
const DuplicateReview = dynamic(() => import("@/components/admin/DuplicateReview"), { loading: () => loadingFallback });
const StatisticsPanel = dynamic(() => import("@/components/admin/StatisticsPanel"), { loading: () => loadingFallback });
const AdminSettingsPanel = dynamic(() => import("@/components/admin/AdminSettings"), { loading: () => loadingFallback });

type Section =
  | "dashboard"
  | "factory"
  | "bank"
  | "review-queue"
  | "translation"
  | "global-translations"
  | "validation"
  | "import-export"
  | "duplicates"
  | "statistics"
  | "settings";

const NAV: Array<{ id: Section; label: string }> = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "factory", label: "🤖 AI Question Factory" },
  { id: "bank", label: "📚 Question Bank" },
  { id: "review-queue", label: "🔍 Review Queue" },
  { id: "translation", label: "🌍 Translation Center" },
  // Mission 10: deliberately a separate tab from "Translation Center"
  // above, which only ever compares the editorial English/Amharic pool
  // (BibleQuestion.translations, capped at 2 languages by type). This tab
  // is the live-table, many-language workflow against
  // public.question_translations — different data, different lifecycle.
  { id: "global-translations", label: "🗣️ Global Translations" },
  { id: "validation", label: "✅ Validation" },
  { id: "import-export", label: "📥 Import / 📤 Export" },
  { id: "duplicates", label: "🔁 Duplicates" },
  { id: "statistics", label: "📈 Statistics" },
  { id: "settings", label: "⚙ Settings" },
];

/**
 * Menorah Bible Question Management System (Mission 5E, auth upgraded in
 * Mission 7 Part 3).
 *
 * Two ways into the dashboard, both enforced server-side on every
 * /api/admin/* route (lib/admin/auth.ts):
 *
 *  1. Real per-user auth: sign in with a Supabase Auth account that is
 *     listed in the admin_users table. This is the production path —
 *     see ADMIN.md for how to provision an admin account.
 *  2. Shared-secret fallback (QUESTION_ADMIN_SECRET): kept only as a
 *     documented local-development convenience for when no Supabase
 *     admin account has been provisioned yet. Grants access to anyone
 *     with the secret, not per-user — do not rely on it in production.
 *
 * Neither the secret nor any session token is ever logged.
 */
export default function AdminQuestionsPage() {
  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionAuthorized, setSessionAuthorized] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [section, setSection] = useState<Section>("dashboard");

  const unlocked = sessionAuthorized || Boolean(secret);

  useEffect(() => {
    const savedReviewer = typeof window !== "undefined" ? window.localStorage.getItem("menorah-admin-reviewer") : null;
    if (savedReviewer) setReviewer(savedReviewer);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/whoami")
      .then((res) => res.json())
      .then((data: { authorized: boolean; email?: string | null }) => {
        if (!active) return;
        setSessionAuthorized(Boolean(data.authorized));
        setSessionEmail(data.email ?? null);
      })
      .catch(() => {
        if (active) setSessionAuthorized(false);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateReviewer(value: string) {
    setReviewer(value);
    if (typeof window !== "undefined") window.localStorage.setItem("menorah-admin-reviewer", value);
  }

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setChecking(true);
    setAuthError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setAuthError(error.message);
        return;
      }
      const res = await fetch("/api/admin/whoami");
      const data = (await res.json()) as { authorized: boolean; email?: string | null };
      if (data.authorized) {
        setSessionAuthorized(true);
        setSessionEmail(data.email ?? null);
      } else {
        await supabase.auth.signOut();
        setAuthError("Signed in, but this account is not an admin. Ask an existing admin to add it to admin_users.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setChecking(false);
    }
  }

  async function handleUnlock() {
    if (!secretInput.trim()) return;
    setChecking(true);
    setAuthError(null);
    try {
      await adminFetch(secretInput.trim(), "/api/admin/stats");
      setSecret(secretInput.trim());
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Invalid secret.");
    } finally {
      setChecking(false);
    }
  }

  async function handleLock() {
    if (sessionAuthorized) {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSessionAuthorized(false);
      setSessionEmail(null);
    }
    setSecret("");
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-400">Checking session…</p>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-amber-400">Menorah Administration</p>
          <h1 className="mt-2 text-2xl font-black">Question Management System</h1>
          <p className="mt-3 text-sm text-slate-400">Sign in with your admin account.</p>

          <div className="mt-5 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            />
          </div>
          {authError && <p className="mt-2 text-sm text-red-300">{authError}</p>}
          <button
            onClick={handleLogin}
            disabled={checking}
            className="mt-4 w-full rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-60"
          >
            {checking ? "Signing in…" : "Sign in"}
          </button>

          <details className="mt-6 text-xs text-slate-500">
            <summary className="cursor-pointer select-none">Local development fallback</summary>
            <p className="mt-2 text-slate-400">
              No admin account provisioned yet? Enter the QUESTION_ADMIN_SECRET instead. Not recommended once real
              admin accounts exist — see ADMIN.md.
            </p>
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Admin secret"
              className="mt-3 w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
            />
            <button
              onClick={handleUnlock}
              disabled={checking}
              className="mt-2 w-full rounded-xl border border-white/20 px-6 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-60"
            >
              {checking ? "Checking…" : "Unlock with secret"}
            </button>
          </details>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="w-64 shrink-0 border-r border-white/10 bg-black/20 p-4">
          <p className="px-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Menorah Admin</p>
          <nav className="mt-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  section === item.id ? "bg-amber-400/15 text-amber-300" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-4">
            {sessionAuthorized && (
              <p className="mb-3 truncate text-[10px] text-slate-500" title={sessionEmail ?? undefined}>
                Signed in as {sessionEmail ?? "admin"}
              </p>
            )}
            <label className="block text-xs font-semibold text-slate-400">Reviewer name</label>
            <input
              value={reviewer}
              onChange={(e) => updateReviewer(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[10px] text-slate-500">Recorded on every review action for the audit trail.</p>
            <button onClick={handleLock} className="mt-4 text-xs text-slate-500 underline decoration-dotted">
              {sessionAuthorized ? "Sign out" : "Lock dashboard"}
            </button>
          </div>
        </aside>

        <div className="flex-1 overflow-x-hidden p-6 sm:p-10">
          {section === "dashboard" && <DashboardOverview secret={secret} />}
          {section === "factory" && <AIQuestionFactory secret={secret} reviewer={reviewer || "unknown-admin"} />}
          {section === "bank" && <QuestionBank secret={secret} reviewer={reviewer || "unknown-admin"} title="📚 Question Bank" />}
          {section === "review-queue" && (
            <QuestionBank secret={secret} reviewer={reviewer || "unknown-admin"} title="🔍 Review Queue" presetReviewStatus="needs-review" />
          )}
          {section === "translation" && <TranslationCenter secret={secret} />}
          {section === "global-translations" && <GlobalTranslations secret={secret} reviewer={reviewer || "unknown-admin"} />}
          {section === "validation" && <ValidationCenter secret={secret} />}
          {section === "import-export" && <ImportExportPanel secret={secret} />}
          {section === "duplicates" && <DuplicateReview secret={secret} />}
          {section === "statistics" && <StatisticsPanel secret={secret} />}
          {section === "settings" && <AdminSettingsPanel secret={secret} />}
        </div>
      </div>
    </main>
  );
}
