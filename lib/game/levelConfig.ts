export type LevelConfig = {
    level: number;
    name: string;
    difficulty:
      | "very-easy"
      | "easy"
      | "easy-plus"
      | "medium"
      | "medium-plus"
      | "hard"
      | "hard-plus"
      | "expert"
      | "master"
      | "scholar";
    timerSeconds: number;
    passScore: number;
    poolSize: number;
    questionsPerGame: number;
  };
  
  export const LEVELS: LevelConfig[] = [
    {
      level: 1,
      name: "Foundation",
      difficulty: "very-easy",
      timerSeconds: 10,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 2,
      name: "Bible Beginner",
      difficulty: "easy",
      timerSeconds: 10,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 3,
      name: "Growing Disciple",
      difficulty: "easy-plus",
      timerSeconds: 12,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 4,
      name: "Faith Builder",
      difficulty: "medium",
      timerSeconds: 12,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 5,
      name: "Wisdom Seeker",
      difficulty: "medium-plus",
      timerSeconds: 15,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 6,
      name: "Scripture Explorer",
      difficulty: "hard",
      timerSeconds: 15,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 7,
      name: "Bible Defender",
      difficulty: "hard-plus",
      timerSeconds: 20,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 8,
      name: "Scripture Master",
      difficulty: "expert",
      timerSeconds: 20,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 9,
      name: "Bible Scholar",
      difficulty: "master",
      timerSeconds: 25,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
    {
      level: 10,
      name: "Menorah Champion",
      difficulty: "scholar",
      timerSeconds: 25,
      passScore: 7,
      poolSize: 10,
      questionsPerGame: 10,
    },
  ];
  
  export function getLevelConfig(level: number): LevelConfig {
    const config = LEVELS.find((item) => item.level === level);
  
    if (!config) {
      throw new Error(`Invalid level: ${level}`);
    }
  
    return config;
  }