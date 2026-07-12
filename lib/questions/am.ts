import type { Question } from "./types";

// ---------------------------------------------------------------------------
// Amharic (አማርኛ) question bank.
//
// IMPORTANT: These Amharic translations (especially Bible references and any
// quoted/paraphrased Scripture) were drafted with AI assistance and have NOT
// been reviewed by a native-speaking translator or pastor. Please review
// each question, answer choice, and explanation against a trusted Amharic
// Bible translation before publishing to end users.
// ---------------------------------------------------------------------------
export const QUESTIONS_AM: Question[] = [
  {
    id: "q1",
    categoryId: "old-testament",
    question: "እስራኤላውያንን ከግብፅ ባርነት ማን አወጣ?",
    choices: ["ኢያሱ", "አሮን", "ሙሴ", "አብርሃም"],
    correctIndex: 2,
    reference: "ዘፀአት 3:10",
    explanation: "እግዚአብሔር ሙሴን በሚነደው ቁጥቋጦ ጠርቶ እስራኤልን ከፈርዖን አገዛዝ እንዲያድናቸው ላከው።",
    difficulty: "Easy",
  },
  {
    id: "q2",
    categoryId: "new-testament",
    question: "ኢየሱስ የተወለደው በየትኛው ከተማ ነው?",
    choices: ["ናዝሬት", "ኢየሩሳሌም", "ቤተልሔም", "ቅፍርናሆም"],
    correctIndex: 2,
    reference: "ሉቃስ 2:4-7",
    explanation: "ዮሴፍና ማርያም ለቆጠራ ወደ ቤተልሔም ተጓዙ፣ ይህም የመሲሁ መወለጃ ትንቢት ፍጻሜ ሆነ።",
    difficulty: "Easy",
  },
  {
    id: "q3",
    categoryId: "life-of-jesus",
    question: "ኢየሱስ የመጀመሪያውን ተአምር ያደረገው የት ነው?",
    choices: ["ቃና", "ቅፍርናሆም", "ኢያሪኮ", "ቤተኒያ"],
    correctIndex: 0,
    reference: "ዮሐንስ 2:1-11",
    explanation: "በቃና በተደረገ ሰርግ ላይ ኢየሱስ ውሃን ወደ ወይን ጠጅ ለወጠ፤ ይህ ክብሩን የገለጠ የመጀመሪያ ምልክት ነበር።",
    difficulty: "Medium",
  },
  {
    id: "q4",
    categoryId: "apostles",
    question: "ኢየሱስን ከመከተሉ በፊት ቀረጥ ሰብሳቢ የነበረው ሐዋርያ ማን ነው?",
    choices: ["ማቴዎስ", "ስምዖን", "ፊልጶስ", "በርተሎሜዎስ"],
    correctIndex: 0,
    reference: "ማቴዎስ 9:9",
    explanation: "ኢየሱስ ማቴዎስን (ሌዊ ተብሎም ይጠራ ነበር) ቀረጥ በሚሰበስብበት ቦታ ጠርቶት ወዲያውኑ ተከተለው።",
    difficulty: "Medium",
  },
  {
    id: "q5",
    categoryId: "bible-characters",
    question: "ግዙፉን ጎልያድን በወንጭፍና በድንጋይ ብቻ ማን አሸነፈ?",
    choices: ["ሳኦል", "ዳዊት", "ሶምሶን", "ዮናታን"],
    correctIndex: 1,
    reference: "1ኛ ሳሙኤል 17:48-50",
    explanation: "ወጣቱ እረኛ ዳዊት በእግዚአብሔር ታምኖ የፍልስጤማዊውን ጎልያድን ድል አደረገ።",
    difficulty: "Easy",
  },
  {
    id: "q6",
    categoryId: "youth-challenge",
    question: "ጳውሎስ ጢሞቴዎስን ማንም እንዳይንቀው ያሳሰበው ስለ ምንድን ነው?",
    choices: ["ስለ ሀብቱ", "ስለ ወጣትነቱ", "ስለ ቤተሰቡ", "ስለ አገሩ"],
    correctIndex: 1,
    reference: "1ኛ ጢሞቴዎስ 4:12",
    explanation: "ጳውሎስ ጢሞቴዎስ ምንም ወጣት ቢሆንም በንግግር፣ በኑሮ፣ በፍቅር፣ በእምነትና በንጽሕና ምሳሌ እንዲሆን አበረታታው።",
    difficulty: "Medium",
  },
  {
    id: "q7",
    categoryId: "psalms-proverbs",
    question: "እንደ ምሳሌ መጽሐፍ የጥበብ መጀመሪያ ምንድን ነው?",
    choices: ["ትጋት", "እግዚአብሔርን መፍራት", "ጥሩ ጓደኞች", "ትምህርት"],
    correctIndex: 1,
    reference: "ምሳሌ 9:10",
    explanation: "መጽሐፍ ቅዱስ እግዚአብሔርን መፍራት እውነተኛ ጥበብ የሚገነባበት መሠረት እንደሆነ ያስተምራል።",
    difficulty: "Easy",
  },
  {
    id: "q8",
    categoryId: "faith-prayer",
    question: "ዕብራውያን 11:1 እምነት የተስፋ ነገሮች... እና የማይታዩ ነገሮች ምንድን ናቸው ይላል?",
    choices: ["ማረጋገጫቸው", "መታሰቢያቸው", "ተስፋቸው", "ጽሑፋቸው"],
    correctIndex: 0,
    reference: "ዕብራውያን 11:1",
    explanation: "ይህ ቁጥር እምነትን በእግዚአብሔር ተስፋዎች ላይ የተመሠረተ በእርግጠኝነት መታመን አድርጎ ይገልጻል፣ ምንም ባይታይም።",
    difficulty: "Medium",
  },
  {
    id: "q9",
    categoryId: "gospel-challenge",
    question: "እንደ ሮሜ 10:9 ለመዳን ሰው ምን ማመንና መመስከር አለበት?",
    choices: [
      "ኢየሱስ ጌታ እንደሆነና እግዚአብሔር ከሙታን እንዳስነሳው",
      "ሕጉን ፍጹም መጠበቅ እንዳለበት",
      "መልካም ሥራ ብቻ እንደሚያድን",
      "ጥምቀት ብቻ እንደሚያድን",
    ],
    correctIndex: 0,
    reference: "ሮሜ 10:9",
    explanation: "ጳውሎስ መዳን የሚገኘው ኢየሱስን ጌታ ብሎ በመመስከርና ትንሳኤውን በማመን እንደሆነ ያስተምራል።",
    difficulty: "Hard",
  },
  {
    id: "q10",
    categoryId: "hard-questions",
    question: "በፕሮቴስታንት መጽሐፍ ቅዱስ ውስጥ ስንት መጻሕፍት አሉ?",
    choices: ["63", "66", "72", "39"],
    correctIndex: 1,
    reference: "የመጽሐፍ ቅዱስ ቀኖና",
    explanation: "የፕሮቴስታንት መጽሐፍ ቅዱስ 39 የብሉይ ኪዳን እና 27 የአዲስ ኪዳን መጻሕፍትን ይይዛል — በድምሩ 66።",
    difficulty: "Hard",
  },
];
