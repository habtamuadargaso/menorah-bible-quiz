type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

export type GeminiGenerateOptions = {
  temperature?: number;
  topP?: number;
  responseMimeType?: "application/json" | "text/plain";
  maxOutputTokens?: number;
};

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY in the server environment."
    );
  }

  return apiKey;
}

export function getGeminiModel(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-3.1-flash-lite"
  );
}

function extractGeminiText(
  payload: GeminiResponse
): string {
  const candidate = payload.candidates?.[0];

  if (!candidate) {
    const blockReason =
      payload.promptFeedback?.blockReason;

    throw new Error(
      blockReason
        ? `Gemini blocked the request: ${blockReason}.`
        : "Gemini returned no response candidate."
    );
  }

  const parts =
    candidate.content?.parts ?? [];

  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(
      `Gemini returned an empty response${
        candidate.finishReason
          ? ` (${candidate.finishReason})`
          : ""
      }.`
    );
  }

  return text;
}

export async function generateWithGemini(
  prompt: string,
  options: GeminiGenerateOptions = {}
): Promise<string> {
  const cleanPrompt = prompt.trim();

  if (!cleanPrompt) {
    throw new Error(
      "Gemini prompt cannot be empty."
    );
  }

  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: cleanPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature:
            options.temperature ?? 0.65,
          topP:
            options.topP ?? 0.9,
          maxOutputTokens:
            options.maxOutputTokens ?? 16384,
          responseMimeType:
            options.responseMimeType ??
            "application/json",
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorBody =
      await response.text();

    throw new Error(
      `Gemini request failed with status ${response.status}: ${errorBody}`
    );
  }

  const payload =
    (await response.json()) as GeminiResponse;

  return extractGeminiText(payload);
}

function removeMarkdownFences(
  value: string
): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^```(?:json|javascript|js)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function findJsonStart(
  value: string
): number {
  const arrayIndex = value.indexOf("[");
  const objectIndex = value.indexOf("{");

  if (arrayIndex === -1) {
    return objectIndex;
  }

  if (objectIndex === -1) {
    return arrayIndex;
  }

  return Math.min(
    arrayIndex,
    objectIndex
  );
}

function extractBalancedJson(
  value: string
): string {
  const start = findJsonStart(value);

  if (start === -1) {
    throw new Error(
      "Gemini response did not contain JSON."
    );
  }

  const opening = value[start];
  const closing =
    opening === "[" ? "]" : "}";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let index = start;
    index < value.length;
    index += 1
  ) {
    const character = value[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === opening) {
      depth += 1;
      continue;
    }

    if (character === closing) {
      depth -= 1;

      if (depth === 0) {
        return value.slice(
          start,
          index + 1
        );
      }
    }
  }

  throw new Error(
    "Gemini returned incomplete JSON, likely because the response was truncated."
  );
}

function removeTrailingCommas(
  value: string
): string {
  return value.replace(
    /,\s*([}\]])/g,
    "$1"
  );
}

export function parseGeminiJson<T>(
  text: string
): T {
  const withoutFences =
    removeMarkdownFences(text);

  const attempts = [
    withoutFences,
    removeTrailingCommas(
      withoutFences
    ),
  ];

  try {
    const extracted =
      extractBalancedJson(
        withoutFences
      );

    attempts.push(
      extracted,
      removeTrailingCommas(
        extracted
      )
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "incomplete JSON"
      )
    ) {
      throw error;
    }
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(
        attempt
      ) as T;
    } catch {
      // Try the next cleaned version.
    }
  }

  const preview = withoutFences
    .slice(0, 180)
    .replace(/\s+/g, " ");

  throw new Error(
    `Gemini returned invalid JSON. Response started with: ${preview}`
  );
}
