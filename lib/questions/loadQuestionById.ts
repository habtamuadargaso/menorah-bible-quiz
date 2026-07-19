import type { LangCode } from "@/lib/i18n/locales";
import { createClient } from "@/lib/supabase/client";
import { questionById } from "./index";
import type { LoadedQuestion } from "./loadQuestions";

export async function loadQuestionById(
  questionId: string,
  languageCode: LangCode
): Promise<LoadedQuestion | null> {
  const supabase = createClient();

  // See loadQuestions.ts: correct_index/explanation are no longer directly
  // SELECT-able, so the answer key is fetched separately via the
  // get_question_answer_keys RPC (safe for solo play, phase-gated for battle).
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      level,
      category,
      book,
      chapter,
      difficulty,
      reference,
      question_translations!inner (
        question_text,
        choice_1,
        choice_2,
        choice_3,
        choice_4,
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
      reference: string;
      question_translations: Array<{
        question_text: string;
        choice_1: string;
        choice_2: string;
        choice_3: string;
        choice_4: string;
        reflection: string | null;
      }>;
    };
    const tr = row.question_translations[0];
    if (tr) {
      const { data: answerKeyData, error: answerKeyError } = await supabase.rpc(
        "get_question_answer_keys",
        { p_question_ids: [row.id], p_lang: languageCode }
      );
      const answerKey = (!answerKeyError && answerKeyData?.[0]) || null;
      if (answerKey && answerKey.correct_index !== null) {
        return {
          id: row.id,
          level: row.level,
          category: row.category,
          book: row.book,
          chapter: row.chapter,
          difficulty: row.difficulty,
          correctIndex: answerKey.correct_index,
          reference: row.reference,
          question: tr.question_text,
          choices: [tr.choice_1, tr.choice_2, tr.choice_3, tr.choice_4],
          explanation: answerKey.explanation ?? "",
          reflection: tr.reflection,
        };
      }
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
