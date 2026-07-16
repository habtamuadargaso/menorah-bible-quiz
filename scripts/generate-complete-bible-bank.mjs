import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const PROGRESS_PATH = path.join(
  PROJECT_ROOT,
  "scripts",
  "complete-bank-progress.json"
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing environment file: ${filePath}`);
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      !trimmed.includes("=")
    ) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();

    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(ENV_PATH);

const ADMIN_SECRET =
  process.env.QUESTION_ADMIN_SECRET;

if (!ADMIN_SECRET) {
  throw new Error(
    "QUESTION_ADMIN_SECRET is missing from .env.local."
  );
}

const API_URL =
  process.env.QUESTION_GENERATOR_URL ||
  "http://localhost:3001/api/questions/generate";

const LANGUAGES = ["en", "am"];
const QUESTIONS_PER_LEVEL = 10;
const MAX_REQUEST_ATTEMPTS = 3;
const WAIT_BETWEEN_JOBS_MS = 5000;
const WAIT_AFTER_FAILURE_MS = 12000;

/*
 * Old Testament is excluded because it is already complete.
 * Category names exactly match the values used by your game/database mapping.
 */
const CATEGORY_CONFIGS = [
  {
    category: "New Testament",
    levels: [
      ["Matthew", "very-easy"],
      ["Mark", "easy"],
      ["Luke", "easy-plus"],
      ["John", "medium"],
      ["Acts", "medium-plus"],
      ["Romans", "hard"],
      ["1 Corinthians", "hard-plus"],
      ["Ephesians", "expert"],
      ["Hebrews", "master"],
      ["Revelation", "scholar"],
    ],
  },
  {
    category: "Life of Jesus",
    levels: [
      ["Matthew", "very-easy"],
      ["Mark", "easy"],
      ["Luke", "easy-plus"],
      ["John", "medium"],
      ["Matthew", "medium-plus"],
      ["Luke", "hard"],
      ["John", "hard-plus"],
      ["Matthew", "expert"],
      ["Luke", "master"],
      ["John", "scholar"],
    ],
  },
  {
    category: "Apostles",
    levels: [
      ["Acts", "very-easy"],
      ["Acts", "easy"],
      ["Acts", "easy-plus"],
      ["Romans", "medium"],
      ["1 Corinthians", "medium-plus"],
      ["Galatians", "hard"],
      ["Ephesians", "hard-plus"],
      ["1 Peter", "expert"],
      ["1 John", "master"],
      ["Revelation", "scholar"],
    ],
  },
  {
    category: "Bible Characters",
    levels: [
      ["Genesis", "very-easy"],
      ["Exodus", "easy"],
      ["Joshua", "easy-plus"],
      ["Judges", "medium"],
      ["1 Samuel", "medium-plus"],
      ["2 Samuel", "hard"],
      ["1 Kings", "hard-plus"],
      ["Daniel", "expert"],
      ["Matthew", "master"],
      ["Acts", "scholar"],
    ],
  },
  {
    category: "Youth Challenge",
    levels: [
      ["Genesis", "very-easy"],
      ["Exodus", "easy"],
      ["Psalms", "easy-plus"],
      ["Proverbs", "medium"],
      ["Daniel", "medium-plus"],
      ["Matthew", "hard"],
      ["Luke", "hard-plus"],
      ["Acts", "expert"],
      ["Romans", "master"],
      ["James", "scholar"],
    ],
  },
  {
    category: "Psalms & Proverbs",
    levels: [
      ["Psalms", "very-easy"],
      ["Proverbs", "easy"],
      ["Psalms", "easy-plus"],
      ["Proverbs", "medium"],
      ["Psalms", "medium-plus"],
      ["Proverbs", "hard"],
      ["Psalms", "hard-plus"],
      ["Proverbs", "expert"],
      ["Psalms", "master"],
      ["Proverbs", "scholar"],
    ],
  },
  {
    category: "Faith & Prayer",
    levels: [
      ["Psalms", "very-easy"],
      ["Matthew", "easy"],
      ["Luke", "easy-plus"],
      ["John", "medium"],
      ["Acts", "medium-plus"],
      ["Romans", "hard"],
      ["Ephesians", "hard-plus"],
      ["Philippians", "expert"],
      ["Hebrews", "master"],
      ["James", "scholar"],
    ],
  },
  {
    category: "Gospel Challenge",
    levels: [
      ["Matthew", "very-easy"],
      ["Mark", "easy"],
      ["Luke", "easy-plus"],
      ["John", "medium"],
      ["Matthew", "medium-plus"],
      ["Mark", "hard"],
      ["Luke", "hard-plus"],
      ["John", "expert"],
      ["Romans", "master"],
      ["Galatians", "scholar"],
    ],
  },
  {
    category: "Hard Questions",
    levels: [
      ["Genesis", "hard"],
      ["Leviticus", "hard"],
      ["Numbers", "hard-plus"],
      ["1 Kings", "hard-plus"],
      ["Isaiah", "expert"],
      ["Ezekiel", "expert"],
      ["Daniel", "master"],
      ["Romans", "master"],
      ["Hebrews", "scholar"],
      ["Revelation", "scholar"],
    ],
  },
];

function delay(milliseconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}

function jobId(category, level) {
  return `${category}::${level}`;
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) {
    return {
      completed: {},
      failed: {},
      totals: {
        questions: 0,
        translations: 0,
      },
      updatedAt: null,
    };
  }

  try {
    return JSON.parse(
      fs.readFileSync(PROGRESS_PATH, "utf8")
    );
  } catch {
    throw new Error(
      `Progress file is invalid: ${PROGRESS_PATH}`
    );
  }
}

function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();

  fs.writeFileSync(
    PROGRESS_PATH,
    JSON.stringify(progress, null, 2),
    "utf8"
  );
}

async function generateQuestions({
  category,
  level,
  book,
  difficulty,
}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      category,
      level,
      count: QUESTIONS_PER_LEVEL,
      book,
      chapter: null,
      difficulty,
      languages: LANGUAGES,
    }),
  });

  const responseText = await response.text();

  let payload;

  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(
      `The API returned non-JSON content: ${responseText.slice(
        0,
        250
      )}`
    );
  }

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return payload;
}

async function runJob(job, progress) {
  const id = jobId(job.category, job.level);

  if (progress.completed[id]) {
    console.log(
      `↷ Skipping completed job: ${job.category} · Level ${job.level}`
    );
    return;
  }

  for (
    let attempt = 1;
    attempt <= MAX_REQUEST_ATTEMPTS;
    attempt += 1
  ) {
    console.log(
      `Generating ${job.category} · Level ${job.level}/10 · ${job.book} · ${job.difficulty} (attempt ${attempt}/${MAX_REQUEST_ATTEMPTS})...`
    );

    try {
      const result = await generateQuestions(job);

      const generated =
        Number(result.generated ?? 0);
      const translations =
        Number(result.translations ?? 0);

      progress.completed[id] = {
        category: job.category,
        level: job.level,
        book: job.book,
        difficulty: job.difficulty,
        questions: generated,
        translations,
        completedAt: new Date().toISOString(),
      };

      delete progress.failed[id];

      progress.totals.questions += generated;
      progress.totals.translations += translations;

      saveProgress(progress);

      console.log(
        `✓ Saved ${generated} questions and ${translations} translations.`
      );

      return;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `✗ Attempt ${attempt} failed: ${message}`
      );

      if (attempt < MAX_REQUEST_ATTEMPTS) {
        console.log(
          "Waiting before retrying..."
        );

        await delay(WAIT_AFTER_FAILURE_MS);
      } else {
        progress.failed[id] = {
          category: job.category,
          level: job.level,
          book: job.book,
          difficulty: job.difficulty,
          error: message,
          failedAt: new Date().toISOString(),
        };

        saveProgress(progress);
      }
    }
  }
}

async function main() {
  const progress = loadProgress();

  const jobs = CATEGORY_CONFIGS.flatMap(
    ({ category, levels }) =>
      levels.map(([book, difficulty], index) => ({
        category,
        level: index + 1,
        book,
        difficulty,
      }))
  );

  console.log("");
  console.log("MENORAH BIBLE QUIZ");
  console.log("Complete Bible Bank Generator");
  console.log("------------------------------------------");
  console.log(`API: ${API_URL}`);
  console.log(`Languages: ${LANGUAGES.join(", ")}`);
  console.log(`Remaining jobs: ${jobs.length}`);
  console.log(
    "Old Testament: skipped because it is already complete"
  );
  console.log(
    `Progress file: ${PROGRESS_PATH}`
  );
  console.log("");

  for (
    let index = 0;
    index < jobs.length;
    index += 1
  ) {
    await runJob(jobs[index], progress);

    if (index < jobs.length - 1) {
      await delay(WAIT_BETWEEN_JOBS_MS);
    }
  }

  const completedJobs =
    Object.keys(progress.completed).length;
  const failedJobs =
    Object.keys(progress.failed).length;

  console.log("");
  console.log("------------------------------------------");
  console.log("COMPLETE BANK GENERATION REPORT");
  console.log(`Completed jobs: ${completedJobs}`);
  console.log(`Failed jobs: ${failedJobs}`);
  console.log(
    `Questions generated by this script: ${progress.totals.questions}`
  );
  console.log(
    `Translations generated by this script: ${progress.totals.translations}`
  );

  if (failedJobs > 0) {
    console.log("");
    console.log("Failed jobs:");

    for (const failure of Object.values(
      progress.failed
    )) {
      console.log(
        `- ${failure.category} · Level ${failure.level}: ${failure.error}`
      );
    }

    console.log("");
    console.log(
      "Run this same command again later. Completed jobs will be skipped and only failed jobs will retry."
    );

    process.exitCode = 1;
  } else {
    console.log("");
    console.log(
      "✓ All remaining categories and levels completed."
    );
  }
}

main().catch((error) => {
  console.error(
    "Complete bank generator stopped:",
    error
  );

  process.exitCode = 1;
});
