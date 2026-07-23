import { testamentForBook } from "@/lib/questions/canon";

import type {
    GeneratedQuestion,
    SupportedLanguage,
  } from "./types";

  // "Book chapter:verse" or "Book chapter:verse-verse", e.g. "Genesis 1:1"
  // or "1 Corinthians 13:4-7". Mission 10C: rejects AI candidates whose
  // reference is present but nonsensical (wrong format, unknown book)
  // instead of only checking that *some* text was supplied.
  const BIBLE_REFERENCE_PATTERN =
    /^((?:[1-3]\s)?[A-Za-z][A-Za-z. ]*?)\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/;

  export function isValidBibleReference(reference: string): boolean {
    const match = reference.trim().match(BIBLE_REFERENCE_PATTERN);

    if (!match) {
      return false;
    }

    const [, rawBook, rawChapter, rawVerse, rawEndVerse] = match;

    const chapter = Number(rawChapter);
    const verse = Number(rawVerse);
    const endVerse = rawEndVerse ? Number(rawEndVerse) : null;

    if (chapter < 1 || verse < 1) {
      return false;
    }

    if (endVerse !== null && endVerse < verse) {
      return false;
    }

    return testamentForBook(rawBook) !== null;
  }

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
    } else if (!isValidBibleReference(question.reference)) {
      errors.push(
        `Invalid Bible reference: "${question.reference}".`
      );
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