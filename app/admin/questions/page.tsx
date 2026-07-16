"use client";

import { FormEvent, useMemo, useState } from "react";

type Result = {
  generated?: number;
  translations?: number;
  level?: number;
  correctAnswerPositions?: number[];
  message?: string;
  error?: string;
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
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua",
  "Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings",
  "1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job",
  "Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah",
  "Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel",
  "Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
  "Haggai","Zechariah","Malachi"
];

const NEW_TESTAMENT = [
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
  "2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus",
  "Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John",
  "3 John","Jude","Revelation"
];

export default function QuestionFactoryPage() {
  const [secret, setSecret] = useState("");
  const [book, setBook] = useState("Genesis");
  const [chapter, setChapter] = useState("");
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState("very-easy");
  const [count, setCount] = useState(1);
  const [languages, setLanguages] = useState<string[]>(["en", "am"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const category = NEW_TESTAMENT.includes(book)
    ? "New Testament"
    : "Old Testament";

  const selectedNames = useMemo(
    () =>
      LANGUAGES
        .filter(([code]) => languages.includes(code))
        .map(([, name]) => name)
        .join(", "),
    [languages]
  );

  function toggleLanguage(code: string) {
    if (code === "en") return;

    setLanguages((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!secret.trim()) {
      setResult({ error: "Enter your private admin secret." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret.trim(),
        },
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

      if (!response.ok) {
        throw new Error(data.error || "Question generation failed.");
      }

      setResult(data);
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Question generation failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-amber-400">
            Menorah Administration
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            AI Bible Question Factory
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            Generate unique multilingual Bible questions and save them
            directly to Supabase.
          </p>
        </header>

        <form
          onSubmit={generate}
          className="mt-10 rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8"
        >
          <label className="mb-2 block font-semibold">
            Private admin secret
          </label>

          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Enter QUESTION_ADMIN_SECRET"
            className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2">
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
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      Level {value}
                    </option>
                  )
                )}
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
              <span className="mb-2 block font-semibold">
                Number of questions
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(event) =>
                  setCount(
                    Math.max(1, Math.min(10, Number(event.target.value)))
                  )
                }
                className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3"
              />
            </label>

            <div>
              <span className="mb-2 block font-semibold">Category</span>
              <div className="rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-slate-300">
                {category}
              </div>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Languages</h2>
            <p className="mt-1 text-sm text-amber-300">
              Selected: {selectedNames}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {LANGUAGES.map(([code, name]) => {
                const selected = languages.includes(code);

                return (
                  <label
                    key={code}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                      selected
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-white/10 bg-slate-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={code === "en"}
                      onChange={() => toggleLanguage(code)}
                    />
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
            {loading
              ? "Generating, validating, and saving..."
              : "Generate & Save"}
          </button>
        </form>

        {result && (
          <section
            className={`mt-6 rounded-2xl border p-5 ${
              result.error
                ? "border-red-400/40 bg-red-400/10"
                : "border-emerald-400/40 bg-emerald-400/10"
            }`}
          >
            <h2 className="text-xl font-bold">
              {result.error
                ? "Generation failed"
                : "Questions saved successfully"}
            </h2>

            <p className="mt-2">
              {result.error || result.message}
            </p>

            {!result.error && (
              <p className="mt-2 text-sm text-slate-300">
                Questions: {result.generated ?? 0} · Translations:{" "}
                {result.translations ?? 0}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
