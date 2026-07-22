"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

interface ValidationGroup {
  severity: string;
  code: string;
  count: number;
  questionIds: string[];
}

interface ValidationResponse {
  totalQuestions: number;
  errorCount: number;
  warningCount: number;
  isClean: boolean;
  groups: ValidationGroup[];
  issues: Array<{ questionId: string; severity: string; code: string; message: string }>;
}

/** Part 11 — reuses lib/questions/validate.ts's exact output via
 * /api/admin/validate; this component only groups and displays it. */
export default function ValidationCenter({ secret }: { secret: string }) {
  const [report, setReport] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    adminFetch<ValidationResponse>(secret, "/api/admin/validate")
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load validation report."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [secret]);

  function exportReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-3xl font-black">✅ Validation Center</h1>
      <p className="mt-2 text-slate-400">The exact same validator Mission 5C/5D use, run live against the current store.</p>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <ErrorBanner message={`Couldn't run the validator: ${error}`} onRetry={load} />
        </div>
      )}

      {report && !loading && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className={`rounded-2xl border px-5 py-4 ${report.isClean ? "border-emerald-400/40 bg-emerald-500/10" : "border-red-400/40 bg-red-500/10"}`}>
              <div className="text-xs uppercase tracking-wide text-slate-400">Status</div>
              <div className="text-2xl font-black">{report.isClean ? "Clean ✓" : "Has errors"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Total questions checked</div>
              <div className="text-2xl font-black">{report.totalQuestions}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Errors / Warnings</div>
              <div className="text-2xl font-black">
                <span className="text-red-300">{report.errorCount}</span> / <span className="text-amber-300">{report.warningCount}</span>
              </div>
            </div>
            <button onClick={exportReport} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
              📥 Export report
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {report.groups.map((g) => (
              <details key={`${g.severity}-${g.code}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <summary className="cursor-pointer font-semibold">
                  <span className={g.severity === "error" ? "text-red-300" : "text-amber-300"}>{g.severity}</span> · {g.code} ·{" "}
                  <span className="text-slate-400">{g.count} question(s)</span>
                </summary>
                <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-400">
                  {g.questionIds.slice(0, 50).map((id) => (
                    <span key={id} className="rounded bg-white/5 px-2 py-1 font-mono">
                      {id}
                    </span>
                  ))}
                  {g.questionIds.length > 50 && <span>+{g.questionIds.length - 50} more</span>}
                </div>
              </details>
            ))}
            {report.groups.length === 0 && <p className="text-slate-500">No validation issues at all.</p>}
          </div>
        </>
      )}
    </div>
  );
}
