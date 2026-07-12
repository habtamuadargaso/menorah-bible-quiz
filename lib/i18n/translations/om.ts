import type { DeepPartial, UIStrings } from "../types";

// NOTE: AI-assisted Afaan Oromo translation with lower confidence than the
// other languages here. Please have a native Afaan Oromo speaker review
// every string (and especially the Bible references, which intentionally
// still fall back to English under result.verse) before publishing.
export const om: DeepPartial<UIStrings> = {
  tagline: "Dubbii baradhu. Amantaa kee qori. Ogummaan guddadhu.",
  slogan: "Beekumsa Kitaaba Qulqulluu kee qoradhuu Waaqayyotti dhihaadhu — gaaffii tokko tokkoon.",
  nav: { home: "Mana", categories: "Ramaddiiwwan", leaderboard: "Sarara Injifannoo" },
  hero: {
    eyebrow: "Marsariitii Kitaaba Qulqulluu Addaa",
    startButton: "Marsariitii Jalqabi",
    leaderboardButton: "Sarara Injifannoo Ilaali",
    statCategories: "Ramaddiiwwan",
    statQuestions: "Kuusaa Gaaffilee",
    statFree: "Bilisaan",
  },
  categoriesSection: {
    heading: "Ramaddii Kee Filadhu",
    subheading: "Filannoo hedduu · gaaffiiwwan yeroon murtaa'e · karaa kee Caaffata Qulqulluu keessatti filadhu",
    questionSingular: "Gaaffii",
    questionPlural: "Gaaffilee",
  },
  categories: {
    "old-testament": { title: "Kakuu Moofaa", blurb: "Uumama, Seera, fi seenaa Israa'el" },
    "new-testament": { title: "Kakuu Haaraa", blurb: "Waldaa jalqabaa fi ergaawwan ergamootaa" },
    "life-of-jesus": { title: "Jireenya Yesus", blurb: "Dhalachuu isaa, tajaajila, dinqiiwwan, fi du'aa ka'uu" },
    apostles: { title: "Ergamoota", blurb: "Kudha lamaan Yesus isa duukaa bu'uuf waamee" },
    "bible-characters": { title: "Namoota Kitaaba Qulqulluu", blurb: "Namoota amantaan isaanii seenaa uumee" },
    "youth-challenge": { title: "Qormaata Dargaggootaa", blurb: "Dargaggootaaf fi amantoota dargaggootaaf qophaa'e" },
    "psalms-proverbs": { title: "Faarfannaa fi Fakkeenya", blurb: "Ogummaa, waaqeffannaa, fi sirba" },
    "faith-prayer": { title: "Amantaa fi Kadhannaa", blurb: "Waaqayyotti amanuu fi isatti dubbachuu" },
    "gospel-challenge": { title: "Qormaata Wangeelaa", blurb: "Oduu gaarii fayyinaa" },
    "hard-questions": { title: "Gaaffilee Kitaaba Qulqulluu Cimoo", blurb: "Barattoota Caaffata Qulqulluu cimoo ta'aniif" },
  },
  quiz: {
    quit: "Ba'i",
    questionLabel: "Gaaffii",
    ofLabel: "keessaa",
    streak: "walitti aansaa",
    difficulty: { Easy: "Salphaa", Medium: "Giddu galeessa", Hard: "Cimaa" },
    nextQuestion: "Gaaffii Itti Aanu",
    seeResults: "Bu'aa Ilaali",
    noQuestions: "Ramaddiin kun ammaaf gaaffii hin qabu.",
    backToCategories: "Gara Ramaddiitti Deebi'i",
    fallbackNotice: "Gaaffiileen Ingiliffaan agarsiifamaa jiru — hiikkaan afaan kanaa dhiyootti ni dhufa.",
  },
  result: {
    tier: {
      master: "Ogeessa Minooraa",
      scholar: "Barataa Amanamaa",
      believer: "Amantaa Guddataa",
      keepStudying: "Barachuu Itti Fufi",
    },
    correct: "Sirrii",
    accuracy: "Sirrummaa",
    score: "Qabxii",
    points: "qabxiiwwan",
    namePlaceholder: "Maqaa kee galchi",
    saveButton: "Sarara Injifannootti Olkaa'i",
    savedMessage: "Qabxiin olkaa'ameera ✓",
    restartButton: "Marsariitii Irra Deebi'i",
    backToCategoriesButton: "Gara Ramaddiitti Deebi'i",
    leaderboardButton: "Sarara Injifannoo",
  },
  leaderboard: {
    heading: "Sarara Injifannoo",
    subheading: "Meeshaa kana irratti olkaa'ame — qabxii kee dabaluuf marsariitii taphadhu",
    empty: "Qabxiin ammaaf hin jiru. Marsariitii xumuriitii qabxii kee olkaa'i akka asitti mul'atuuf.",
  },
  footer: {
    verse: "\u201cDubbiin kee miilla kootiif ibsaa, karaa kootiifis ifa.\u201d — Faarfannaa 119:105",
    tagline: "Menorah Bible Quiz · Waldaalee amantaa, garee dargaggootaa, fi maatiiwwaniif qophaa'e",
  },
};
