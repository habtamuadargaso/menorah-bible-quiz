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
  correct_index: number;
  reference: string;
  question_translations: Array<{
    language_code: string;
    question_text: string;
    choice_1: string;
    choice_2: string;
    choice_3: string;
    choice_4: string;
    explanation: string;
    reflection: string | null;
  }>;
};

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
    .eq("level", level)
    .eq("status", "published")
    .eq(
      "question_translations.language_code",
      languageCode
    );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as QuestionRow[];

  return rows.flatMap((row) => {
    const translation = row.question_translations[0];

    if (!translation) {
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
        correctIndex: row.correct_index,
        reference: row.reference,
        question: translation.question_text,
        choices: [
          translation.choice_1,
          translation.choice_2,
          translation.choice_3,
          translation.choice_4,
        ],
        explanation: translation.explanation,
        reflection: translation.reflection,
      },
    ];
  });
}