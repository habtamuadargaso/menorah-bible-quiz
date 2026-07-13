import type { LangCode } from "@/lib/i18n/locales";
import { createClient } from "@/lib/supabase/client";
import { questionById } from "./index";
import type { LoadedQuestion } from "./loadQuestions";

export async function loadQuestionById(
  questionId: string,
  languageCode: LangCode
): Promise<LoadedQuestion | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      level,
      category,
      book,
      chapter,
      difficulty,
      correct_index,
      reference,
      question_translations!inner (
        language_code,
        question_text,
        choice_1,
        choice_2,
        choice_3,
        choice_4,
        explanation,
        reflection
      )
    `)
    .eq("id", questionId)
    .eq("status", "published")
    .eq("question_translations.language_code", languageCode)
    .maybeSingle();

  if (!error && data) {
    const row = data as {
      id: string;
      level: number;
      category: string;
      book: string;
      chapter: number | null;
      difficulty: string;
      correct_index: number;
      reference: string;
      question_translations: Array<{
        question_text: string;
        choice_1: string;
        choice_2: string;
        choice_3: string;
        choice_4: string;
        explanation: string;
        reflection: string | null;
      }>;
    };
    const tr = row.question_translations[0];
    if (tr) {
      return {
        id: row.id,
        level: row.level,
        category: row.category,
        book: row.book,
        chapter: row.chapter,
        difficulty: row.difficulty,
        correctIndex: row.correct_index,
        reference: row.reference,
        question: tr.question_text,
        choices: [tr.choice_1, tr.choice_2, tr.choice_3, tr.choice_4],
        explanation: tr.explanation,
        reflection: tr.reflection,
      };
    }
  }

  const local = questionById(languageCode, questionId) ?? questionById("en", questionId);
  if (!local) return null;
  return {
    id: local.id,
    level: local.level ?? 1,
    category: local.categoryId,
    book: local.categoryId,
    chapter: null,
    difficulty: local.difficulty,
    correctIndex: local.correctIndex,
    reference: local.reference,
    question: local.question,
    choices: local.choices,
    explanation: local.explanation,
    reflection: null,
  };
}
