import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 2 (Genesis 25-50: Isaac, Jacob, Joseph). */
export const LEVEL_2_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l2-e01", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 27,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 27:19", tags: ["Jacob", "Esau"], verified: false,
    translations: {
      en: { question: "Who tricked his father Isaac into giving him the blessing meant for his brother?", choices: ["Esau", "Jacob", "Laban", "Reuben"], explanation: "Jacob disguised himself as Esau to receive their father Isaac's blessing." },
      am: { question: "አባቱን ይስሐቅን በማታለል ለወንድሙ የታሰበውን በረከት የተቀበለው ማን ነው?", choices: ["ኤሳው", "ያዕቆብ", "ላባ", "ሮቤል"], explanation: "ያዕቆብ እንደ ኤሳው በመምሰል ከአባቱ ይስሐቅ በረከትን ተቀበለ።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l2-e02", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 25,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 25:29-34", tags: ["Jacob", "Esau"], verified: false,
    translations: { en: { question: "What did Esau sell to Jacob in exchange for a bowl of stew?", choices: ["His tent", "His birthright", "His flock", "His land"], explanation: "Esau sold his birthright to Jacob for a meal, showing he despised it." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e03", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 35,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 35:22-26", tags: ["Jacob"], verified: false,
    translations: { en: { question: "How many sons did Jacob have?", choices: ["10", "12", "7", "9"], explanation: "Jacob had twelve sons, who became the ancestors of the twelve tribes of Israel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e04", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 37,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 37:3", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What special gift did Jacob give his son Joseph?", choices: ["A sword", "A coat of many colors", "A flock of sheep", "A house"], explanation: "Jacob gave Joseph an ornate robe, showing his special love for him." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e05", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 37,
    difficulty: "easy", correctIndex: 0, reference: "Genesis 37:28", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What did Joseph's jealous brothers do to him?", choices: ["Sold him into slavery", "Killed him", "Sent him to school", "Made him king"], explanation: "Joseph's brothers sold him to traders who took him to Egypt as a slave." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e06", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 41,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 41:41", tags: ["Joseph"], verified: false,
    translations: { en: { question: "In which country did Joseph rise to become second in command?", choices: ["Babylon", "Egypt", "Assyria", "Persia"], explanation: "Pharaoh made Joseph ruler over all Egypt, second only to himself." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e07", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 32,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 32:24-30", tags: ["Jacob"], verified: false,
    translations: { en: { question: "What did Jacob wrestle with all night at Peniel?", choices: ["A lion", "A man/angel", "A serpent", "A giant"], explanation: "Jacob wrestled with a man (understood as an angel or a manifestation of God) until daybreak." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e08", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 32,
    difficulty: "easy", correctIndex: 0, reference: "Genesis 32:28", tags: ["Jacob"], verified: false,
    translations: { en: { question: "What new name did God give Jacob after their encounter at Peniel?", choices: ["Israel", "Isaac", "Reuben", "Ephraim"], explanation: "God renamed Jacob 'Israel,' meaning he had struggled with God and man and had overcome." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-e09", level: 2, category: "Jacob", canonicalCategory: "Women", book: "Genesis", testament: "old", chapter: 29,
    difficulty: "easy", correctIndex: 1, reference: "Genesis 29:18", tags: ["Jacob", "Rachel"], verified: false,
    translations: { en: { question: "Who was Jacob's beloved wife and the mother of Joseph?", choices: ["Leah", "Rachel", "Zilpah", "Bilhah"], explanation: "Jacob loved Rachel and worked many years for her father Laban to marry her." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m01", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 29,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 29:20,27,30", tags: ["Jacob", "Laban"], verified: false,
    translations: {
      en: { question: "How many years total did Jacob work for Laban before marrying Rachel, after being tricked into marrying Leah first?", choices: ["7", "14", "20", "4"], explanation: "Jacob worked seven years for Rachel, was tricked into marrying Leah, then worked seven more years for Rachel." },
      am: { question: "ያዕቆብ ራሔልን ከማግባቱ በፊት (በመጀመሪያ ልያን እንዲያገባ ከተታለለ በኋላ) ለላባ ምን ያህል ዓመታት አገለገለ?", choices: ["7", "14", "20", "4"], explanation: "ያዕቆብ ለራሔል ሰባት ዓመታት አገለገለ፣ ልያን እንዲያገባ ተታለለ፣ ከዚያም ለራሔል ተጨማሪ ሰባት ዓመታት አገለገለ።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l2-m02", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 37,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 37:4-8,20", tags: ["Joseph"], verified: false,
    translations: { en: { question: "Why did Joseph's brothers first plot to kill him?", choices: ["He stole from them", "They were jealous of his dreams and their father's favoritism", "He insulted their father", "He refused to work"], explanation: "Joseph's brothers hated him for his dreams of ruling over them and for Jacob's favoritism." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m03", level: 2, category: "Joseph", canonicalCategory: "People", book: "Genesis", testament: "old", chapter: 39,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 39:1", tags: ["Joseph"], verified: false,
    translations: { en: { question: "Who bought Joseph as a slave when he arrived in Egypt?", choices: ["Pharaoh", "Potiphar", "Laban", "Judah"], explanation: "Potiphar, one of Pharaoh's officials, bought Joseph from the traders." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m04", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 39,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 39:14-20", tags: ["Joseph"], verified: false,
    translations: { en: { question: "Why was Joseph thrown into prison in Egypt?", choices: ["He stole grain", "Potiphar's wife falsely accused him", "He refused to worship idols", "He tried to escape"], explanation: "Potiphar's wife falsely accused Joseph after he refused her advances, and he was imprisoned." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m05", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 40,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 40:1-19", tags: ["Joseph"], verified: false,
    translations: { en: { question: "Whose dreams did Joseph interpret while in prison?", choices: ["Two guards", "Pharaoh's cupbearer and baker", "Two other prisoners", "Pharaoh's sons"], explanation: "Joseph correctly interpreted the dreams of Pharaoh's cupbearer and baker, who were imprisoned with him." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m06", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 41,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 41:17-30", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What did Pharaoh dream that Joseph interpreted as seven years of plenty followed by seven years of famine?", choices: ["Seven stars and seven moons", "Seven fat cows and seven thin cows", "Seven rivers", "Seven mountains"], explanation: "Pharaoh dreamed of seven healthy cows eaten by seven sickly cows, which Joseph interpreted as years of plenty followed by famine." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m07", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 42,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 42:6", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What did Joseph's brothers do when they came to Egypt for grain, not recognizing him?", choices: ["Attacked him", "Bowed down before him", "Ignored him", "Demanded gold"], explanation: "Joseph's brothers bowed down before him, unknowingly fulfilling his earlier dreams." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m08", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 44,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 44:2", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What silver item did Joseph have hidden in Benjamin's sack to test his brothers?", choices: ["A ring", "His cup", "A coin", "A dagger"], explanation: "Joseph had his silver cup hidden in Benjamin's sack to see how his brothers would respond." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-m09", level: 2, category: "Joseph", canonicalCategory: "People", book: "Genesis", testament: "old", chapter: 44,
    difficulty: "medium", correctIndex: 1, reference: "Genesis 44:33", tags: ["Joseph"], verified: false,
    translations: { en: { question: "Which brother offered to stay as a slave in Benjamin's place, showing how much he had changed?", choices: ["Reuben", "Judah", "Simeon", "Levi"], explanation: "Judah offered himself in Benjamin's place, showing genuine change from the brother who once sold Joseph." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h01", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 37,
    difficulty: "hard", correctIndex: 0, reference: "Genesis 37:2", tags: ["Joseph"], verified: false,
    translations: {
      en: { question: "How old was Joseph when his brothers sold him into slavery?", choices: ["17", "20", "30", "25"], explanation: "Joseph was seventeen years old when he was sold by his brothers." },
      am: { question: "ወንድሞቹ ዮሴፍን ለባርነት በሸጡት ጊዜ ዕድሜው ስንት ነበር?", choices: ["17", "20", "30", "25"], explanation: "ዮሴፍ በወንድሞቹ በተሸጠ ጊዜ የአስራ ሰባት ዓመት ልጅ ነበር።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l2-h02", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 41,
    difficulty: "hard", correctIndex: 2, reference: "Genesis 41:46", tags: ["Joseph"], verified: false,
    translations: { en: { question: "How old was Joseph when he began serving as second-in-command to Pharaoh?", choices: ["17", "25", "30", "40"], explanation: "Joseph was thirty years old when he entered Pharaoh's service." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h03", level: 2, category: "Joseph", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 41,
    difficulty: "hard", correctIndex: 2, reference: "Genesis 41:30", tags: ["Joseph"], verified: false,
    translations: { en: { question: "How many years of famine did Joseph predict would follow the seven years of plenty?", choices: ["3", "5", "7", "10"], explanation: "Joseph interpreted Pharaoh's dream as seven years of abundance followed by seven years of famine." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h04", level: 2, category: "Jacob", canonicalCategory: "Places", book: "Genesis", testament: "old", chapter: 32,
    difficulty: "hard", correctIndex: 1, reference: "Genesis 32:30", tags: ["Jacob"], verified: false,
    translations: { en: { question: "What did Jacob name the place where he wrestled with God and received a new name?", choices: ["Bethel", "Peniel", "Beersheba", "Shechem"], explanation: "Jacob named the place Peniel, saying he had seen God face to face and lived." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h05", level: 2, category: "Jacob", canonicalCategory: "Women", book: "Genesis", testament: "old", chapter: 29,
    difficulty: "hard", correctIndex: 1, reference: "Genesis 29:23-25", tags: ["Jacob", "Leah"], verified: false,
    translations: { en: { question: "What was the name of the wife Jacob was tricked into marrying before Rachel?", choices: ["Rachel", "Leah", "Zilpah", "Dinah"], explanation: "Laban deceived Jacob into marrying Leah, his older daughter, before allowing him to marry Rachel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h06", level: 2, category: "Jacob", canonicalCategory: "Places", book: "Genesis", testament: "old", chapter: 28,
    difficulty: "hard", correctIndex: 1, reference: "Genesis 28:19", tags: ["Jacob"], verified: false,
    translations: { en: { question: "What did Jacob name the place where he dreamed of a stairway reaching to heaven?", choices: ["Peniel", "Bethel", "Gilead", "Shechem"], explanation: "Jacob named the place Bethel, meaning 'house of God,' after his dream there." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h07", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 47,
    difficulty: "hard", correctIndex: 3, reference: "Genesis 47:28", tags: ["Jacob"], verified: false,
    translations: { en: { question: "How many years did Jacob live in Egypt after Joseph brought his family there?", choices: ["400", "215", "70", "17"], explanation: "Genesis records that Jacob lived in Egypt seventeen years before his death." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h08", level: 2, category: "Joseph", canonicalCategory: "Women", book: "Genesis", testament: "old", chapter: 41,
    difficulty: "hard", correctIndex: 0, reference: "Genesis 41:45", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What was the name of Joseph's Egyptian wife, given to him by Pharaoh?", choices: ["Asenath", "Zipporah", "Tirzah", "Puah"], explanation: "Pharaoh gave Joseph Asenath, daughter of a priest of On, as his wife." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h09", level: 2, category: "Joseph", canonicalCategory: "People", book: "Genesis", testament: "old", chapter: 41,
    difficulty: "hard", correctIndex: 0, reference: "Genesis 41:50-52", tags: ["Joseph"], verified: false,
    translations: { en: { question: "What were the names of Joseph's two sons born in Egypt?", choices: ["Manasseh and Ephraim", "Reuben and Simeon", "Perez and Zerah", "Er and Onan"], explanation: "Joseph's sons Manasseh and Ephraim were born to him in Egypt before the years of famine came." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l2-h10", level: 2, category: "Jacob", canonicalCategory: "Old Testament", book: "Genesis", testament: "old", chapter: 47,
    difficulty: "hard", correctIndex: 2, reference: "Genesis 47:28", tags: ["Jacob"], verified: false,
    translations: { en: { question: "How old was Jacob when he died in Egypt?", choices: ["110", "120", "147", "180"], explanation: "Jacob lived a hundred and forty-seven years before he died in Egypt." } },
    translationStatus: { en: "machine" },
  },
];
