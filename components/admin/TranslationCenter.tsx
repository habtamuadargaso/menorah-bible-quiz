"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import type { AdminQuestionView } from "@/lib/admin/types";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

interface PageResponse {
  items: AdminQuestionView[];
  total: number;
}

type RowFlag = { label: string; tone: "bad" | "warn" | "good" };

function flagsFor(q: AdminQuestionView): RowFlag[] {
  const flags: RowFlag[] = [];
  const en = q.translations.en;
  const am = q.translations.am;

  if (!am) {
    flags.push({ label: "Missing Amharic translation", tone: "bad" });
  } else {
    if (q.translationStatus.am === "machine") flags.push({ label: "Machine translation — needs native review", tone: "warn" });
    if (q.translationStatus.am === "complete") flags.push({ label: "Marked complete", tone: "good" });
    if (en && en.choices.length !== am.choices.length) flags.push({ label: "Different answer count between languages", tone: "bad" });
  }
  return flags;
}

/** Part 10. Reads the same admin question list the Question Bank uses,
 * filtered client-side to only rows worth a translator's attention
 * (missing Amharic or still machine-drafted), shown side-by-side. */
export default function TranslationCenter({ secret }: { secret: string }) {
  const [items, setItems] = useState<AdminQuestionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyIssues, setOnlyIssues] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminFetch<PageResponse>(secret, "/api/admin/questions?pageSize=500&page=1")
      .then((data) => setItems(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const withFlags = items.map((q) => ({ q, flags: flagsFor(q) }));
    return onlyIssues ? withFlags.filter((r) => r.flags.some((f) => f.tone !== "good")) : withFlags;
  }, [items, onlyIssues]);

  return (
    <div>
      <h1 className="text-3xl font-black">🌍 Translation Center</h1>
      <p className="mt-2 text-slate-400">English and Amharic side-by-side, with mismatches and machine-translation status flagged.</p>

      <label className="mt-4 flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm">
        <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
        Show only rows needing attention
      </label>

      {loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <ErrorBanner message={`Couldn't load translations: ${error}`} onRetry={load} />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {rows.map(({ q, flags }) => (
          <div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-500">{q.id}</span>
              <div className="flex gap-2">
                {flags.map((f, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      f.tone === "bad" ? "bg-red-500/20 text-red-300" : f.tone === "warn" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {f.label}
                  </span>
                ))}
                {q.reference && <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{q.reference}</span>}
              </div>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">English</h4>
                {q.translations.en ? (
                  <>
                    <p className="mt-1 font-semibold">{q.translations.en.question}</p>
                    <ul className="mt-1 text-sm text-slate-400">
                      {q.translations.en.choices.map((c, i) => (
                        <li key={i} className={i === q.correctIndex ? "text-emerald-300" : ""}>
                          {i === q.correctIndex ? "✔ " : "· "}
                          {c}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 italic text-slate-600">No English translation.</p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Amharic</h4>
                {q.translations.am ? (
                  <>
                    <p className="mt-1 font-semibold">{q.translations.am.question}</p>
                    <ul className="mt-1 text-sm text-slate-400">
                      {q.translations.am.choices.map((c, i) => (
                        <li key={i} className={i === q.correctIndex ? "text-emerald-300" : ""}>
                          {i === q.correctIndex ? "✔ " : "· "}
                          {c}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 italic text-red-400/80">No Amharic translation yet.</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && <p className="text-slate-500">Nothing needs translation attention right now.</p>}
      </div>
    </div>
  );
}
