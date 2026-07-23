"use client";

import { useEffect, useState } from "react";
import type { LanguageAvailability } from "./languageAvailability";

export type { LanguageAvailability };

/**
 * Mission 10 — the one client-side source every language selector reads
 * from, instead of each one hardcoding its own allowlist (LanguageSelector.tsx
 * and LanguageModal.tsx used to both independently define the same
 * `LANGUAGES.filter(FULLY_TRANSLATED_QUESTION_LANGS.includes(...))` line).
 * Backed by the public GET /api/languages/availability endpoint.
 */
export function useLanguageAvailability() {
  const [availability, setAvailability] = useState<LanguageAvailability[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/languages/availability")
      .then((res) => res.json())
      .then((json: { languages?: LanguageAvailability[] }) => {
        if (active) setAvailability(json.languages ?? null);
      })
      .catch(() => {
        if (active) setAvailability(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { availability, loading };
}
