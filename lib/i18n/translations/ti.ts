import type { DeepPartial, UIStrings } from "../types";

// NOTE: AI-assisted Tigrinya translation with lower confidence than the
// other languages here. Please have a native Tigrinya speaker review every
// string (and especially the Bible references, which intentionally still
// fall back to English under result.verse) before publishing.
export const ti: DeepPartial<UIStrings> = {
  tagline: "ቃል ተማሃር። እምነትካ ፈትን። ብጥበብ ዕበ።",
  slogan: "ፍልጠትካ ብዛዕባ መጽሓፍ ቅዱስ ፈትን፣ ንኣምላኽ ድማ ተቓረብ — ሓደ ሕቶ ብሓደ ግዜ።",
  nav: { home: "ገዛ", categories: "ጽፍሕታት", leaderboard: "ሰሌዳ ደረጃ" },
  hero: {
    eyebrow: "ፍሉይ ውድድር መጽሓፍ ቅዱስ",
    startButton: "ውድድር ጀምር",
    leaderboardButton: "ሰሌዳ ደረጃ ርአ",
    statCategories: "ጽፍሕታት",
    statQuestions: "ዝርዝር ሕቶታት",
    statFree: "ብነጻ",
  },
  categoriesSection: {
    heading: "ጽፍሒኻ ምረጽ",
    subheading: "ካብ ብዙሕ ምርጫ · ብግዜ እተገደበ ሕቶታት · መንገድኻ ኣብ ቅዱሳት ጽሑፋት ምረጽ",
    questionSingular: "ሕቶ",
    questionPlural: "ሕቶታት",
  },
  categories: {
    "old-testament": { title: "ብሉይ ኪዳን", blurb: "ፍጥረት፣ ሕጊ፣ ከምኡውን ታሪኽ እስራኤል" },
    "new-testament": { title: "ሓድሽ ኪዳን", blurb: "ናይ መጀመርታ ቤተ ክርስትያንን ደብዳበታት ሃዋርያትን" },
    "life-of-jesus": { title: "ህይወት የሱስ", blurb: "ልደቱ፣ ኣገልግሎቱ፣ ተኣምራቱን ትንሳኤኡን" },
    apostles: { title: "ሃዋርያት", blurb: "እቶም የሱስ ኪስዕብዎ ዝጸውዖም ዓሰርተው ክልተ" },
    "bible-characters": { title: "ገጸ-ባህርያት መጽሓፍ ቅዱስ", blurb: "እምነቶም ንታሪኽ ዝቐርጹ ሰባት" },
    "youth-challenge": { title: "ብድሆ መንእሰያት", blurb: "ንመንእሰያትን ንኣማኢን ተዳልዩ" },
    "psalms-proverbs": { title: "መዝሙርን ምሳሌን", blurb: "ጥበብ፣ ኣምልኾን መዝሙርን" },
    "faith-prayer": { title: "እምነትን ጸሎትን", blurb: "ኣብ ኣምላኽ ምውካልን ምስኡ ምዝራብን" },
    "gospel-challenge": { title: "ብድሆ ወንጌል", blurb: "ብስራት ድሕነት" },
    "hard-questions": { title: "ኣጸጋሚ ሕቶታት መጽሓፍ ቅዱስ", blurb: "ንጹኑዓት ተማሃሮ ቅዱሳት ጽሑፋት" },
  },
  quiz: {
    quit: "ውጻእ",
    questionLabel: "ሕቶ",
    ofLabel: "ካብ",
    streak: "ተኸታታሊ",
    difficulty: { Easy: "ቀሊል", Medium: "ማእከላይ", Hard: "ከቢድ" },
    nextQuestion: "ዝቕጽል ሕቶ",
    seeResults: "ውጽኢት ርአ",
    noQuestions: "እዚ ጽፍሒ ክሳብ ሕጂ ሕቶታት የብሉን።",
    backToCategories: "ናብ ጽፍሕታት ተመለስ",
    fallbackNotice: "ሕቶታት ብእንግሊዝኛ ይርአዩ ኣለዉ — ትርጉም ናይዚ ቋንቋ ኣብ ቀረባ ግዜ ክውሰኽ እዩ።",
  },
  result: {
    tier: {
      master: "ጎይታ ምኖራ",
      scholar: "እሙን ተማሃራይ",
      believer: "ዝዓቢ ኣማኒ",
      keepStudying: "ምጽናዕ ቀጽል",
    },
    correct: "ቅኑዕ",
    accuracy: "ልክዕነት",
    score: "ነጥቢ",
    points: "ነጥብታት",
    namePlaceholder: "ስምካ ኣእቱ",
    saveButton: "ኣብ ሰሌዳ ደረጃ ኣቐምጥ",
    savedMessage: "ነጥቢ ተዓቂቡ ✓",
    restartButton: "ውድድር ደግም",
    backToCategoriesButton: "ናብ ጽፍሕታት ተመለስ",
    leaderboardButton: "ሰሌዳ ደረጃ",
  },
  leaderboard: {
    heading: "ሰሌዳ ደረጃ",
    subheading: "ኣብዚ መሳርሒ ተዓቂቡ ኣሎ — ነጥብኻ ንምውሳኽ ውድድር ተጻወት",
    empty: "ክሳብ ሕጂ ነጥቢ የለን። ውድድር ወዲእካ ነጥብኻ ኣቐምጥ ምእንቲ ኣብዚ ክርአ።",
  },
  footer: {
    verse: "\u201cቃልካ ንእግረይ መብራህቲ፣ ንመገደይ ድማ ብርሃን እዩ።\u201d — መዝሙር 119:105",
    tagline: "Menorah Bible Quiz · ንኣብያተ ክርስትያናት፣ ንጉጅለታት መንእሰያትን ንስድራቤታትን ተዳልዩ",
  },
};
