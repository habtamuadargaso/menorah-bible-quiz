"use client";

import { useEffect, useState } from "react";
import type { LanguageAvailability } from "./languageAvailability";

export type { LanguageAvailability };

/**
 * The one client-side source every language selector reads from for
 * informational "published questions available" signals. Mission 12: no
 * selector uses this to disable/hide a language anymore (every language in
 * SUPPORTED_LANGUAGE_CODES is always selectable) — it's purely a soft
 * "content is live" indicator now. Backed by the public GET
 * /api/languages/availability endpoint.
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
