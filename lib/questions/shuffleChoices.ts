type QuestionWithChoices = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  reference: string;
  explanation: string;
};

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleQuestionChoices<T extends QuestionWithChoices>(
  question: T,
  seedText: string
): T {
  const items = question.choices.map((choice, originalIndex) => ({
    choice,
    isCorrect: originalIndex === question.correctIndex,
  }));

  const random = seededRandom(hashString(seedText));

  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));

    [items[index], items[randomIndex]] = [
      items[randomIndex],
      items[index],
    ];
  }

  const newCorrectIndex = items.findIndex((item) => item.isCorrect);

  return {
    ...question,
    choices: items.map((item) => item.choice),
    correctIndex: newCorrectIndex,
  };
}