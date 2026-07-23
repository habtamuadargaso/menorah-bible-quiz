import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 5 (1-2 Samuel, 1-2 Kings, 1-2 Chronicles, Ezra, Nehemiah, Esther). */
export const LEVEL_5_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l5-e01", level: 5, category: "Kings", canonicalCategory: "Kings", book: "1 Samuel", testament: "old", chapter: 10,
    difficulty: "easy", correctIndex: 1, reference: "1 Samuel 10:1", tags: ["Saul"], verified: false,
    translations: {
      en: { question: "Who was Israel's first king?", choices: ["David", "Saul", "Solomon", "Samuel"], explanation: "Samuel anointed Saul as the first king of Israel." },
      am: { question: "የእስራኤል የመጀመሪያ ንጉሥ ማን ነበር?", choices: ["ዳዊት", "ሳኦል", "ሰሎሞን", "ሳሙኤል"], explanation: "ሳሙኤል ሳኦልን የእስራኤል የመጀመሪያ ንጉሥ አድርጎ ቀባው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l5-e02", level: 5, category: "David", canonicalCategory: "Kings", book: "1 Samuel", testament: "old", chapter: 17,
    difficulty: "easy", correctIndex: 1, reference: "1 Samuel 17:50", tags: ["David"], verified: false,
    translations: { en: { question: "Who defeated the giant Goliath with a sling and stone?", choices: ["Saul", "David", "Jonathan", "Samuel"], explanation: "David defeated the Philistine giant Goliath, trusting in the Lord." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-e03", level: 5, category: "Solomon", canonicalCategory: "Kings", book: "1 Kings", testament: "old", chapter: 4,
    difficulty: "easy", correctIndex: 1, reference: "1 Kings 4:29-31", tags: ["Solomon"], verified: false,
    translations: { en: { question: "Which king of Israel was known as the wisest?", choices: ["David", "Solomon", "Saul", "Rehoboam"], explanation: "God gave Solomon wisdom greater than anyone else, and he became renowned for it." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-e04", level: 5, category: "Esther", canonicalCategory: "Women", book: "Esther", testament: "old", chapter: 4,
    difficulty: "easy", correctIndex: 0, reference: "Esther 4:16", tags: ["Esther"], verified: false,
    translations: { en: { question: "Which queen risked her life by approaching the king to save the Jewish people?", choices: ["Esther", "Ruth", "Deborah", "Bathsheba"], explanation: "Esther approached King Xerxes uninvited, saying 'if I perish, I perish,' to save her people." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-m01", level: 5, category: "David", canonicalCategory: "Kings", book: "1 Samuel", testament: "old", chapter: 16,
    difficulty: "medium", correctIndex: 1, reference: "1 Samuel 16:13", tags: ["David"], verified: false,
    translations: {
      en: { question: "Who anointed David as future king while he was still a young shepherd?", choices: ["Nathan", "Samuel", "Elijah", "Saul"], explanation: "The prophet Samuel anointed David with oil in front of his brothers, though he was the youngest." },
      am: { question: "ዳዊት ገና ወጣት እረኛ ሳለ የወደፊት ንጉሥ አድርጎ የቀባው ማን ነው?", choices: ["ናታን", "ሳሙኤል", "ኤልያስ", "ሳኦል"], explanation: "ነቢዩ ሳሙኤል ዳዊትን ከወንድሞቹ ሁሉ ትንሹ ቢሆንም በፊታቸው ዘይት ቀብቶ ቀባው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l5-m02", level: 5, category: "David", canonicalCategory: "Kings", book: "2 Samuel", testament: "old", chapter: 11,
    difficulty: "medium", correctIndex: 1, reference: "2 Samuel 11:2-17", tags: ["David"], verified: false,
    translations: { en: { question: "What sin did David commit involving Bathsheba and her husband Uriah?", choices: ["He married two wives", "He committed adultery with Bathsheba and had Uriah killed", "He refused to build the temple", "He worshiped foreign gods"], explanation: "David committed adultery with Bathsheba and arranged for her husband Uriah to be killed in battle." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-m03", level: 5, category: "David", canonicalCategory: "Kings", book: "2 Samuel", testament: "old", chapter: 15,
    difficulty: "medium", correctIndex: 1, reference: "2 Samuel 15:10", tags: ["David"], verified: false,
    translations: { en: { question: "Which of David's sons led a rebellion against him?", choices: ["Solomon", "Absalom", "Amnon", "Adonijah"], explanation: "David's son Absalom conspired and declared himself king, forcing David to flee Jerusalem." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-m04", level: 5, category: "Solomon", canonicalCategory: "Kings", book: "1 Kings", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "1 Kings 3:9", tags: ["Solomon"], verified: false,
    translations: { en: { question: "What did Solomon ask God for when offered anything he wanted?", choices: ["Riches", "Wisdom", "Long life", "Victory over enemies"], explanation: "Solomon asked for a discerning heart to govern God's people wisely, which pleased God." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-m05", level: 5, category: "Elijah", canonicalCategory: "Prophecy", book: "1 Kings", testament: "old", chapter: 18,
    difficulty: "medium", correctIndex: 1, reference: "1 Kings 18:19-40", tags: ["Elijah"], verified: false,
    translations: { en: { question: "Which prophet confronted King Ahab and the prophets of Baal on Mount Carmel?", choices: ["Elisha", "Elijah", "Isaiah", "Jeremiah"], explanation: "Elijah challenged the prophets of Baal to a contest of fire on Mount Carmel, proving the Lord is God." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-m06", level: 5, category: "Nehemiah", canonicalCategory: "Old Testament", book: "Nehemiah", testament: "old", chapter: 2,
    difficulty: "medium", correctIndex: 1, reference: "Nehemiah 2:17-18", tags: ["Nehemiah"], verified: false,
    translations: { en: { question: "Who led the rebuilding of Jerusalem's walls after the Babylonian exile?", choices: ["Ezra", "Nehemiah", "Zerubbabel", "Daniel"], explanation: "Nehemiah organized and led the people in rebuilding Jerusalem's broken walls." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-m07", level: 5, category: "Esther", canonicalCategory: "Kings", book: "Esther", testament: "old", chapter: 2,
    difficulty: "medium", correctIndex: 1, reference: "Esther 2:17", tags: ["Esther"], verified: false,
    translations: { en: { question: "Who was the Persian king Esther married and later appealed to for her people?", choices: ["Cyrus", "Xerxes (Ahasuerus)", "Darius", "Artaxerxes"], explanation: "Esther became queen to King Xerxes (Ahasuerus) and later risked her life pleading for the Jews." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h01", level: 5, category: "David", canonicalCategory: "Kings", book: "1 Kings", testament: "old", chapter: 2,
    difficulty: "hard", correctIndex: 1, reference: "1 Kings 2:11", tags: ["David"], verified: false,
    translations: {
      en: { question: "How many years in total did David reign as king?", choices: ["30", "40", "50", "20"], explanation: "David reigned forty years total — seven in Hebron and thirty-three in Jerusalem." },
      am: { question: "ዳዊት በአጠቃላይ ስንት ዓመታት ነገሠ?", choices: ["30", "40", "50", "20"], explanation: "ዳዊት በአጠቃላይ አርባ ዓመታት ነገሠ — ሰባት ዓመታት በኬብሮን፣ ሠላሳ ሦስት ዓመታት በኢየሩሳሌም።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l5-h02", level: 5, category: "David", canonicalCategory: "Kings", book: "1 Samuel", testament: "old", chapter: 17,
    difficulty: "hard", correctIndex: 2, reference: "1 Samuel 17:40", tags: ["David"], verified: false,
    translations: { en: { question: "How many smooth stones did David pick up before facing Goliath?", choices: ["1", "3", "5", "7"], explanation: "David chose five smooth stones from the stream before going out to face Goliath." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h03", level: 5, category: "David", canonicalCategory: "Prophecy", book: "2 Samuel", testament: "old", chapter: 12,
    difficulty: "hard", correctIndex: 1, reference: "2 Samuel 12:1-7", tags: ["David"], verified: false,
    translations: { en: { question: "Which prophet confronted David about his sin with Bathsheba using a parable?", choices: ["Samuel", "Nathan", "Gad", "Elijah"], explanation: "The prophet Nathan told David a parable about a rich man and a poor man's lamb to expose his sin." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h04", level: 5, category: "Solomon", canonicalCategory: "Kings", book: "1 Kings", testament: "old", chapter: 4,
    difficulty: "hard", correctIndex: 1, reference: "1 Kings 4:32", tags: ["Solomon"], verified: false,
    translations: { en: { question: "About how many proverbs does 1 Kings credit Solomon with speaking?", choices: ["1,000", "3,000", "5,000", "500"], explanation: "1 Kings 4:32 says Solomon spoke three thousand proverbs and over a thousand songs." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h05", level: 5, category: "Solomon", canonicalCategory: "Kings", book: "1 Kings", testament: "old", chapter: 6,
    difficulty: "hard", correctIndex: 1, reference: "1 Kings 6:38", tags: ["Solomon"], verified: false,
    translations: { en: { question: "About how long did it take Solomon to build the Temple in Jerusalem?", choices: ["3 years", "7 years", "10 years", "20 years"], explanation: "1 Kings records that Solomon built the Temple in about seven years." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h06", level: 5, category: "Solomon", canonicalCategory: "Kings", book: "1 Kings", testament: "old", chapter: 12,
    difficulty: "hard", correctIndex: 1, reference: "1 Kings 11:43; 12:16-20", tags: ["Solomon"], verified: false,
    translations: { en: { question: "After which king's death did Israel's kingdom split into two (Israel and Judah)?", choices: ["David", "Solomon", "Rehoboam", "Saul"], explanation: "After Solomon died, his son Rehoboam's harsh response led ten tribes to break away, splitting the kingdom." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h07", level: 5, category: "Esther", canonicalCategory: "Kings", book: "Esther", testament: "old", chapter: 7,
    difficulty: "hard", correctIndex: 1, reference: "Esther 7:10", tags: ["Esther"], verified: false,
    translations: { en: { question: "Which Persian official plotted to destroy the Jews but was hanged on his own gallows?", choices: ["Mordecai", "Haman", "Xerxes", "Memucan"], explanation: "Haman built gallows intending to hang Mordecai but was hanged on them himself after his plot was exposed." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l5-h08", level: 5, category: "Esther", canonicalCategory: "People", book: "Esther", testament: "old", chapter: 2,
    difficulty: "hard", correctIndex: 1, reference: "Esther 2:7,15", tags: ["Esther"], verified: false,
    translations: { en: { question: "Who was Esther's cousin who raised her and advised her throughout the story?", choices: ["Haman", "Mordecai", "Ezra", "Nehemiah"], explanation: "Mordecai raised his orphaned cousin Esther and later urged her to intervene for her people." } },
    translationStatus: { en: "machine" },
  },
];
