export function shuffle<T>(items: T[]): T[] {
    const result = [...items];
  
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
  
      [result[index], result[randomIndex]] = [
        result[randomIndex],
        result[index],
      ];
    }
  
    return result;
  }
  
  export function buildCorrectAnswerPositions(
    count: number
  ): number[] {
    const positions: number[] = [];
  
    while (positions.length < count) {
      positions.push(...shuffle([0, 1, 2, 3]));
    }
  
    return positions.slice(0, count);
  }
  
  export function placeCorrectAnswer(
    correctAnswer: string,
    wrongAnswers: [string, string, string],
    correctIndex: number
  ): [string, string, string, string] {
    const shuffledWrongAnswers = shuffle(wrongAnswers);
    const choices = [...shuffledWrongAnswers];
  
    choices.splice(correctIndex, 0, correctAnswer);
  
    return choices as [string, string, string, string];
  }