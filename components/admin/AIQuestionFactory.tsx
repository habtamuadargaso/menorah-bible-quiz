"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";

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
export default function AIQuestionFactory({ secret }: { secret: string }) {
  const [book, setBook] = useState("Genesis");
  const [chapter, setChapter] = useState("");
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState("very-easy");
  const [count, setCount] = useState(1);
  const [languages, setLanguages] = useState<string[]>(["en", "am"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState<PendingFactoryQuestion[]>([]);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);

  const loadPending = useCallback(() => {
    adminFetch<{ items: PendingFactoryQuestion[] }>(secret, "/api/admin/factory-review")
      .then((data) => setPending(data.items))
      .catch((err) => setPendingError(err instanceof Error ? err.message : "Failed to load pending questions."));
  }, [secret]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function reviewQuestion(id: string, status: "published" | "rejected") {
    setReviewBusy(id);
    try {
      await adminFetch(secret, "/api/admin/factory-review", {
        method: "POST",
        body: JSON.stringify({ questionIds: [id], status }),
      });
      setPending((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setPendingError(err instanceof Error ? err.message : "Review action failed.");
    } finally {
      setReviewBusy(null);
    }
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
              max={10}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(10, Number(event.target.value))))}
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
        <h2 className="text-xl font-bold">Pending AI Review ({pending.length})</h2>
        <p className="mt-1 text-sm text-slate-400">
          Draft questions generated above, not yet visible to players. Approve to publish, or reject to discard.
        </p>
        {pendingError && <p className="mt-2 text-sm text-red-300">{pendingError}</p>}
        {pending.length === 0 ? (
          <p className="mt-4 text-sm italic text-slate-500">Nothing pending review.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((q) => {
              const enText = q.question_translations.find((t) => t.language_code === "en")?.question_text ?? q.question_translations[0]?.question_text ?? "(no translation yet)";
              return (
                <li key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">
                    Level {q.level} · {q.category} · {q.reference} · {q.difficulty} · status: {q.status}
                  </p>
                  <p className="mt-2 text-sm text-slate-100">{enText}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => reviewQuestion(q.id, "published")}
                      disabled={reviewBusy === q.id}
                      className="rounded-full bg-emerald-500/80 px-4 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-50"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => reviewQuestion(q.id, "rejected")}
                      disabled={reviewBusy === q.id}
                      className="rounded-full bg-red-500/80 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
