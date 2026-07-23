import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Menorah Bible Quiz — a multilingual Bible-learning game for individuals, families, churches, and live competitions.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <h1 className="text-3xl font-bold">About Menorah Bible Quiz</h1>
      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <p>
          Menorah Bible Quiz is a multilingual Bible-learning game built for individuals, families, churches, and
          live competitions. It combines a 10-level solo campaign, a fully offline pass-and-play Friends Battle
          mode, and real-time online Live Battle rooms.
        </p>
        <p>
          Questions are drawn from a canonical bank shared across languages: every player answers the same
          question by permanent ID, with only the displayed text translated — never a different question
          substituted between languages.
        </p>
        <p>
          Currently supported for full native gameplay: English and Amharic. Other languages have UI translations
          with clear &ldquo;content unavailable&rdquo; messaging where quiz content isn&apos;t translated yet.
        </p>
      </section>
    </main>
  );
}
