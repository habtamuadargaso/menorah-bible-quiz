"use client";

import { useMemo, useState } from "react";
import { nativeQuestionBank } from "@/lib/questions";
import type { LangCode } from "@/lib/i18n/locales";

const SUPPORTED: Array<{ code: LangCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
  { code: "om", label: "Afaan Oromo" },
  { code: "ti", label: "ትግርኛ" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
  { code: "sw", label: "Kiswahili" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];

export default function QuestionAuditPage() {
  const [lang, setLang] = useState<LangCode>("en");
  const bank = useMemo(() => nativeQuestionBank(lang), [lang]);
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    return bank.filter((question) => {
      const key = question.question.trim().toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }, [bank]);

  const levelCapacity = Math.floor(bank.length / 10);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Content Quality</p>
            <h1 className="mt-2 text-4xl font-black">Question Bank Audit</h1>
            <p className="mt-3 max-w-2xl text-slate-300">A private development view for checking native question counts, duplicate text, and campaign readiness before publishing.</p>
          </div>
          <label className="text-sm font-semibold text-slate-300">
            Language
            <select value={lang} onChange={(event) => setLang(event.target.value as LangCode)} className="mt-2 block rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white">
              {SUPPORTED.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Native questions" value={bank.length} />
          <Metric label="Complete 10-question levels" value={levelCapacity} />
          <Metric label="Duplicate question text" value={duplicates.length} danger={duplicates.length > 0} />
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-4 font-bold">Question inventory</div>
          <div className="max-h-[60vh] overflow-auto">
            {bank.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No reviewed native questions are available for this language yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-900 text-slate-300">
                  <tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Question</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Difficulty</th><th className="px-5 py-3">Reference</th></tr>
                </thead>
                <tbody>
                  {bank.map((question) => (
                    <tr key={question.id} className="border-t border-white/5 align-top">
                      <td className="px-5 py-4 font-mono text-xs text-amber-300">{question.id}</td>
                      <td className="px-5 py-4 font-semibold">{question.question}</td>
                      <td className="px-5 py-4 text-slate-300">{question.categoryId}</td>
                      <td className="px-5 py-4 text-slate-300">{question.difficulty}</td>
                      <td className="px-5 py-4 text-slate-300">{question.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${danger ? "text-red-400" : "text-amber-300"}`}>{value}</p></div>;
}
