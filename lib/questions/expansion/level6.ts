import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 6 (Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon). */
export const LEVEL_6_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l6-e01", level: 6, category: "Psalms", canonicalCategory: "Old Testament", book: "Psalm", testament: "old", chapter: 23,
    difficulty: "easy", correctIndex: 1, reference: "Psalm 23:1", tags: ["Psalms"], verified: false,
    translations: {
      en: { question: "Psalm 23 famously describes the Lord as what?", choices: ["A king", "A shepherd", "A judge", "A warrior"], explanation: "Psalm 23 begins, 'The Lord is my shepherd, I lack nothing.'" },
      am: { question: "መዝሙር 23 እግዚአብሔርን በምን መልኩ ይገልጻል?", choices: ["እንደ ንጉሥ", "እንደ እረኛ", "እንደ ዳኛ", "እንደ ተዋጊ"], explanation: "መዝሙር 23 'እግዚአብሔር እረኛዬ ነው፤ የሚያሳጣኝ የለም' ብሎ ይጀምራል።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l6-e02", level: 6, category: "Proverbs", canonicalCategory: "Old Testament", book: "Proverbs", testament: "old", chapter: 9,
    difficulty: "easy", correctIndex: 1, reference: "Proverbs 9:10", tags: ["Proverbs"], verified: false,
    translations: { en: { question: "According to Proverbs, what is the beginning of wisdom?", choices: ["Education", "The fear of the Lord", "Wealth", "Good friends"], explanation: "Proverbs teaches that 'the fear of the Lord is the beginning of wisdom.'" } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-e03", level: 6, category: "Psalms", canonicalCategory: "Old Testament", book: "Psalm", testament: "old", chapter: 1,
    difficulty: "easy", correctIndex: 1, reference: "Psalm superscriptions (e.g. Psalm 23:1)", tags: ["Psalms"], verified: false,
    translations: { en: { question: "Who is traditionally credited as the author of most of the Psalms?", choices: ["Solomon", "David", "Moses", "Asaph"], explanation: "Many psalms carry a superscription attributing them to King David." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-e04", level: 6, category: "Job", canonicalCategory: "Old Testament", book: "Job", testament: "old", chapter: 1,
    difficulty: "easy", correctIndex: 1, reference: "Job 1:13-19; 2:7", tags: ["Job"], verified: false,
    translations: { en: { question: "Besides his health, what did Job lose in his time of testing?", choices: ["His faith", "His family, wealth, and health", "His name", "His homeland"], explanation: "Job lost his children, his wealth, and then his health, yet did not curse God." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-m01", level: 6, category: "Job", canonicalCategory: "Old Testament", book: "Job", testament: "old", chapter: 2,
    difficulty: "medium", correctIndex: 1, reference: "Job 2:13", tags: ["Job"], verified: false,
    translations: {
      en: { question: "What did Job's three friends do when they first arrived to comfort him?", choices: ["Argued with him immediately", "Sat with him in silence for seven days", "Left quickly", "Mocked him"], explanation: "Job's friends sat with him in silence for seven days and nights before speaking, seeing his great suffering." },
      am: { question: "የኢዮብ ሦስት ጓደኞች ሊያጽናኑት በመጡ ጊዜ መጀመሪያ ምን አደረጉ?", choices: ["ወዲያውኑ ተከራከሩት", "ለሰባት ቀናት ዝም ብለው ከጎኑ ተቀመጡ", "ፈጥነው ሄዱ", "አላገጡበት"], explanation: "የኢዮብ ጓደኞች ታላቅ መከራውን አይተው ከመናገራቸው በፊት ለሰባት ቀንና ሌሊት ዝም ብለው ከጎኑ ተቀመጡ።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l6-m02", level: 6, category: "Job", canonicalCategory: "Old Testament", book: "Job", testament: "old", chapter: 38,
    difficulty: "medium", correctIndex: 1, reference: "Job 38:1", tags: ["Job"], verified: false,
    translations: { en: { question: "How did God ultimately respond to Job's questions about his suffering?", choices: ["He explained every reason", "He spoke out of a whirlwind about His power and wisdom", "He remained silent forever", "He punished Job further"], explanation: "God answered Job out of a whirlwind, revealing His majesty and wisdom rather than explaining Job's suffering directly." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-m03", level: 6, category: "Ecclesiastes", canonicalCategory: "Old Testament", book: "Ecclesiastes", testament: "old", chapter: 1,
    difficulty: "medium", correctIndex: 1, reference: "Ecclesiastes 1:2", tags: ["Ecclesiastes"], verified: false,
    translations: { en: { question: "What does Ecclesiastes repeatedly call life 'under the sun' apart from God?", choices: ["Meaningful", "Meaningless (vanity)", "Joyful", "Eternal"], explanation: "Ecclesiastes opens declaring 'Meaningless! Meaningless! ... Everything is meaningless' when viewed apart from God." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-m04", level: 6, category: "Proverbs", canonicalCategory: "Old Testament", book: "Proverbs", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "Proverbs 3:5-6", tags: ["Proverbs"], verified: false,
    translations: { en: { question: "What does Proverbs 3 instruct instead of leaning on your own understanding?", choices: ["Rely on wealth", "Trust in the Lord with all your heart", "Ask other people", "Avoid all decisions"], explanation: "Proverbs 3:5-6 instructs trusting the Lord with all your heart rather than leaning on your own understanding." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h01", level: 6, category: "Psalms", canonicalCategory: "Old Testament", book: "Psalm", testament: "old", chapter: 150,
    difficulty: "hard", correctIndex: 1, reference: "Book of Psalms", tags: ["Psalms"], verified: false,
    translations: {
      en: { question: "How many psalms (chapters) does the Book of Psalms contain?", choices: ["100", "150", "120", "200"], explanation: "The Book of Psalms contains 150 psalms." },
      am: { question: "የመዝሙረ ዳዊት መጽሐፍ ስንት መዝሙሮችን (ምዕራፎችን) ይይዛል?", choices: ["100", "150", "120", "200"], explanation: "የመዝሙረ ዳዊት መጽሐፍ 150 መዝሙሮችን ይይዛል።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l6-h02", level: 6, category: "Job", canonicalCategory: "Old Testament", book: "Job", testament: "old", chapter: 42,
    difficulty: "hard", correctIndex: 0, reference: "Job 42:10", tags: ["Job"], verified: false,
    translations: { en: { question: "What did God do for Job after his time of suffering and testing?", choices: ["Restored his fortunes, giving him twice as much as before", "Gave him nothing more", "Restored only his health", "Restored only his family"], explanation: "The Lord restored Job's fortunes and gave him twice as much as he had before." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h03", level: 6, category: "Job", canonicalCategory: "Old Testament", book: "Job", testament: "old", chapter: 42,
    difficulty: "hard", correctIndex: 0, reference: "Job 42:13", tags: ["Job"], verified: false,
    translations: { en: { question: "How many children did Job have after God restored his fortunes?", choices: ["7 sons and 3 daughters", "10 sons and 10 daughters", "3 sons and 7 daughters", "No more children"], explanation: "After his restoration, Job had seven sons and three daughters." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h04", level: 6, category: "Song of Solomon", canonicalCategory: "Old Testament", book: "Song of Solomon", testament: "old", chapter: 1,
    difficulty: "hard", correctIndex: 0, reference: "Song of Solomon 1:1; 6:13", tags: ["Song of Solomon"], verified: false,
    translations: { en: { question: "In the Song of Solomon, who are the two main speakers expressing their love?", choices: ["Solomon and the Shulammite woman", "David and Bathsheba", "Boaz and Ruth", "Adam and Eve"], explanation: "The book is attributed to Solomon, and his beloved is referred to as the Shulammite." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h05", level: 6, category: "Proverbs", canonicalCategory: "Old Testament", book: "Proverbs", testament: "old", chapter: 3,
    difficulty: "hard", correctIndex: 1, reference: "Proverbs 3:15; 8:11", tags: ["Proverbs"], verified: false,
    translations: { en: { question: "According to Proverbs, what is described as more precious than rubies?", choices: ["Gold", "Wisdom", "Silver", "Long life"], explanation: "Proverbs repeatedly says wisdom is more precious than rubies." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h06", level: 6, category: "Ecclesiastes", canonicalCategory: "Old Testament", book: "Ecclesiastes", testament: "old", chapter: 3,
    difficulty: "hard", correctIndex: 1, reference: "Ecclesiastes 3:1", tags: ["Ecclesiastes"], verified: false,
    translations: { en: { question: "What does Ecclesiastes 3 famously say there is a season for?", choices: ["Only joy", "Every activity under heaven", "Only mourning", "Only work"], explanation: "Ecclesiastes 3 declares 'There is a time for everything, and a season for every activity under the heavens.'" } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h07", level: 6, category: "Job", canonicalCategory: "Old Testament", book: "Job", testament: "old", chapter: 42,
    difficulty: "hard", correctIndex: 0, reference: "Job 42:7-9", tags: ["Job"], verified: false,
    translations: { en: { question: "Which three of Job's friends did God rebuke for not speaking rightly about Him?", choices: ["Eliphaz, Bildad, and Zophar", "Elihu, Eliphaz, and Bildad", "Job's wife and sons", "Job's servants"], explanation: "God told Eliphaz, Bildad, and Zophar that they had not spoken of Him what was right, as Job had." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h08", level: 6, category: "Psalms", canonicalCategory: "Law", book: "Psalm", testament: "old", chapter: 119,
    difficulty: "hard", correctIndex: 1, reference: "Psalm 119", tags: ["Psalms"], verified: false,
    translations: { en: { question: "What does Psalm 119, the longest chapter in the Bible, primarily celebrate?", choices: ["God's creation", "God's law and word", "God's mercy on sinners", "The temple"], explanation: "Psalm 119 is an extended acrostic praising and meditating on God's law and word." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h09", level: 6, category: "Proverbs", canonicalCategory: "Women", book: "Proverbs", testament: "old", chapter: 31,
    difficulty: "hard", correctIndex: 1, reference: "Proverbs 31:10", tags: ["Proverbs"], verified: false,
    translations: { en: { question: "According to Proverbs 31, what kind of woman is 'worth far more than rubies'?", choices: ["A queen", "A wife of noble character", "A prophetess", "A widow"], explanation: "Proverbs 31 opens its praise of the ideal wife by saying she is worth far more than rubies." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l6-h10", level: 6, category: "Psalms", canonicalCategory: "Old Testament", book: "Psalm", testament: "old", chapter: 150,
    difficulty: "hard", correctIndex: 1, reference: "Psalm 33:2; 150:3", tags: ["Psalms"], verified: false,
    translations: { en: { question: "Which stringed instrument is most often mentioned in the Psalms for worship?", choices: ["Trumpet", "Harp/lyre", "Drum", "Flute"], explanation: "The harp (or lyre) is repeatedly mentioned throughout the Psalms as an instrument of worship." } },
    translationStatus: { en: "machine" },
  },
];
