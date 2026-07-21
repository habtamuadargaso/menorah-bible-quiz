import type { BibleQuestion, CanonicalCategory, Testament } from "./types";

/**
 * ARCHITECTURE NOTES (Mission 5C)
 * ================================
 * This file is the single source of truth for how the question bank
 * organizes the Bible into levels, testaments, and categories. Nothing
 * here is fabricated Bible content — it's standard Protestant-canon book
 * order and structure, used purely to classify/organize whatever real,
 * human-authored questions exist (see legacyMigration.ts for how the
 * existing local question banks feed into this).
 *
 * LEVEL PROGRESSION
 * ------------------
 * Levels follow Bible reading order (Genesis -> Revelation), grouped into
 * ten stages rather than one book per level (66 books don't divide evenly
 * into 10, and some books — Genesis especially — cover enough ground to
 * split across two levels by narrative arc):
 *
 *   Level 1  Genesis 1-24    Creation, Noah, Abraham
 *   Level 2  Genesis 25-50   Isaac, Jacob, Joseph
 *   Level 3  Exodus, Leviticus                    Moses, Passover, the Law given at Sinai
 *   Level 4  Numbers, Deuteronomy, Joshua, Judges, Ruth   wilderness -> conquest -> judges
 *   Level 5  1-2 Samuel, 1-2 Kings, 1-2 Chronicles, Ezra, Nehemiah, Esther   the kingdom era
 *   Level 6  Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon           wisdom literature
 *   Level 7  Isaiah - Malachi (major + minor prophets)
 *   Level 8  Matthew, Mark, Luke, John                                     the Gospels
 *   Level 9  Acts, Romans - Philemon                                       Acts + Paul's letters
 *   Level 10 Hebrews - Revelation                                          general epistles + Revelation
 *
 * This is a real, defensible reading order — not a random shuffle across
 * every book in every level, which is the mistake this mission called out.
 *
 * CATEGORY vs TAGS
 * ------------------
 * `canonicalCategory` is the small, fixed classification this mission
 * specifies (People, Places, Miracles, ... Old Testament, New Testament).
 * The pre-existing free-form `category` field (values like "Creation" or
 * "Moses") and anything else worth filtering by lives in `tags` instead —
 * see CanonicalCategory in types.ts for the full list.
 */

export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  "People",
  "Places",
  "Miracles",
  "Parables",
  "Prophecy",
  "Law",
  "Kings",
  "Judges",
  "Disciples",
  "Women",
  "Paul",
  "Jesus",
  "Old Testament",
  "New Testament",
];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Ordered, canonical 66-book list with its testament — standard
 * Protestant canon order, not app-specific. */
export const BIBLE_BOOKS: Array<{ book: string; testament: Testament }> = [
  // Old Testament (39)
  ...[
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalm", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi",
  ].map((book) => ({ book, testament: "old" as Testament })),
  // New Testament (27)
  ...[
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
    "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation",
  ].map((book) => ({ book, testament: "new" as Testament })),
];

const BOOK_ALIASES: Record<string, string> = {
  psalms: "Psalm",
  "song of songs": "Song of Solomon",
  "biblical canon": "Biblical canon", // not a real book — see levelForReference's fallback
};

