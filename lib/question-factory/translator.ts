import {
    generateWithGemini,
    parseGeminiJson,
  } from "./gemini";
  
  import type {
    GeneratedQuestion,
    GeneratedTranslation,
    SupportedLanguage,
  } from "./types";
  
  type TranslationGroup = {
    questionIndex: number;
    translations: GeneratedTranslation[];
  };
  
  const LANGUAGE_NAMES: Record<
    SupportedLanguage,
    string
  > = {
    en: "English",
    am: "Amharic",
    om: "Afaan Oromo",
    ti: "Tigrinya",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ar: "Arabic",
    sw: "Swahili",
    hi: "Hindi",
    zh: "Simplified Chinese",
    ja: "Japanese",
    ko: "Korean",
  };
  
  function buildTranslationPrompt(
    questions: GeneratedQuestion[],
    targetLanguages: SupportedLanguage[]
  ): string {
    const languageList = targetLanguages
      .map(
        (language) =>
          `${language}: ${LANGUAGE_NAMES[language]}`
      )
      .join(", ");
  
    const sourceQuestions = questions.map(
      (question, questionIndex) => {
        const englishTranslation =
          question.translations.find(
            (translation) =>
              translation.languageCode === "en"
          );
  
        if (!englishTranslation) {
          throw new Error(
            `Question ${questionIndex + 1} has no English translation.`
          );
        }
  
        return {
          questionIndex,
          book: question.book,
          chapter: question.chapter,
          reference: question.reference,
          question: englishTranslation.question,
          correctAnswer:
            englishTranslation.correctAnswer,
          wrongAnswers:
            englishTranslation.wrongAnswers,
          explanation:
            englishTranslation.explanation,
          reflection:
            englishTranslation.reflection ?? "",
        };
      }
    );
  
    return `
  Translate the following approved English Bible quiz questions.
  
  TARGET LANGUAGES
  ${languageList}
  
  STRICT RULES
  
  1. Translate every question into every requested language.
  2. Preserve the exact meaning of the English question.
  3. Preserve the same correct answer.
  4. Preserve the same three incorrect answers.
  5. Do not change the Bible reference.
  6. Use natural, fluent wording for native speakers.
  7. Keep Bible names consistent in each language.
  8. Do not add new facts.
  9. Do not remove facts.
  10. Do not change the difficulty.
  11. Each translation must contain exactly three wrong answers.
  12. Return JSON only.
  13. Do not use Markdown code fences.
  
  SOURCE QUESTIONS
  
  ${JSON.stringify(sourceQuestions)}
  
  Return an array using this exact structure:
  
  [
    {
      "questionIndex": 0,
      "translations": [
        {
          "languageCode": "am",
          "question": "Translated question",
          "correctAnswer": "Translated correct answer",
          "wrongAnswers": [
            "Translated wrong answer 1",
            "Translated wrong answer 2",
            "Translated wrong answer 3"
          ],
          "explanation": "Translated explanation",
          "reflection": "Translated reflection"
        }
      ]
    }
  ]
  `;
  }
  
  function validateTranslation(
    translation: GeneratedTranslation,
    requiredLanguage: SupportedLanguage
  ): void {
    if (
      translation.languageCode !== requiredLanguage
    ) {
      throw new Error(
        `Expected ${requiredLanguage} translation but received ${translation.languageCode}.`
      );
    }
  
    if (!translation.question?.trim()) {
      throw new Error(
        `Missing question text for ${requiredLanguage}.`
      );
    }
  
    if (!translation.correctAnswer?.trim()) {
      throw new Error(
        `Missing correct answer for ${requiredLanguage}.`
      );
    }
  
    if (
      !Array.isArray(translation.wrongAnswers) ||
      translation.wrongAnswers.length !== 3
    ) {
      throw new Error(
        `Exactly three wrong answers are required for ${requiredLanguage}.`
      );
    }
  
    if (!translation.explanation?.trim()) {
      throw new Error(
        `Missing explanation for ${requiredLanguage}.`
      );
    }
  
    const answers = [
      translation.correctAnswer,
      ...translation.wrongAnswers,
    ]
      .map((answer) =>
        answer.trim().toLowerCase()
      )
      .filter(Boolean);
  
    if (new Set(answers).size !== 4) {
      throw new Error(
        `Answers must be unique for ${requiredLanguage}.`
      );
    }
  }
  
  export async function translateQuestions(
    questions: GeneratedQuestion[],
    requestedLanguages: SupportedLanguage[]
  ): Promise<GeneratedQuestion[]> {
    const targetLanguages = Array.from(
      new Set(
        requestedLanguages.filter(
          (language) => language !== "en"
        )
      )
    );
  
    if (targetLanguages.length === 0) {
      return questions;
    }
  
    if (questions.length === 0) {
      return [];
    }
  
    const prompt = buildTranslationPrompt(
      questions,
      targetLanguages
    );
  
    const responseText =
      await generateWithGemini(prompt, {
        temperature: 0.3,
        topP: 0.9,
        responseMimeType: "application/json",
      });
  
    const groups =
      parseGeminiJson<TranslationGroup[]>(
        responseText
      );
  
    if (!Array.isArray(groups)) {
      throw new Error(
        "Gemini translation response was not an array."
      );
    }
  
    const groupsByQuestionIndex = new Map<
      number,
      GeneratedTranslation[]
    >();
  
    for (const group of groups) {
      if (
        !Number.isInteger(group.questionIndex) ||
        !Array.isArray(group.translations)
      ) {
        continue;
      }
  
      groupsByQuestionIndex.set(
        group.questionIndex,
        group.translations
      );
    }
  
    return questions.map(
      (question, questionIndex) => {
        const generatedTranslations =
          groupsByQuestionIndex.get(
            questionIndex
          );
  
        if (!generatedTranslations) {
          throw new Error(
            `Missing translations for question ${questionIndex + 1}.`
          );
        }
  
        const translationsByLanguage = new Map(
          generatedTranslations.map(
            (translation) => [
              translation.languageCode,
              translation,
            ]
          )
        );
  
        const acceptedTranslations =
          targetLanguages.map((language) => {
            const translation =
              translationsByLanguage.get(language);
  
            if (!translation) {
              throw new Error(
                `Missing ${language} translation for question ${questionIndex + 1}.`
              );
            }
  
            validateTranslation(
              translation,
              language
            );
  
            return {
              ...translation,
              question:
                translation.question.trim(),
              correctAnswer:
                translation.correctAnswer.trim(),
              wrongAnswers:
                translation.wrongAnswers.map(
                  (answer) => answer.trim()
                ) as [
                  string,
                  string,
                  string,
                ],
              explanation:
                translation.explanation.trim(),
              reflection:
                translation.reflection?.trim() ||
                undefined,
            };
          });
  
        const englishTranslation =
          question.translations.find(
            (translation) =>
              translation.languageCode === "en"
          );
  
        if (!englishTranslation) {
          throw new Error(
            `Question ${questionIndex + 1} has no English translation.`
          );
        }
  
        return {
          ...question,
          translations: [
            englishTranslation,
            ...acceptedTranslations,
          ],
        };
      }
    );
  }