import type { LangCode } from "@/lib/i18n/locales";

// ---------------------------------------------------------------------------
// Daily Bible Verse / Memory Verse Challenge data.
//
// IMPORTANT: Only English ("en") and Amharic ("am") text are provided below,
// and even these should be checked against a trusted Bible translation
// before publishing. Do not auto-translate verse text into the other
// supported languages — leave `text` for those languages unset so the verse
// falls back to English (see getVerseText below) until a reviewed
// translation is added.
// ---------------------------------------------------------------------------
export interface VerseEntry {
  id: string;
  reference: string;
  text: Partial<Record<LangCode, string>>;
}

export const VERSES: VerseEntry[] = [
  {
    id: "v1",
    reference: "John 3:16",
    text: {
      en: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      am: "እግዚአብሔር ዓለሙን እስከ መውደዱ ድረስ አንድያ ልጁን ሰጠ፥ በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ።",
    },
  },
  {
    id: "v2",
    reference: "Psalm 119:105",
    text: {
      en: "Thy word is a lamp unto my feet, and a light unto my path.",
      am: "ቃልህ ለእግሬ መብራት፣ ለመንገዴም ብርሃን ነው።",
    },
  },
  {
    id: "v3",
    reference: "Proverbs 3:5",
    text: {
      en: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
      am: "በፍጹም ልብህ በእግዚአብሔር ታመን፤ በራስህ ማስተዋልም አትደገፍ።",
    },
  },
  {
    id: "v4",
    reference: "Philippians 4:13",
    text: {
      en: "I can do all things through Christ which strengtheneth me.",
      am: "ኃይልን በሚሰጠኝ በክርስቶስ ሁሉን እችላለሁ።",
    },
  },
  {
    id: "v5",
    reference: "Joshua 1:9",
    text: {
      en: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
      am: "እነሆ አዝዤሃለሁ፤ ብርታትንና ጽናትን ልበስ፤ አትፍራ፥ አትደንግጥም፤ በሄድህበት ሁሉ አምላክህ እግዚአብሔር ካንተ ጋር ነውና።",
    },
  },
  {
    id: "v6",
    reference: "Romans 8:28",
    text: {
      en: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      am: "ለእግዚአብሔር ለሚወዱት እንደ አሳቡም ለተጠሩት ነገር ሁሉ ለበጎ እንዲደረግ እናውቃለን።",
    },
  },
  {
    id: "v7",
    reference: "Isaiah 41:10",
    text: {
      en: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.",
      am: "አትፍራ፥ ከአንተ ጋር ነኝና፤ አትደንግጥ፥ አምላክህ ነኝና፤ አበረታሃለሁ፥ በእውነትም እረዳሃለሁ።",
    },
  },
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function getDailyVerse(date: Date = new Date()): VerseEntry {
  const idx = dayOfYear(date) % VERSES.length;
  return VERSES[idx];
}

export function getMemoryVerse(date: Date = new Date()): VerseEntry {
  // offset from the daily verse so the two sections don't always show the same verse
  const idx = (dayOfYear(date) + 3) % VERSES.length;
  return VERSES[idx];
}

export function getVerseText(verse: VerseEntry, lang: LangCode): string {
  return verse.text[lang] ?? verse.text.en ?? "";
}
