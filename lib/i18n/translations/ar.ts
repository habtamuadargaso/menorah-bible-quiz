import type { DeepPartial, UIStrings } from "../types";

// Arabic is RTL — layout direction is handled separately in
// LanguageContext.tsx (document.documentElement.dir).
export const ar: DeepPartial<UIStrings> = {
  tagline: "تعلّم الكلمة. اختبر إيمانك. انمُ في الحكمة.",
  slogan: "اختبر معرفتك الكتابية واقترب أكثر من الله — سؤالاً بعد سؤال.",
  nav: { home: "الرئيسية", categories: "الفئات", leaderboard: "لوحة الصدارة" },
  hero: {
    eyebrow: "مسابقة كتابية مميزة",
    startButton: "ابدأ الاختبار",
    leaderboardButton: "عرض لوحة الصدارة",
    statCategories: "الفئات",
    statQuestions: "بنك الأسئلة",
    statFree: "مجاني",
  },
  categoriesSection: {
    heading: "اختر فئتك",
    subheading: "اختيار من متعدد · أسئلة محددة بوقت · اختر طريقك عبر الكتاب المقدس",
    questionSingular: "سؤال",
    questionPlural: "أسئلة",
  },
  categories: {
    "old-testament": { title: "العهد القديم", blurb: "الخلق والشريعة وقصة إسرائيل" },
    "new-testament": { title: "العهد الجديد", blurb: "الكنيسة الأولى ورسائل الرسل" },
    "life-of-jesus": { title: "حياة يسوع", blurb: "ميلاده وخدمته ومعجزاته وقيامته" },
    apostles: { title: "الرسل", blurb: "الاثنا عشر الذين دعاهم يسوع لاتّباعه" },
    "bible-characters": { title: "شخصيات الكتاب المقدس", blurb: "الأشخاص الذين شكّل إيمانهم القصة" },
    "youth-challenge": { title: "تحدي الشباب", blurb: "مصمم للمراهقين والمؤمنين الشباب" },
    "psalms-proverbs": { title: "المزامير والأمثال", blurb: "حكمة وعبادة وترنيم" },
    "faith-prayer": { title: "الإيمان والصلاة", blurb: "الثقة بالله والحديث معه" },
    "gospel-challenge": { title: "تحدي الإنجيل", blurb: "البشارة بالخلاص" },
    "hard-questions": { title: "أسئلة كتابية صعبة", blurb: "لدارسي الكتاب المقدس الجادين" },
  },
  quiz: {
    quit: "خروج",
    questionLabel: "سؤال",
    ofLabel: "من",
    streak: "متتالية",
    difficulty: { Easy: "سهل", Medium: "متوسط", Hard: "صعب" },
    nextQuestion: "السؤال التالي",
    seeResults: "عرض النتائج",
    noQuestions: "لا توجد أسئلة بعد لهذه الفئة.",
    backToCategories: "العودة إلى الفئات",
    fallbackNotice: "تُعرض الأسئلة بالإنجليزية — الترجمة لهذه اللغة قادمة قريبًا.",
  },
  result: {
    tier: {
      master: "خبير المينوراه",
      scholar: "دارس أمين",
      believer: "مؤمن متنامٍ",
      keepStudying: "واصل الدراسة",
    },
    correct: "الإجابات الصحيحة",
    accuracy: "الدقة",
    score: "النتيجة",
    points: "نقطة",
    namePlaceholder: "أدخل اسمك",
    saveButton: "حفظ في لوحة الصدارة",
    savedMessage: "تم حفظ النتيجة ✓",
    restartButton: "إعادة الاختبار",
    backToCategoriesButton: "العودة إلى الفئات",
    leaderboardButton: "لوحة الصدارة",
  },
  leaderboard: {
    heading: "لوحة الصدارة",
    subheading: "محفوظة على هذا الجهاز — العب اختبارًا لإضافة نتيجتك",
    empty: "لا توجد نتائج بعد. أكمل اختبارًا واحفظ نتيجتك لتظهر هنا.",
  },
  footer: {
    verse: "«كلامك سراج لرجلي ونور لسبيلي.» — مزمور ١١٩:١٠٥",
    tagline: "Menorah Bible Quiz · مُعدّ للكنائس ومجموعات الشباب والعائلات",
  },
};
