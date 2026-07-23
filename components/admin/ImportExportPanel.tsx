"use client";

import { useRef, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";

interface ImportResult {
  acceptedCount: number;
  acceptedIds: string[];
  rejectedCount: number;
  rejected: Array<{ index: number; errors: string[] }>;
}

/** Part 12 — reuses lib/questions/importer.ts (via /api/admin/import)
 * exactly as Mission 5C built it. Imported questions are always saved
 * verified:false / status "draft" — never auto-published, regardless of
 * what the uploaded JSON claims. */
export default function ImportExportPanel({ secret }: { secret: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a JSON file first.");
      return;
    }
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questions)) throw new Error("File must contain a JSON array of questions (or {questions: [...]}).");
      const result = await adminFetch<ImportResult>(secret, "/api/admin/import", {
        method: "POST",
        body: JSON.stringify({ questions }),
      });
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function downloadExport(kind: "questions" | "validation") {
    const url = kind === "validation" ? "/api/admin/export?kind=validation" : "/api/admin/export";
    const response = await fetch(url, { headers: { "x-admin-secret": secret } });
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = kind === "validation" ? "validation-report.json" : "questions-export.json";
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div>
      <h1 className="text-3xl font-black">📥 Import / 📤 Export</h1>
      <p className="mt-2 text-slate-400">
        Import runs every candidate through the same validator as the rest of the dashboard and rejects anything invalid or duplicate.
        Nothing imported is ever auto-approved.
      </p>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Import JSON</h2>
        <input ref={fileRef} type="file" accept="application/json" className="mt-3 block w-full text-sm text-slate-300" />
        <button
          onClick={handleImport}
          disabled={importing}
          className="mt-3 rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
        >
          {importing ? "Validating & importing…" : "Import"}
        </button>

        {error && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        {importResult && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-emerald-300">Accepted: {importResult.acceptedCount}</p>
            <p className="text-red-300">Rejected: {importResult.rejectedCount}</p>
            {importResult.rejected.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-400">
                {importResult.rejected.map((r, i) => (
                  <div key={i} className="mb-2">
                    Row {r.index}: {r.errors.join("; ")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Export</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={() => downloadExport("questions")} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
            Export all questions (JSON)
          </button>
          <button onClick={() => downloadExport("validation")} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
            Export validation report
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          To export a filtered subset, use the Question Bank tab&apos;s filters, select rows, and click &quot;Export selected.&quot;
        </p>
      </section>
    </div>
  );
}
