type GeminiResponse = {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  
  export type GeminiGenerateOptions = {
    temperature?: number;
    topP?: number;
    responseMimeType?: "application/json" | "text/plain";
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
  
  function getGeminiModel(): string {
    return (
      process.env.GEMINI_MODEL?.trim() ||
      "gemini-3.1-flash-lite"
    );
  }
  
  function extractGeminiText(
    payload: GeminiResponse
  ): string {
    const parts =
      payload.candidates?.[0]?.content?.parts ?? [];
  
    const text = parts
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  
    if (!text) {
      throw new Error(
        "Gemini returned an empty response."
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
              options.temperature ?? 0.75,
            topP: options.topP ?? 0.95,
            responseMimeType:
              options.responseMimeType ??
              "application/json",
          },
        }),
        cache: "no-store",
      }
    );
  
    if (!response.ok) {
      const errorBody = await response.text();
  
      throw new Error(
        `Gemini request failed with status ${response.status}: ${errorBody}`
      );
    }
  
    const payload =
      (await response.json()) as GeminiResponse;
  
    return extractGeminiText(payload);
  }
  
  export function parseGeminiJson<T>(
    text: string
  ): T {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
  
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(
        "Gemini returned invalid JSON."
      );
    }
  }