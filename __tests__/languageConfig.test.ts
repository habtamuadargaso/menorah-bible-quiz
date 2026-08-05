import { describe, expect, it } from "vitest";
import {
  ALL_LANGUAGES,
  CONFIGURED_LANGUAGE_CODES,
  LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  isPlayerLanguage,
} from "@/lib/i18n/locales";

describe("Version 1.0 language configuration", () => {
  it("exposes only English and Amharic to players", () => {
    expect(LANGUAGES.map(({ code }) => code)).toEqual(["en", "am"]);
    expect(SUPPORTED_LANGUAGE_CODES).toEqual(["en", "am"]);
  });

  it("keeps future languages configured but disabled", () => {
    expect(ALL_LANGUAGES.length).toBeGreaterThan(LANGUAGES.length);
    expect(CONFIGURED_LANGUAGE_CODES).toContain("es");
    expect(ALL_LANGUAGES.filter(({ releaseStatus }) => releaseStatus === "future").length).toBeGreaterThan(0);
  });

  it("rejects future and unknown locales as player languages", () => {
    expect(isPlayerLanguage("en")).toBe(true);
    expect(isPlayerLanguage("am")).toBe(true);
    expect(isPlayerLanguage("es")).toBe(false);
    expect(isPlayerLanguage("unknown")).toBe(false);
  });
});
