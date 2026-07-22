"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";

interface DuplicateGroup {
  reason: "same-reference" | "normalized-wording" | "similar-wording";
  language: string;
  questionIds: string[];
  sample: string;
}

const REASON_LABEL: Record<string, string> = {
  "same-reference": "Same Bible reference",
  "normalized-wording": "Identical normalized wording",
  "similar-wording": "Similar wording (heuristic)",
};

/** Part 14 — flags candidates only. Nothing here merges, edits, or
 * deletes anything; a human decides what to do from the Question Bank. */
export default function DuplicateReview({ secret }: { secret: string }) {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ groups: DuplicateGroup[] }>(secret, "/api/admin/duplicates")
      .then((data) => setGroups(data.groups))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load duplicates."))
      .finally(() => setLoading(false));
  }, [secret]);

  return (
    <div>
      <h1 className="text-3xl font-black">🔁 Duplicate Review</h1>
      <p className="mt-2 text-slate-400">
        Possible duplicates by same reference, identical normalized wording, or high word-overlap between two questions. Nothing is merged
        automatically — review each group and act from the Question Bank.
      </p>

      {loading && <p className="mt-4 text-slate-400">Scanning…</p>}
      {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {groups.map((g, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-300">{REASON_LABEL[g.reason]}</span>
              <span className="text-xs text-slate-500">({g.language})</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{g.sample}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {g.questionIds.map((id) => (
                <span key={id} className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-slate-400">
                  {id}
                </span>
              ))}
            </div>
          </div>
        ))}
        {!loading && groups.length === 0 && <p className="text-slate-500">No duplicate candidates found.</p>}
      </div>
    </div>
  );
}
