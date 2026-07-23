import { createClient } from "@/lib/supabase/client";

export type LoadedQuestion = {
  id: string;
  level: number;
  category: string;
  book: string;
  chapter: number | null;
  difficulty: string;
  correctIndex: number;
  reference: string;
  question: string;
  choices: [string, string, string, string];
  explanation: string;
  reflection: string | null;
};

type QuestionRow = {
  id: string;
  level: number;
  category: string;
  book: string;
  chapter: number | null;
  difficulty: string;
  reference: string;
  question_translations: Array<{
    language_code: string;
    question_text: string;
    choice_1: string;
    choice_2: string;
    choice_3: string;
    choice_4: string;
    reflection: string | null;
  }>;
};

type AnswerKeyRow = {
  question_id: string;
  correct_index: number | null;
  explanation: string | null;
};

/**
 * Solo play needs the correct answer client-side (it grades instantly, no
 * server round-trip per question), but `questions.correct_index` /
 * `question_translations.explanation` are no longer directly SELECT-able —
 * see supabase/migrations/20260719_online_live_battle.sql. Instead we fetch
 * the public question content directly, then fetch the answer keys in one
 * batched call to the `get_question_answer_keys` RPC, which is safe for
 * solo play (no room context blocks it) while still refusing to hand a
 * live-battle player the answer to a round that hasn't been revealed yet.
 */
export async function loadQuestionsForLevel(
  level: number,
  languageCode: string
): Promise<LoadedQuestion[]> {
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
      reference,
      question_translations!inner (
        language_code,
        question_text,
        choice_1,
        choice_2,
        choice_3,
        choice_4,
        reflection
      )
    `)
    .eq("level", level)
    .eq("status", "published")
    .eq(
      "question_translations.language_code",
      languageCode
    )
    // Mission 10: a translation's own workflow status must be 'published'
    // too, not just its parent question's — otherwise an ai_draft/
    // needs_review/approved-but-not-yet-published translation would go
    // live to players the instant a row exists, which is exactly what
    // "AI-generated translation must not become playable" forbids.
    .eq("question_translations.status", "published");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as QuestionRow[];
  if (rows.length === 0) {
    return [];
  }

  const { data: answerKeyData, error: answerKeyError } = await supabase.rpc(
    "get_question_answer_keys",
    { p_question_ids: rows.map((row) => row.id), p_lang: languageCode }
  );
  if (answerKeyError) {
    throw new Error(answerKeyError.message);
  }
  const answerKeys = new Map<string, AnswerKeyRow>(
    ((answerKeyData ?? []) as AnswerKeyRow[]).map((row) => [row.question_id, row])
  );

  const questions: LoadedQuestion[] = rows.flatMap((row) => {
    const translation = row.question_translations[0];
    const answerKey = answerKeys.get(row.id);

    if (!translation || !answerKey || answerKey.correct_index === null) {
      return [];
    }

    return [
      {
        id: row.id,
        level: row.level,
        category: row.category,
        book: row.book,
        chapter: row.chapter,
        difficulty: row.difficulty,
        correctIndex: answerKey.correct_index,
        reference: row.reference,
        question: translation.question_text,
        choices: [
          translation.choice_1,
          translation.choice_2,
          translation.choice_3,
          translation.choice_4,
        ],
        explanation: answerKey.explanation ?? "",
        reflection: translation.reflection,
      },
    ];
  });

  return questions;
}
