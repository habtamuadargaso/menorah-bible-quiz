import type {
    BibleQuestion,
    SupportedQuestionLanguage,
  } from "./types";
  
  type SelectQuestionsOptions = {
    level: number;
    language: SupportedQuestionLanguage;
    count?: number;
    usedQuestionIds?: string[];
  };
  
  export function selectLevelQuestions(
    questionBank: BibleQuestion[],
    {
      level,
      language,
      count = 10,
      usedQuestionIds = [],
    }: SelectQuestionsOptions
  ): BibleQuestion[] {
    const levelQuestions = questionBank.filter(
      (question) =>
        question.level === level &&
        Boolean(question.translations[language])
    );
  
    if (levelQuestions.length < count) {
      throw new Error(
        `Level ${level} has only ${levelQuestions.length} translated questions for ${language}. At least ${count} are required.`
      );
    }
  
    const unseenQuestions = levelQuestions.filter(
      (question) => !usedQuestionIds.includes(question.id)
    );
  
    const source =
      unseenQuestions.length >= count
        ? unseenQuestions
        : levelQuestions;
  
    return shuffle(source).slice(0, count);
  }
  
  function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [copy[index], copy[randomIndex]] = [
        copy[randomIndex],
        copy[index],
      ];
    }

    return copy;
  }

