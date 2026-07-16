export function normalizeQuestionText(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  }
  
  export function isDuplicateQuestion(
    questionText: string,
    existingQuestions: Set<string>
  ): boolean {
    return existingQuestions.has(
      normalizeQuestionText(questionText)
    );
  }