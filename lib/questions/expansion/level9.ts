import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 9 (Acts, Romans - Philemon: Acts and Paul's letters). */
export const LEVEL_9_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l9-e01", level: 9, category: "Pentecost", canonicalCategory: "New Testament", book: "Acts", testament: "new", chapter: 2,
    difficulty: "easy", correctIndex: 1, reference: "Acts 2:1-4", tags: ["Pentecost"], verified: false,
    translations: {
      en: { question: "What happened to the disciples on the day of Pentecost?", choices: ["They were baptized in water", "The Holy Spirit filled them and they spoke in other tongues", "They fled Jerusalem", "They fasted"], explanation: "On Pentecost, the Holy Spirit filled the believers, and they began to speak in other tongues." },
      am: { question: "በጰንጠቆስጤ ቀን ለደቀ መዛሙርቱ ምን ተከሰተ?", choices: ["በውሃ ተጠመቁ", "መንፈስ ቅዱስ ሞላባቸውና በሌላ ልሳኖች ተናገሩ", "ኢየሩሳሌምን ተሰደዱ", "ጾሙ"], explanation: "በጰንጠቆስጤ ቀን መንፈስ ቅዱስ አማኞችን ሞላባቸው፣ በሌላ ልሳኖችም መናገር ጀመሩ።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l9-e02", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Acts", testament: "new", chapter: 9,
    difficulty: "easy", correctIndex: 1, reference: "Acts 9:3-9", tags: ["Paul"], verified: false,
    translations: { en: { question: "Who was struck blind on the road to Damascus and later became a great apostle?", choices: ["Peter", "Paul (Saul)", "John", "Barnabas"], explanation: "Saul (later Paul) was struck blind by a light from heaven and encountered the risen Jesus on the road to Damascus." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-e03", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Acts", testament: "new", chapter: 13,
    difficulty: "easy", correctIndex: 1, reference: "Acts 13:9", tags: ["Paul"], verified: false,
    translations: { en: { question: "What was the apostle Paul's name before his conversion?", choices: ["Silas", "Saul", "Barnabas", "Timothy"], explanation: "Paul was known as Saul before his dramatic conversion on the road to Damascus." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-m01", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Acts", testament: "new", chapter: 13,
    difficulty: "medium", correctIndex: 1, reference: "Acts 13:2-3", tags: ["Paul"], verified: false,
    translations: {
      en: { question: "Who was Paul's companion sent out with him on his first missionary journey?", choices: ["Timothy", "Barnabas", "Silas", "Luke"], explanation: "The church at Antioch set apart Barnabas and Saul (Paul) together for the work of spreading the gospel." },
      am: { question: "በጳውሎስ የመጀመሪያ የሚስዮን ጉዞ አብሮት የተላከው ጓደኛው ማን ነበር?", choices: ["ጢሞቴዎስ", "በርናባስ", "ሲላስ", "ሉቃስ"], explanation: "በአንጾኪያ ቤተ ክርስቲያን በርናባስንና ሳውልን (ጳውሎስን) ወንጌልን ለማዳረስ ሥራ ለይተው ላኳቸው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l9-h01", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Acts", testament: "new", chapter: 13,
    difficulty: "hard", correctIndex: 2, reference: "Acts 13-21", tags: ["Paul"], verified: false,
    translations: {
      en: { question: "How many major missionary journeys does the Book of Acts record Paul taking?", choices: ["1", "2", "3", "4"], explanation: "Acts records three major missionary journeys of Paul, spreading the gospel across the Roman world." },
      am: { question: "የሐዋርያት ሥራ መጽሐፍ ጳውሎስ ስንት ዋና ዋና የሚስዮን ጉዞዎችን እንዳደረገ ይመዘግባል?", choices: ["1", "2", "3", "4"], explanation: "የሐዋርያት ሥራ ጳውሎስ ወንጌልን በሮም ዓለም ውስጥ ያዳረሰባቸውን ሦስት ዋና ዋና የሚስዮን ጉዞዎች ይመዘግባል።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l9-h02", level: 9, category: "Paul", canonicalCategory: "Miracles", book: "Acts", testament: "new", chapter: 16,
    difficulty: "hard", correctIndex: 1, reference: "Acts 16:26", tags: ["Paul"], verified: false,
    translations: { en: { question: "What natural event freed Paul and Silas from prison in Philippi?", choices: ["A flood", "An earthquake", "A fire", "A storm"], explanation: "A violent earthquake shook the prison, opening the doors and loosening everyone's chains." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-h03", level: 9, category: "Paul", canonicalCategory: "Paul", book: "2 Corinthians", testament: "new", chapter: 12,
    difficulty: "hard", correctIndex: 0, reference: "2 Corinthians 12:7-8", tags: ["Paul"], verified: false,
    translations: { en: { question: "What did Paul call the affliction he asked God three times to remove?", choices: ["A thorn in his flesh", "Blindness", "Persecution", "A demon"], explanation: "Paul described a 'thorn in the flesh' that God allowed to keep him humble, despite asking three times for it to be removed." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-h04", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Romans", testament: "new", chapter: 6,
    difficulty: "hard", correctIndex: 1, reference: "Romans 6:23", tags: ["Paul"], verified: false,
    translations: { en: { question: "According to Romans, what is the free gift of God through Jesus Christ?", choices: ["Wealth", "Eternal life", "Health", "Wisdom"], explanation: "Romans 6:23 says the wages of sin is death, but the gift of God is eternal life in Christ Jesus." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-h05", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Galatians", testament: "new", chapter: 5,
    difficulty: "hard", correctIndex: 0, reference: "Galatians 5:22-23", tags: ["Paul"], verified: false,
    translations: { en: { question: "What does Paul list in Galatians as the 'fruit of the Spirit'?", choices: ["Love, joy, peace, and more", "Wealth and power", "Miracles and signs", "Knowledge and prophecy"], explanation: "Galatians 5:22-23 lists the fruit of the Spirit as love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-h06", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Ephesians", testament: "new", chapter: 6,
    difficulty: "hard", correctIndex: 1, reference: "Ephesians 6:11", tags: ["Paul"], verified: false,
    translations: { en: { question: "Believers in which city did Paul write to about putting on the 'armor of God'?", choices: ["Corinth", "Ephesus", "Philippi", "Colossae"], explanation: "Paul's letter to the Ephesians describes putting on the full armor of God to stand against evil." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l9-h07", level: 9, category: "Paul", canonicalCategory: "Paul", book: "Philemon", testament: "new", chapter: 1,
    difficulty: "hard", correctIndex: 1, reference: "Philemon 1:10", tags: ["Paul"], verified: false,
    translations: { en: { question: "To whom did Paul write appealing on behalf of a runaway slave named Onesimus?", choices: ["Timothy", "Philemon", "Titus", "Silas"], explanation: "Paul wrote a personal letter to Philemon appealing for him to receive back his runaway slave Onesimus as a brother." } },
    translationStatus: { en: "machine" },
  },
];
