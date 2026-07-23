import {
    generateWithGemini,
    parseGeminiJson,
  } from "./gemini";
  
  import {
    loadExistingEnglishQuestions,
    saveGeneratedQuestions,
    type SavedQuestionResult,
  } from "./database";
  
  import {
    normalizeQuestionText,
  } from "./duplicates";
  
  import {
    translateQuestions,
  } from "./translator";
  
  import {
    validateGeneratedQuestion,
  } from "./validator";
  
  import type {
    GeneratedQuestion,
    GeneratedTranslation,
    GenerateQuestionsInput,
    SupportedLanguage,
  } from "./types";
  
  type EnglishQuestionCandidate = {
    book?: string;
    chapter?: number | null;
    category?: string;
    level?: number;
    difficulty?: string;
    reference?: string;
    question?: string;
    correctAnswer?: string;
    wrongAnswers?: string[];
    explanation?: string;
    reflection?: string;
  };
  
  export type GenerationDiagnostics = {
    requested: number;
    generated: number;
    valid: number;
    duplicatesRemoved: number;
    invalidRemoved: number;
    returned: number;
  };

  export type GenerateAndSaveResult = {
    questionsSaved: number;
    translationsSaved: number;
    questionIds: string[];
    correctAnswerPositions: number[];
    languages: SupportedLanguage[];
    level: number;
    diagnostics: GenerationDiagnostics;
  };

  // Mission 10C: over-generation strategy. Rather than generating exactly N
  // candidates and failing if validation whittles that below N, we ask for
  // more than N up front, then keep the first N valid+unique results and
  // discard the rest — retrying only for whatever is still missing.
  const OVER_GENERATION_MIN_BUFFER = 5;
  const OVER_GENERATION_MULTIPLIER = 1.5;
  const RETRY_SAFETY_BUFFER = 3;

  // Each Gemini call is capped at this many candidates (prompt/output-token
  // budget), so a large over-generation target (e.g. 150 for count=100) is
  // requested across several calls rather than one huge prompt.
  const MAX_CANDIDATES_PER_CALL = 30;
  // Hard ceiling on total Gemini calls for one generation request, covering
  // both the initial over-generation batch and any missing-only retries.
  const MAX_GENERATION_CALLS = 12;

  function computeOverGenerationTarget(count: number): number {
    return Math.max(
      count + OVER_GENERATION_MIN_BUFFER,
      Math.ceil(count * OVER_GENERATION_MULTIPLIER)
    );
  }

  function computeRetryTarget(missing: number): number {
    return missing + RETRY_SAFETY_BUFFER;
  }

  function normalizeInput(
    input: GenerateQuestionsInput
  ): GenerateQuestionsInput {
    const level = Math.max(
      1,
      Math.min(10, Math.floor(Number(input.level)))
    );

    const rawCount = Number(input.count);
    if (!Number.isFinite(rawCount)) {
      throw new Error(
        "Number of questions must be a valid number."
      );
    }
    const count = Math.floor(rawCount);
    if (count < 1 || count > 100) {
      throw new Error(
        "Number of questions must be between 1 and 100."
      );
    }

    const book = String(input.book ?? "").trim();
    const category = String(
      input.category ?? ""
    ).trim();
  
    const difficulty = String(
      input.difficulty ?? ""
    ).trim();
  
    const chapter =
      typeof input.chapter === "number" &&
      Number.isFinite(input.chapter)
        ? Math.max(1, Math.floor(input.chapter))
        : null;
  
    const languages = Array.from(
      new Set(input.languages)
    );
  
    if (!languages.includes("en")) {
      languages.unshift("en");
    }
  
    if (!book) {
      throw new Error(
        "A Bible book is required."
      );
    }
  
    if (!category) {
      throw new Error(
        "A question category is required."
      );
    }
  
    if (!difficulty) {
      throw new Error(
        "A difficulty is required."
      );
    }
  
    return {
      level,
      count,
      book,
      chapter,
      category,
      difficulty,
      languages,
    };
  }
  
  function buildEnglishGenerationPrompt(
    input: GenerateQuestionsInput,
    numberOfCandidates: number,
    existingQuestionExamples: string[]
  ): string {
    const chapterDescription =
      input.chapter === null
        ? "Any chapter in the selected book"
        : `Chapter ${input.chapter}`;
  
    const existingQuestions =
      existingQuestionExamples.length > 0
        ? existingQuestionExamples
            .map(
              (question, index) =>
                `${index + 1}. ${question}`
            )
            .join("\n")
        : "No existing questions were supplied.";
  
    return `
  You are generating Bible quiz questions for the Menorah Bible Quiz application.
  
  Generate exactly ${numberOfCandidates} candidate questions in English.
  
  SETTINGS
  
  Bible book: ${input.book}
  Chapter: ${chapterDescription}
  Category: ${input.category}
  Game level: ${input.level}
  Difficulty: ${input.difficulty}
  
  STRICT QUESTION RULES
  
  1. Every question must be based on a fact clearly stated in the Bible.
  2. Do not generate denominational opinions or disputed theological interpretations.
  3. Do not create trick questions.
  4. Each question must have exactly one correct answer.
  5. Each question must have exactly three believable but clearly incorrect answers.
  6. Do not use "all of the above."
  7. Do not use "none of the above."
  8. Do not repeat the same fact using different wording.
  9. Do not create ambiguous questions.
  10. Keep the question concise and easy to understand.
  11. Include a Bible reference that directly supports the correct answer.
  12. Wrong answers must be plausible but definitely incorrect.
  13. The correct answer must not appear among the wrong answers.
  14. All four answers must be different.
  15. Do not choose the A, B, C, or D position. The server handles answer placement.
  16. Match the requested difficulty and game level.
  17. Return JSON only.
  18. Do not include Markdown or code fences.
  
  AVOID DUPLICATING OR CLOSELY PARAPHRASING THESE EXISTING QUESTIONS
  
  ${existingQuestions}
  
  RETURN THIS EXACT JSON ARRAY STRUCTURE
  
  [
    {
      "book": "${input.book}",
      "chapter": ${
        input.chapter === null
          ? "null"
          : input.chapter
      },
      "category": "${input.category}",
      "level": ${input.level},
      "difficulty": "${input.difficulty}",
      "reference": "Genesis 1:1",
      "question": "Question text",
      "correctAnswer": "Correct answer",
      "wrongAnswers": [
        "Wrong answer one",
        "Wrong answer two",
        "Wrong answer three"
      ],
      "explanation": "A concise explanation showing why the answer is correct.",
      "reflection": "A short practical or spiritual reflection."
    }
  ]
  `;
  }
  
  function cleanAnswer(value: string): string {
    return value.trim();
  }
  
  function validateEnglishCandidate(
    candidate: EnglishQuestionCandidate
  ): string[] {
    const errors: string[] = [];
  
    if (!candidate.question?.trim()) {
      errors.push("Missing question text.");
    }
  
    if (!candidate.correctAnswer?.trim()) {
      errors.push("Missing correct answer.");
    }
  
    if (!candidate.reference?.trim()) {
      errors.push("Missing Bible reference.");
    }
  
    if (!candidate.explanation?.trim()) {
      errors.push("Missing explanation.");
    }
  
    if (
      !Array.isArray(candidate.wrongAnswers) ||
      candidate.wrongAnswers.length !== 3
    ) {
      errors.push(
        "Exactly three wrong answers are required."
      );
  
      return errors;
    }
  
    const answers = [
      candidate.correctAnswer ?? "",
      ...candidate.wrongAnswers,
    ]
      .map(normalizeQuestionText)
      .filter(Boolean);
  
    if (answers.length !== 4) {
      errors.push(
        "All four answers must contain text."
      );
    }
  
    if (new Set(answers).size !== 4) {
      errors.push(
        "The correct and incorrect answers must be unique."
      );
    }
  
    return errors;
  }
  
  function convertCandidateToQuestion(
    candidate: EnglishQuestionCandidate,
    input: GenerateQuestionsInput
  ): GeneratedQuestion {
    const wrongAnswers = (
      candidate.wrongAnswers ?? []
    ).map(cleanAnswer);
  
    if (wrongAnswers.length !== 3) {
      throw new Error(
        "Cannot convert a candidate without three wrong answers."
      );
    }
  
    const englishTranslation: GeneratedTranslation = {
      languageCode: "en",
      question:
        candidate.question?.trim() ?? "",
      correctAnswer:
        candidate.correctAnswer?.trim() ?? "",
      wrongAnswers: wrongAnswers as [
        string,
        string,
        string,
      ],
      explanation:
        candidate.explanation?.trim() ?? "",
      reflection:
        candidate.reflection?.trim() ||
        undefined,
    };
  
    return {
      book:
        candidate.book?.trim() ||
        input.book,
      chapter:
        typeof candidate.chapter === "number"
          ? candidate.chapter
          : input.chapter,
      category:
        candidate.category?.trim() ||
        input.category,
      level: input.level,
      difficulty:
        candidate.difficulty?.trim() ||
        input.difficulty,
      reference:
        candidate.reference?.trim() ?? "",
      translations: [
        englishTranslation,
      ],
    };
  }
  
  async function generateUniqueEnglishQuestions(
    input: GenerateQuestionsInput
  ): Promise<{
    questions: GeneratedQuestion[];
    diagnostics: GenerationDiagnostics;
  }> {
    const existingQuestionTexts =
      await loadExistingEnglishQuestions(
        input.level
      );

    // Every valid, unique candidate found so far, kept in full (even past
    // input.count) so diagnostics report the true valid yield. Only the
    // first input.count are returned to the caller.
    const validQuestions: GeneratedQuestion[] =
      [];

    const validQuestionTexts =
      new Set<string>();

    let generatedRaw = 0;
    let duplicatesRemoved = 0;
    let invalidRemoved = 0;
    let apiCalls = 0;

    // How many more raw candidates to request before re-checking whether
    // enough valid ones have been found. Starts at the over-generation
    // target and, if exhausted with too few valid results, is refilled to
    // exactly the missing amount plus a small safety buffer (never a full
    // fresh over-generation pass).
    let requestTarget =
      computeOverGenerationTarget(input.count);

    while (
      validQuestions.length < input.count &&
      apiCalls < MAX_GENERATION_CALLS &&
      requestTarget > 0
    ) {
      apiCalls += 1;

      const candidateCount = Math.min(
        MAX_CANDIDATES_PER_CALL,
        requestTarget
      );

      requestTarget -= candidateCount;

      const examplesToAvoid = Array.from(
        existingQuestionTexts
      ).slice(0, 250);

      const prompt =
        buildEnglishGenerationPrompt(
          input,
          candidateCount,
          examplesToAvoid
        );

      const responseText =
        await generateWithGemini(prompt, {
          temperature: 0.8,
          topP: 0.95,
          responseMimeType:
            "application/json",
        });

      const candidates =
        parseGeminiJson<
          EnglishQuestionCandidate[]
        >(responseText);

      if (!Array.isArray(candidates)) {
        throw new Error(
          "Gemini did not return a question array."
        );
      }

      generatedRaw += candidates.length;

      for (const candidate of candidates) {
        const validationErrors =
          validateEnglishCandidate(
            candidate
          );

        if (
          validationErrors.length > 0
        ) {
          invalidRemoved += 1;
          continue;
        }

        const normalizedQuestion =
          normalizeQuestionText(
            candidate.question ?? ""
          );

        if (
          existingQuestionTexts.has(
            normalizedQuestion
          ) ||
          validQuestionTexts.has(
            normalizedQuestion
          )
        ) {
          duplicatesRemoved += 1;
          continue;
        }

        const generatedQuestion =
          convertCandidateToQuestion(
            candidate,
            input
          );

        const completeValidationErrors =
          validateGeneratedQuestion(
            generatedQuestion,
            ["en"]
          );

        if (
          completeValidationErrors.length >
          0
        ) {
          invalidRemoved += 1;
          continue;
        }

        validQuestionTexts.add(
          normalizedQuestion
        );

        existingQuestionTexts.add(
          normalizedQuestion
        );

        validQuestions.push(
          generatedQuestion
        );
      }

      // This phase's requested candidates are all accounted for. If still
      // short of input.count, queue a focused retry for exactly what's
      // missing rather than another full over-generation batch.
      if (
        requestTarget <= 0 &&
        validQuestions.length < input.count
      ) {
        const missing =
          input.count - validQuestions.length;

        requestTarget =
          computeRetryTarget(missing);
      }
    }

    if (
      validQuestions.length <
      input.count
    ) {
      throw new Error(
        `The AI generated only ${validQuestions.length} valid unique questions after ${apiCalls} generation calls. Please try again with fewer questions or a different chapter.`
      );
    }

    const diagnostics: GenerationDiagnostics = {
      requested: input.count,
      generated: generatedRaw,
      valid: validQuestions.length,
      duplicatesRemoved,
      invalidRemoved,
      returned: input.count,
    };

    return {
      questions: validQuestions.slice(
        0,
        input.count
      ),
      diagnostics,
    };
  }
  
  function validateAllTranslations(
    questions: GeneratedQuestion[],
    requiredLanguages: SupportedLanguage[]
  ): void {
    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const errors =
        validateGeneratedQuestion(
          questions[index],
          requiredLanguages
        );
  
      if (errors.length > 0) {
        throw new Error(
          `Question ${index + 1} failed validation: ${errors.join(
            " "
          )}`
        );
      }
    }
  }
  
  export async function generateAndSaveQuestions(
    rawInput: GenerateQuestionsInput
  ): Promise<GenerateAndSaveResult> {
    const input = normalizeInput(
      rawInput
    );
  
    const englishGeneration =
      await generateUniqueEnglishQuestions(
        input
      );
  
    const translatedQuestions =
      await translateQuestions(
        englishGeneration.questions,
        input.languages
      );
  
    validateAllTranslations(
      translatedQuestions,
      input.languages
    );
  
    const savedResult: SavedQuestionResult =
      await saveGeneratedQuestions(
        translatedQuestions,
        input.languages
      );
  
    return {
      questionsSaved:
        savedResult.questionsSaved,
      translationsSaved:
        savedResult.translationsSaved,
      questionIds:
        savedResult.questionIds,
      correctAnswerPositions:
        savedResult.correctAnswerPositions,
      languages: input.languages,
      level: input.level,
      diagnostics:
        englishGeneration.diagnostics,
    };
  }