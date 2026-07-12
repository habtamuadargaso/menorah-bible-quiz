const HISTORY_PREFIX = "menorah-used-questions";

export function getUsedQuestionIds(level: number): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(
    `${HISTORY_PREFIX}-level-${level}`
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveUsedQuestionIds(
  level: number,
  questionIds: string[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  const previous = getUsedQuestionIds(level);
  const merged = Array.from(
    new Set([...previous, ...questionIds])
  );

  window.localStorage.setItem(
    `${HISTORY_PREFIX}-level-${level}`,
    JSON.stringify(merged)
  );
}

export function resetUsedQuestionIds(level: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    `${HISTORY_PREFIX}-level-${level}`
  );
}