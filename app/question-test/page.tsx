"use client";

import { useEffect, useState } from "react";
import {
  loadQuestionsForLevel,
  type LoadedQuestion,
} from "@/lib/questions/loadQuestions";

export default function QuestionTestPage() {
  const [questions, setQuestions] = useState<LoadedQuestion[]>([]);
  const [status, setStatus] = useState("Loading questions...");

  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      try {
        const data = await loadQuestionsForLevel(1, "am");

        if (!isMounted) {
          return;
        }

        setQuestions(data);
        setStatus(`Loaded ${data.length} Amharic question(s)`);
      } catch (error: unknown) {
        console.error("Question loading error:", error);

        if (!isMounted) {
          return;
        }

        setStatus(
          error instanceof Error
            ? `Error: ${error.message}`
            : "Question loading failed."
        );
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Question Database Test</h1>

        <p className="mt-4">{status}</p>

        {questions.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/15 p-6 text-slate-300">
            No questions were found for this level and language.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {questions.map((question) => (
              <article
                key={question.id}
                className="rounded-2xl border border-white/15 p-6"
              >
                <p className="text-sm text-amber-400">{question.id}</p>

                <h2 className="mt-2 text-xl font-bold">
                  {question.question}
                </h2>

                <ul className="mt-4 space-y-2">
                  {question.choices.map((choice, index) => (
                    <li key={`${question.id}-${index}`}>
                      {index + 1}. {choice}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-slate-300">
                  {question.reference}
                </p>

                {question.explanation && (
                  <p className="mt-3 text-slate-400">
                    {question.explanation}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}