import type {
    GeneratedQuestion,
    SupportedLanguage,
  } from "./types";
  
  export function validateGeneratedQuestion(
    question: GeneratedQuestion,
    requiredLanguages: SupportedLanguage[]
  ): string[] {
    const errors: string[] = [];
  
    if (!question.book?.trim()) {
      errors.push("Missing Bible book.");
    }
  
    if (!question.reference?.trim()) {
      errors.push("Missing Bible reference.");
    }
  
    if (!Array.isArray(question.translations)) {
      errors.push("Missing translations.");
      return errors;
    }
  
    const translationCodes = new Set(
      question.translations.map(
        (translation) => translation.languageCode
      )
    );
  
    for (const language of requiredLanguages) {
      if (!translationCodes.has(language)) {
        errors.push(`Missing ${language} translation.`);
      }
    }
  
    for (const translation of question.translations) {
      if (!translation.question?.trim()) {
        errors.push(
          `Missing question text for ${translation.languageCode}.`
        );
      }
  
      if (!translation.correctAnswer?.trim()) {
        errors.push(
          `Missing correct answer for ${translation.languageCode}.`
        );
      }
  
      if (
        !Array.isArray(translation.wrongAnswers) ||
        translation.wrongAnswers.length !== 3
      ) {
        errors.push(
          `Exactly three wrong answers are required for ${translation.languageCode}.`
        );
      }
  
      if (!translation.explanation?.trim()) {
        errors.push(
          `Missing explanation for ${translation.languageCode}.`
        );
      }
    }
  
    return errors;
  }