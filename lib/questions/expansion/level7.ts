import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 7 (Isaiah - Malachi: major and minor prophets). */
export const LEVEL_7_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l7-e01", level: 7, category: "Daniel", canonicalCategory: "Prophecy", book: "Daniel", testament: "old", chapter: 6,
    difficulty: "easy", correctIndex: 1, reference: "Daniel 6:16", tags: ["Daniel"], verified: false,
    translations: {
      en: { question: "Which prophet was thrown into a lions' den for praying to God?", choices: ["Jeremiah", "Daniel", "Ezekiel", "Isaiah"], explanation: "Daniel was thrown into a den of lions for continuing to pray to God, but God protected him." },
      am: { question: "ወደ እግዚአብሔር በመጸለዩ ወደ አንበሶች ጉድጓድ የተጣለው ነቢይ ማን ነው?", choices: ["ኤርምያስ", "ዳንኤል", "ሕዝቅኤል", "ኢሳይያስ"], explanation: "ዳንኤል ወደ እግዚአብሔር መጸለዩን ስለቀጠለ ወደ አንበሶች ጉድጓድ ተጣለ፣ ነገር ግን እግዚአብሔር ጠበቀው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l7-e02", level: 7, category: "Jonah", canonicalCategory: "Miracles", book: "Jonah", testament: "old", chapter: 1,
    difficulty: "easy", correctIndex: 0, reference: "Jonah 1:17", tags: ["Jonah"], verified: false,
    translations: { en: { question: "Which prophet was swallowed by a great fish after running from God's call?", choices: ["Jonah", "Elijah", "Amos", "Micah"], explanation: "Jonah fled from God's command and was swallowed by a great fish for three days." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-e03", level: 7, category: "Isaiah", canonicalCategory: "Prophecy", book: "Isaiah", testament: "old", chapter: 7,
    difficulty: "easy", correctIndex: 1, reference: "Isaiah 7:14", tags: ["Isaiah"], verified: false,
    translations: { en: { question: "Which prophet foretold a virgin conceiving a son who would be called Immanuel?", choices: ["Jeremiah", "Isaiah", "Ezekiel", "Daniel"], explanation: "Isaiah prophesied that a virgin would bear a son named Immanuel, meaning 'God with us.'" } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-e04", level: 7, category: "Daniel", canonicalCategory: "Miracles", book: "Daniel", testament: "old", chapter: 3,
    difficulty: "easy", correctIndex: 1, reference: "Daniel 3:19-23", tags: ["Daniel"], verified: false,
    translations: { en: { question: "What were Daniel's three friends thrown into for refusing to worship a golden statue?", choices: ["A lions' den", "A blazing furnace", "A pit", "A prison"], explanation: "Shadrach, Meshach, and Abednego were thrown into a fiery furnace but were protected by God." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-e05", level: 7, category: "Ezekiel", canonicalCategory: "Prophecy", book: "Ezekiel", testament: "old", chapter: 37,
    difficulty: "easy", correctIndex: 1, reference: "Ezekiel 37:1-10", tags: ["Ezekiel"], verified: false,
    translations: { en: { question: "Which prophet saw a vision of a valley of dry bones coming back to life?", choices: ["Isaiah", "Ezekiel", "Jeremiah", "Daniel"], explanation: "Ezekiel prophesied to a valley of dry bones, and God brought them back to life as a symbol of Israel's restoration." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-e06", level: 7, category: "Jeremiah", canonicalCategory: "Prophecy", book: "Jeremiah", testament: "old", chapter: 1,
    difficulty: "easy", correctIndex: 1, reference: "Lamentations (traditionally attributed to Jeremiah)", tags: ["Jeremiah"], verified: false,
    translations: { en: { question: "Which prophet is traditionally credited with weeping over Jerusalem and writing Lamentations?", choices: ["Isaiah", "Jeremiah", "Ezekiel", "Daniel"], explanation: "Jeremiah, known as the 'weeping prophet,' is traditionally credited with the Book of Lamentations." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m01", level: 7, category: "Daniel", canonicalCategory: "Prophecy", book: "Daniel", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "Daniel 3:28-30", tags: ["Daniel"], verified: false,
    translations: {
      en: { question: "What did King Nebuchadnezzar do after seeing Daniel's three friends survive the furnace unharmed?", choices: ["Killed Daniel", "Praised their God and promoted them", "Exiled them", "Ignored the miracle"], explanation: "Nebuchadnezzar praised the God of Shadrach, Meshach, and Abednego and promoted them in his kingdom." },
      am: { question: "ንጉሥ ናቡከደነፆር የዳንኤልን ሦስት ጓደኞች ከእቶኑ ምንም ጉዳት ሳይደርስባቸው ካየ በኋላ ምን አደረገ?", choices: ["ዳንኤልን ገደለ", "አምላካቸውን አመሰገነ እና አስተዋወቃቸው", "ወደ ስደት ላካቸው", "ተአምሩን ችላ አለ"], explanation: "ናቡከደነፆር የሲድራቅን፣ ሚሳቅንና አብድናጎን አምላክ አመሰገነ እናም በመንግሥቱ ውስጥ አስተዋወቃቸው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l7-m02", level: 7, category: "Daniel", canonicalCategory: "Prophecy", book: "Daniel", testament: "old", chapter: 2,
    difficulty: "medium", correctIndex: 0, reference: "Daniel 2:36-45", tags: ["Daniel"], verified: false,
    translations: { en: { question: "What did Daniel's interpretation of Nebuchadnezzar's statue dream reveal?", choices: ["A prophecy of coming kingdoms", "A warning of famine", "A call to repentance", "A blessing for Babylon"], explanation: "Daniel interpreted the statue's different materials as a prophecy of successive kingdoms that would rise and fall." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m03", level: 7, category: "Daniel", canonicalCategory: "Prophecy", book: "Daniel", testament: "old", chapter: 6,
    difficulty: "medium", correctIndex: 0, reference: "Daniel 6:10,16", tags: ["Daniel"], verified: false,
    translations: { en: { question: "Why was Daniel thrown into the lions' den?", choices: ["He refused to stop praying to God despite a royal decree", "He stole from the king", "He worshiped idols", "He betrayed Babylon"], explanation: "Daniel continued praying to God three times a day even after a decree forbade it, so his enemies had him thrown to the lions." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m04", level: 7, category: "Daniel", canonicalCategory: "Prophecy", book: "Daniel", testament: "old", chapter: 5,
    difficulty: "medium", correctIndex: 1, reference: "Daniel 5:25-28", tags: ["Daniel"], verified: false,
    translations: { en: { question: "What did the handwriting on the wall at Belshazzar's feast mean, as Daniel interpreted it?", choices: ["A blessing", "A warning that his kingdom would end", "A prayer", "A song"], explanation: "Daniel interpreted the writing as God's judgment that Belshazzar's kingdom would be taken from him." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m05", level: 7, category: "Jonah", canonicalCategory: "Prophecy", book: "Jonah", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "Jonah 3:4", tags: ["Jonah"], verified: false,
    translations: { en: { question: "What warning did God give the city of Nineveh through Jonah?", choices: ["A flood was coming", "It would be destroyed in 40 days unless they repented", "A famine was coming", "A plague was coming"], explanation: "Jonah proclaimed that Nineveh would be overturned in forty days unless the people repented." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m06", level: 7, category: "Jonah", canonicalCategory: "Prophecy", book: "Jonah", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "Jonah 3:5-6", tags: ["Jonah"], verified: false,
    translations: { en: { question: "How did the people of Nineveh respond to Jonah's warning?", choices: ["They ignored it", "They repented in sackcloth and ashes", "They killed Jonah", "They exiled him"], explanation: "The people of Nineveh believed God's warning and repented, from the greatest to the least." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m07", level: 7, category: "Hosea", canonicalCategory: "Prophecy", book: "Hosea", testament: "old", chapter: 1,
    difficulty: "medium", correctIndex: 1, reference: "Hosea 1:2-3", tags: ["Hosea"], verified: false,
    translations: { en: { question: "Which minor prophet's troubled marriage pictured God's love for unfaithful Israel?", choices: ["Joel", "Hosea", "Amos", "Micah"], explanation: "God had Hosea marry an unfaithful woman as a living picture of Israel's unfaithfulness and God's steadfast love." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-m08", level: 7, category: "Amos", canonicalCategory: "Prophecy", book: "Amos", testament: "old", chapter: 5,
    difficulty: "medium", correctIndex: 1, reference: "Amos 5:24", tags: ["Amos"], verified: false,
    translations: { en: { question: "Which prophet is known for the call to 'let justice roll on like a river'?", choices: ["Micah", "Amos", "Habakkuk", "Zephaniah"], explanation: "Amos called Israel to let justice and righteousness flow like a never-failing stream." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h01", level: 7, category: "Daniel", canonicalCategory: "Prophecy", book: "Daniel", testament: "old", chapter: 10,
    difficulty: "hard", correctIndex: 1, reference: "Daniel 10:2-3", tags: ["Daniel"], verified: false,
    translations: {
      en: { question: "How many days did Daniel fast from meat, wine, and fine food before receiving a vision?", choices: ["7", "21", "40", "3"], explanation: "Daniel mourned and fasted for three full weeks (21 days) before his vision came." },
      am: { question: "ዳንኤል ራዕይ ከመቀበሉ በፊት ከስጋ፣ ከወይን ጠጅና ከመልካም ምግብ ስንት ቀናት ጾመ?", choices: ["7", "21", "40", "3"], explanation: "ዳንኤል ራዕዩ ከመምጣቱ በፊት ለሦስት ሙሉ ሳምንታት (21 ቀናት) አዘነ እና ጾመ።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l7-h02", level: 7, category: "Daniel", canonicalCategory: "Kings", book: "Daniel", testament: "old", chapter: 5,
    difficulty: "hard", correctIndex: 1, reference: "Daniel 5:1", tags: ["Daniel"], verified: false,
    translations: { en: { question: "What was the name of the Babylonian king who saw the handwriting on the wall?", choices: ["Nebuchadnezzar", "Belshazzar", "Cyrus", "Darius"], explanation: "King Belshazzar saw the mysterious handwriting appear during his great feast." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h03", level: 7, category: "Daniel", canonicalCategory: "Kings", book: "Daniel", testament: "old", chapter: 6,
    difficulty: "hard", correctIndex: 0, reference: "Daniel 6:1-4", tags: ["Daniel"], verified: false,
    translations: { en: { question: "What position did Daniel hold under King Darius that provoked jealousy?", choices: ["Chief among the administrators", "Military general", "High priest", "Royal treasurer"], explanation: "Daniel so distinguished himself that Darius planned to set him over the whole kingdom, provoking the other administrators' jealousy." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h04", level: 7, category: "Hosea", canonicalCategory: "Women", book: "Hosea", testament: "old", chapter: 1,
    difficulty: "hard", correctIndex: 1, reference: "Hosea 1:2-3", tags: ["Hosea"], verified: false,
    translations: { en: { question: "Which prophet was told by God to marry a woman named Gomer as a symbolic act?", choices: ["Amos", "Hosea", "Joel", "Nahum"], explanation: "God told Hosea to marry Gomer, an unfaithful woman, to illustrate Israel's unfaithfulness to God." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h05", level: 7, category: "Ezekiel", canonicalCategory: "Prophecy", book: "Ezekiel", testament: "old", chapter: 37,
    difficulty: "hard", correctIndex: 1, reference: "Ezekiel 37:11-14", tags: ["Ezekiel"], verified: false,
    translations: { en: { question: "Whose restoration did Ezekiel's vision of the valley of dry bones represent?", choices: ["Egypt's", "Israel's", "Babylon's", "Assyria's"], explanation: "God told Ezekiel the dry bones represented all Israel, whom He would restore to their land." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h06", level: 7, category: "Micah", canonicalCategory: "Prophecy", book: "Micah", testament: "old", chapter: 5,
    difficulty: "hard", correctIndex: 0, reference: "Micah 5:2", tags: ["Micah"], verified: false,
    translations: { en: { question: "Which minor prophet foretold that the Messiah would come from Bethlehem?", choices: ["Micah", "Malachi", "Zechariah", "Haggai"], explanation: "Micah prophesied that a ruler over Israel would come from Bethlehem, though it was small among the clans of Judah." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h07", level: 7, category: "Isaiah", canonicalCategory: "Prophecy", book: "Isaiah", testament: "old", chapter: 9,
    difficulty: "hard", correctIndex: 0, reference: "Isaiah 9:6", tags: ["Isaiah"], verified: false,
    translations: { en: { question: "According to Isaiah 9:6, which title-filled name is given to the coming child?", choices: ["Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace", "Only King of Kings", "Only Son of David", "Only Lamb of God"], explanation: "Isaiah 9:6 names the coming child Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l7-h08", level: 7, category: "Habakkuk", canonicalCategory: "Prophecy", book: "Habakkuk", testament: "old", chapter: 2,
    difficulty: "hard", correctIndex: 1, reference: "Habakkuk 1:13; 2:4", tags: ["Habakkuk"], verified: false,
    translations: { en: { question: "Which prophet questioned God's use of Babylon to judge Judah and wrote 'the righteous will live by faith'?", choices: ["Nahum", "Habakkuk", "Zephaniah", "Obadiah"], explanation: "Habakkuk questioned God's justice, and God's reply included the famous line that the righteous will live by faith." } },
    translationStatus: { en: "machine" },
  },
];