function normalizeBookName(rawBook: string): string {
  const trimmed = rawBook.trim();
  const alias = BOOK_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

export function testamentForBook(rawBook: string): Testament | null {
  const book = normalizeBookName(rawBook);
  return BIBLE_BOOKS.find((b) => b.book === book)?.testament ?? null;
}

/** Which of the 10 levels a book belongs to. Genesis is intentionally
 * split by chapter (see levelForReference) since it alone spans levels 1-2. */
const BOOK_LEVEL: Record<string, number> = {
  // Level 3
  Exodus: 3, Leviticus: 3,
  // Level 4
  Numbers: 4, Deuteronomy: 4, Joshua: 4, Judges: 4, Ruth: 4,
  // Level 5
  "1 Samuel": 5, "2 Samuel": 5, "1 Kings": 5, "2 Kings": 5,
  "1 Chronicles": 5, "2 Chronicles": 5, Ezra: 5, Nehemiah: 5, Esther: 5,
  // Level 6
  Job: 6, Psalm: 6, Proverbs: 6, Ecclesiastes: 6, "Song of Solomon": 6,
  // Level 7
  Isaiah: 7, Jeremiah: 7, Lamentations: 7, Ezekiel: 7, Daniel: 7,
  Hosea: 7, Joel: 7, Amos: 7, Obadiah: 7, Jonah: 7, Micah: 7,
  Nahum: 7, Habakkuk: 7, Zephaniah: 7, Haggai: 7, Zechariah: 7, Malachi: 7,
  // Level 8
  Matthew: 8, Mark: 8, Luke: 8, John: 8,
  // Level 9
  Acts: 9, Romans: 9, "1 Corinthians": 9, "2 Corinthians": 9, Galatians: 9,
  Ephesians: 9, Philippians: 9, Colossians: 9, "1 Thessalonians": 9,
  "2 Thessalonians": 9, "1 Timothy": 9, "2 Timothy": 9, Titus: 9, Philemon: 9,
  // Level 10
  Hebrews: 10, James: 10, "1 Peter": 10, "2 Peter": 10, "1 John": 10,
  "2 John": 10, "3 John": 10, Jude: 10, Revelation: 10,
};

const GENESIS_LEVEL_1_2_SPLIT_CHAPTER = 25; // Isaac's story begins ~Genesis 21-25

/** Parses a "Book Chapter:Verse" reference string (e.g. "Genesis 6:14",
 * "1 Samuel 17:49") into its book + level. Falls back to level 1 with a
 * warning-worthy null book for anything that doesn't parse (e.g. the
 * placeholder "Biblical canon" meta-reference) rather than throwing, since
 * this runs over real legacy content that predates this schema. */
export function levelForReference(
  reference: string
): { book: string | null; testament: Testament | null; level: number; chapter: number | null } {
  const match = reference.match(/^((?:[123]\s)?[A-Za-z. ]+?)\s+(\d+)/);
  if (!match) return { book: null, testament: null, level: 1, chapter: null };

  const book = normalizeBookName(match[1]);
  const chapter = parseInt(match[2], 10);
  const testament = testamentForBook(book);

  if (book === "Genesis") {
    return { book, testament: "old", level: chapter >= GENESIS_LEVEL_1_2_SPLIT_CHAPTER ? 2 : 1, chapter };
  }
  const level = BOOK_LEVEL[book];
  if (level) return { book, testament, level, chapter };

  // Unknown/unparsed book (e.g. "Biblical canon") — default to level 1
  // rather than silently dropping the question; it still shows up in
  // validation reports as worth a human's attention.
  return { book, testament, level: 1, chapter };
}

const TIER_TO_SIMPLE: Record<BibleQuestion["difficulty"], "Easy" | "Medium" | "Hard"> = {
  "very-easy": "Easy",
  easy: "Easy",
  "easy-plus": "Easy",
  medium: "Medium",
  "medium-plus": "Medium",
  hard: "Hard",
  "hard-plus": "Hard",
  expert: "Hard",
  master: "Hard",
  scholar: "Hard",
};

/** The question bank's canonical data uses a finer 10-tier difficulty
 * scale (kept for backward compatibility with the existing seed data);
 * gameplay everywhere else (Friends Battle, Live Battle) uses a simple
 * Easy/Medium/Hard tier. This is the single place that maps one to the
 * other so the two scales can never drift apart silently. */
export function normalizeDifficultyTier(difficulty: BibleQuestion["difficulty"]): "Easy" | "Medium" | "Hard" {
  return TIER_TO_SIMPLE[difficulty];
}
