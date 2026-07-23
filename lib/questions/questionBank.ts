import type { BibleQuestion } from "./types";

export const QUESTION_BANK: BibleQuestion[] = [
  {
    id: "level1-genesis-001",
    level: 1,
    category: "Creation",
    canonicalCategory: "Old Testament",
    book: "Genesis",
    testament: "old",
    tags: ["Creation"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 1,
    difficulty: "very-easy",
    correctIndex: 0,
    reference: "Genesis 1:1",
    translations: {
      en: {
        question: "Who created the heavens and the earth?",
        choices: ["God", "Moses", "Noah", "Abraham"],
        explanation:
          "Genesis begins by declaring that God created the heavens and the earth.",
      },
      am: {
        question: "ሰማይንና ምድርን የፈጠረው ማን ነው?",
        choices: ["እግዚአብሔር", "ሙሴ", "ኖኅ", "አብርሃም"],
        explanation:
          "ዘፍጥረት መጽሐፍ እግዚአብሔር ሰማይንና ምድርን እንደፈጠረ በመግለጽ ይጀምራል።",
      },
    },
  },
  {
    id: "level1-noah-002",
    level: 1,
    category: "Noah",
    canonicalCategory: "Old Testament",
    book: "Genesis",
    testament: "old",
    tags: ["Noah"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 6,
    difficulty: "very-easy",
    correctIndex: 1,
    reference: "Genesis 6:14",
    translations: {
      en: {
        question: "Who built the ark?",
        choices: ["Abraham", "Noah", "Moses", "David"],
        explanation:
          "God instructed Noah to build the ark before the flood.",
      },
      am: {
        question: "መርከቧን የሠራው ማን ነው?",
        choices: ["አብርሃም", "ኖኅ", "ሙሴ", "ዳዊት"],
        explanation:
          "እግዚአብሔር ከጥፋት ውኃ በፊት መርከብ እንዲሠራ ኖኅን አዘዘው።",
      },
    },
  },
  {
    id: "level1-moses-003",
    level: 1,
    category: "Moses",
    canonicalCategory: "Miracles",
    book: "Exodus",
    testament: "old",
    tags: ["Moses", "Exodus"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 14,
    difficulty: "very-easy",
    correctIndex: 2,
    reference: "Exodus 14:21",
    translations: {
      en: {
        question: "Who led the Israelites through the Red Sea?",
        choices: ["Joshua", "Aaron", "Moses", "Joseph"],
        explanation:
          "God used Moses to lead Israel through the divided Red Sea.",
      },
      am: {
        question: "እስራኤላውያንን በቀይ ባሕር ያሳለፈው ማን ነው?",
        choices: ["ኢያሱ", "አሮን", "ሙሴ", "ዮሴፍ"],
        explanation:
          "እግዚአብሔር ሙሴን ተጠቅሞ እስራኤልን በተከፈለው ቀይ ባሕር አሳለፈ።",
      },
    },
  },
  {
    // Kept its original id (level1-david-004) for stability even though it
    // now resolves to level 5 under the new book-progression system (1
    // Samuel) — see canon.ts's level table. Renaming ids to match level
    // would break anything that already references this id.
    id: "level1-david-004",
    level: 5,
    category: "David",
    canonicalCategory: "Kings",
    book: "1 Samuel",
    testament: "old",
    tags: ["David"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 17,
    difficulty: "very-easy",
    correctIndex: 3,
    reference: "1 Samuel 17:49",
    translations: {
      en: {
        question: "Who defeated Goliath?",
        choices: ["Saul", "Samuel", "Jonathan", "David"],
        explanation:
          "David defeated Goliath with a sling and a stone.",
      },
      am: {
        question: "ጎልያድን ያሸነፈው ማን ነው?",
        choices: ["ሳኦል", "ሳሙኤል", "ዮናታን", "ዳዊት"],
        explanation:
          "ዳዊት በወንጭፍና በድንጋይ ጎልያድን አሸነፈ።",
      },
    },
  },
  {
    id: "level1-jesus-005",
    level: 8,
    category: "Jesus",
    canonicalCategory: "Jesus",
    book: "Matthew",
    testament: "new",
    tags: ["Jesus", "Birth of Jesus"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 2,
    difficulty: "very-easy",
    correctIndex: 0,
    reference: "Matthew 2:1",
    translations: {
      en: {
        question: "In which town was Jesus born?",
        choices: ["Bethlehem", "Nazareth", "Jerusalem", "Capernaum"],
        explanation:
          "Jesus was born in Bethlehem during the reign of Herod.",
      },
      am: {
        question: "ኢየሱስ በየትኛው ከተማ ተወለደ?",
        choices: ["ቤተልሔም", "ናዝሬት", "ኢየሩሳሌም", "ቅፍርናሆም"],
        explanation:
          "ኢየሱስ በንጉሥ ሄሮድስ ዘመን በቤተልሔም ተወለደ።",
      },
    },
  },
  {
    id: "level1-disciples-006",
    level: 8,
    category: "Disciples",
    canonicalCategory: "Disciples",
    book: "Matthew",
    testament: "new",
    tags: ["Disciples"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 10,
    difficulty: "very-easy",
    correctIndex: 1,
    reference: "Matthew 10:1–4",
    translations: {
      en: {
        question: "How many apostles did Jesus choose?",
        choices: ["10", "12", "7", "40"],
        explanation:
          "Jesus selected twelve apostles to follow and serve with Him.",
      },
      am: {
        question: "ኢየሱስ ስንት ሐዋርያትን መረጠ?",
        choices: ["10", "12", "7", "40"],
        explanation:
          "ኢየሱስ እንዲከተሉትና ከእርሱ ጋር እንዲያገለግሉ አሥራ ሁለት ሐዋርያትን መረጠ።",
      },
    },
  },
  {
    id: "level1-jonah-007",
    level: 7,
    category: "Jonah",
    canonicalCategory: "Miracles",
    book: "Jonah",
    testament: "old",
    tags: ["Jonah"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 1,
    difficulty: "very-easy",
    correctIndex: 2,
    reference: "Jonah 1:17",
    translations: {
      en: {
        question: "Who was swallowed by a great fish?",
        choices: ["Peter", "Paul", "Jonah", "Elijah"],
        explanation:
          "Jonah was swallowed by a great fish after fleeing from God's command.",
      },
      am: {
        question: "በታላቅ ዓሣ የተዋጠው ማን ነው?",
        choices: ["ጴጥሮስ", "ጳውሎስ", "ዮናስ", "ኤልያስ"],
        explanation:
          "ዮናስ ከእግዚአብሔር ትእዛዝ ከሸሸ በኋላ በታላቅ ዓሣ ተዋጠ።",
      },
    },
  },
  {
    id: "level1-commandments-008",
    level: 3,
    category: "Commandments",
    canonicalCategory: "Law",
    book: "Exodus",
    testament: "old",
    tags: ["Commandments", "Moses"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 20,
    difficulty: "very-easy",
    correctIndex: 3,
    reference: "Exodus 20:1–17",
    translations: {
      en: {
        question: "How many commandments were given to Moses?",
        choices: ["5", "7", "12", "10"],
        explanation:
          "God gave Moses the Ten Commandments at Mount Sinai.",
      },
      am: {
        question: "ለሙሴ ስንት ትእዛዛት ተሰጡ?",
        choices: ["5", "7", "12", "10"],
        explanation:
          "እግዚአብሔር በሲና ተራራ አሥሩን ትእዛዛት ለሙሴ ሰጠው።",
      },
    },
  },
  {
    id: "level1-first-man-009",
    level: 1,
    category: "Creation",
    canonicalCategory: "Old Testament",
    book: "Genesis",
    testament: "old",
    tags: ["Creation"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 2,
    difficulty: "very-easy",
    correctIndex: 0,
    reference: "Genesis 2:7",
    translations: {
      en: {
        question: "Who was the first man?",
        choices: ["Adam", "Abel", "Cain", "Noah"],
        explanation:
          "God formed Adam from the dust of the ground.",
      },
      am: {
        question: "የመጀመሪያው ሰው ማን ነበር?",
        choices: ["አዳም", "አቤል", "ቃየን", "ኖኅ"],
        explanation:
          "እግዚአብሔር አዳምን ከምድር አፈር ፈጠረው።",
      },
    },
  },
  {
    id: "level1-first-woman-010",
    level: 1,
    category: "Creation",
    canonicalCategory: "Women",
    book: "Genesis",
    testament: "old",
    tags: ["Creation"],
    verified: true,
    translationStatus: { en: "complete", am: "complete" },
    chapter: 2,
    difficulty: "very-easy",
    correctIndex: 1,
    reference: "Genesis 2:22",
    translations: {
      en: {
        question: "Who was the first woman?",
        choices: ["Sarah", "Eve", "Ruth", "Mary"],
        explanation:
          "God made Eve and brought her to Adam.",
      },
      am: {
        question: "የመጀመሪያዋ ሴት ማን ነበረች?",
        choices: ["ሣራ", "ሔዋን", "ሩት", "ማርያም"],
        explanation:
          "እግዚአብሔር ሔዋንን ፈጥሮ ወደ አዳም አመጣት።",
      },
    },
  },
];