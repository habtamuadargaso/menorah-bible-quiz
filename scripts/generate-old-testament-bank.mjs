import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Environment file not found: ${filePath}`);
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

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();

    let value = trimmed
      .slice(separatorIndex + 1)
      .trim();

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

loadEnvFile(
  path.resolve(process.cwd(), ".env.local")
);

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

const LEVEL_CONFIGS = [
  {
    level: 1,
    difficulty: "very-easy",
    book: "Genesis",
  },
  {
    level: 2,
    difficulty: "easy",
    book: "Exodus",
  },
  {
    level: 3,
    difficulty: "easy-plus",
    book: "Joshua",
  },
  {
    level: 4,
    difficulty: "medium",
    book: "Judges",
  },
  {
    level: 5,
    difficulty: "medium-plus",
    book: "1 Samuel",
  },
  {
    level: 6,
    difficulty: "hard",
    book: "2 Samuel",
  },
  {
    level: 7,
    difficulty: "hard-plus",
    book: "1 Kings",
  },
  {
    level: 8,
    difficulty: "expert",
    book: "Psalms",
  },
  {
    level: 9,
    difficulty: "master",
    book: "Proverbs",
  },
  {
    level: 10,
    difficulty: "scholar",
    book: "Daniel",
  },
];

const delay = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );

async function generateLevel(config) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      level: config.level,
      count: 10,
      book: config.book,
      chapter: null,
      category: "Old Testament",
      difficulty: config.difficulty,
      languages: ["en", "am"],
    }),
  });

  const responseText = await response.text();

  let payload;

  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server returned non-JSON content: ${responseText.slice(
        0,
        300
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

async function main() {
  console.log("");
  console.log("MENORAH BIBLE QUIZ");
  console.log("Old Testament Question Bank Generator");
  console.log("--------------------------------------");
  console.log(`API: ${API_URL}`);
  console.log("Languages: English, Amharic");
  console.log("");

  let totalQuestions = 0;
  let totalTranslations = 0;
  const failedLevels = [];

  for (const config of LEVEL_CONFIGS) {
    console.log(
      `Generating Level ${config.level}/10 — ${config.book} — ${config.difficulty}...`
    );

    try {
      const result =
        await generateLevel(config);

      totalQuestions +=
        Number(result.generated ?? 0);

      totalTranslations +=
        Number(result.translations ?? 0);

      console.log(
        `✓ Level ${config.level}: ${result.generated} questions, ${result.translations} translations`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      failedLevels.push({
        level: config.level,
        message,
      });

      console.error(
        `✗ Level ${config.level} failed: ${message}`
      );
    }

    if (config.level < 10) {
      console.log(
        "Waiting before the next level..."
      );

      await delay(5000);
    }
  }

  console.log("");
  console.log("--------------------------------------");
  console.log("Generation finished");
  console.log(
    `Questions saved: ${totalQuestions}`
  );
  console.log(
    `Translations saved: ${totalTranslations}`
  );

  if (failedLevels.length > 0) {
    console.log("");
    console.log("Failed levels:");

    for (const failure of failedLevels) {
      console.log(
        `- Level ${failure.level}: ${failure.message}`
      );
    }

    process.exitCode = 1;
  } else {
    console.log(
      "✓ All 10 Old Testament levels completed."
    );
  }
}

main().catch((error) => {
  console.error(
    "Question-bank generation stopped:",
    error
  );

  process.exitCode = 1;
});
