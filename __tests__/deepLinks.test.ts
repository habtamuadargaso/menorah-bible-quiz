import { describe, it, expect } from "vitest";
import { resolveDeepLinkPath } from "@/lib/mobile/deepLinks";

describe("resolveDeepLinkPath", () => {
  it("maps a bare custom-scheme path to the same in-app path", () => {
    expect(resolveDeepLinkPath("menorah://settings")).toBe("/settings");
  });

  it("preserves query strings for a custom-scheme multi-segment path", () => {
    expect(resolveDeepLinkPath("menorah://multiplayer/join?room=ABCD")).toBe("/multiplayer/join?room=ABCD");
  });

  it("resolves the join/<CODE> shortcut (custom scheme) to the real join-room route", () => {
    expect(resolveDeepLinkPath("menorah://join/abc123")).toBe("/multiplayer/join?room=ABC123");
  });

  it("resolves the join/<CODE> shortcut (https Universal Link form) the same way", () => {
    expect(resolveDeepLinkPath("https://menorah-bible-quiz.vercel.app/join/xyz789")).toBe("/multiplayer/join?room=XYZ789");
  });

  it("maps a plain https URL to its pathname + search", () => {
    expect(resolveDeepLinkPath("https://menorah-bible-quiz.vercel.app/multiplayer/join?room=ABCD")).toBe(
      "/multiplayer/join?room=ABCD"
    );
  });

  it("maps the bare custom scheme with nothing after it to the home route", () => {
    expect(resolveDeepLinkPath("menorah://")).toBe("/");
  });

  it("returns null for an unsupported protocol", () => {
    expect(resolveDeepLinkPath("mailto:someone@example.com")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(resolveDeepLinkPath("not a url at all")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(resolveDeepLinkPath("")).toBeNull();
  });
});
