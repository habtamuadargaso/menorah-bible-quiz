"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANG, LANGUAGES, type LangCode } from "./locales";
import { TRANSLATIONS } from "./translations";
import type { UIStrings } from "./types";

const STORAGE_KEY = "menorah-bible-quiz-lang";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: UIStrings;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Deep-merges a partial translation object onto the full English base, so
// any string a language hasn't translated yet silently falls back to
// English instead of rendering blank or undefined.
function deepMerge<T>(base: T, override: unknown): T {
  if (typeof override !== "object" || override === null || Array.isArray(override)) {
    return base;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const overrideVal = (override as Record<string, unknown>)[key];
    const baseVal = (base as Record<string, unknown>)[key];
    if (
      typeof overrideVal === "object" &&
      overrideVal !== null &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === "object" &&
      baseVal !== null
    ) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const [mounted, setMounted] = useState(false);

  // Read the saved language after mount only, so the server-rendered HTML
  // (always English/LTR) matches the first client render and React never
  // hits a hydration mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setLangState(saved);
      }
    } catch {
      // localStorage unavailable — stay on default language
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore write failures (e.g. private browsing)
    }
    const info = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = info?.rtl ? "rtl" : "ltr";
  }, [lang, mounted]);

  function setLang(next: LangCode) {
    setLangState(next);
  }

  const t = useMemo<UIStrings>(() => {
    return deepMerge(TRANSLATIONS.en as UIStrings, TRANSLATIONS[lang]);
  }, [lang]);

  const dir: "ltr" | "rtl" = LANGUAGES.find((l) => l.code === lang)?.rtl ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be used inside <LanguageProvider>");
  }
  return ctx;
}
