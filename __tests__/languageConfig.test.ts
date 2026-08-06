import { describe, expect, it } from "vitest";
import {
  ALL_LANGUAGES,
  CONFIGURED_LANGUAGE_CODES,
  LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  isPlayerLanguage,
} from "@/lib/i18n/locales";

describe("public language configuration", () => {
  it("exposes every centrally configured language to players", () => {
    expect(LANGUAGES).toEqual(ALL_LANGUAGES);
    expect(SUPPORTED_LANGUAGE_CODES).toEqual(CONFIGURED_LANGUAGE_CODES);
  });

  it("keeps registry readiness metadata without using it as a public visibility gate", () => {
    expect(CONFIGURED_LANGUAGE_CODES).toContain("es");
    expect(ALL_LANGUAGES.filter(({ releaseStatus }) => releaseStatus === "future").length).toBeGreaterThan(0);
  });

  it("accepts every configured locale and rejects unknown locales", () => {
    expect(isPlayerLanguage("en")).toBe(true);
    expect(isPlayerLanguage("am")).toBe(true);
    expect(isPlayerLanguage("es")).toBe(true);
    expect(isPlayerLanguage("ja")).toBe(true);
    expect(isPlayerLanguage("unknown")).toBe(false);
  });
});
