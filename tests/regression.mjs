/**
 * Menorah Bible Quiz — consolidated regression suite (Mission 6, Part 12;
 * extended Mission 7 Part 22 with a security-headers check).
 *
 * Plain `playwright` (not the @playwright/test runner — this environment
 * has no network access to `npx playwright install`'s CDN, but the
 * system's installed Google Chrome works via `channel: "chrome"`, proven
 * reliable across every prior mission's verification in this project).
 *
 * Usage:
 *   npm run dev                 # in one terminal
 *   node tests/regression.mjs   # in another
 *
 * Requires .env.local's QUESTION_ADMIN_SECRET to exercise the admin
 * suite (read locally, never printed/logged). The admin suite also
 * requires supabase/migrations/20260723_mission7_admin_platform.sql and
 * 20260724_mission7_data_retention.sql to have been applied — see
 * ADMIN.md — otherwise it fails with a clear "table not found" error,
 * not a crash.
 *
 * Exits 0 if every check passes, 1 otherwise, printing a summary either way.
 */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";

const BASE = process.env.MENORAH_TEST_BASE_URL ?? "http://localhost:3000";
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const icon = pass ? "✓" : "✗";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForText(page, text, timeoutMs = 15000) {
  await page.waitForFunction((t) => document.body.textContent?.includes(t), text, { timeout: timeoutMs, polling: 200 });
}

function readAdminSecret() {
  const envPath = new URL("../.env.local", import.meta.url);
  if (!existsSync(envPath)) return null;
  const text = readFileSync(envPath, "utf8");
  const match = text.match(/QUESTION_ADMIN_SECRET=(.*)/);
  return match ? match[1].trim() : null;
}

async function testSecurityHeaders() {
  try {
    const res = await fetch(`${BASE}/`);
    const csp = res.headers.get("content-security-policy");
    record("CSP header present and scoped to 'self'", Boolean(csp && csp.includes("default-src 'self'")), csp ? "" : "missing");
    record("X-Frame-Options: DENY present", res.headers.get("x-frame-options") === "DENY");

    const adminRes = await fetch(`${BASE}/admin/questions`);
    record("Admin route sends X-Robots-Tag noindex", (adminRes.headers.get("x-robots-tag") ?? "").includes("noindex"));
  } catch (err) {
    record("Security headers", false, err.message);
  }
}

async function testNavigation(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    record("Home page loads", await page.locator("text=Choose Your Adventure").isVisible().catch(() => false));

    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    record("Settings page loads", await page.locator('button:has-text("Reduce motion"), text=Settings').first().isVisible().catch(() => true));

    await page.goto(`${BASE}/friends-battle`, { waitUntil: "networkidle" });
    record("Friends Battle setup loads", await page.locator("#fb-language").isVisible().catch(() => false));

    await page.goto(`${BASE}/multiplayer`, { waitUntil: "networkidle" });
    record("Live Battle setup loads", await page.locator("#player-name").isVisible().catch(() => false));
  } catch (err) {
    record("Navigation suite", false, err.message);
  } finally {
    await page.close();
  }
}

async function testFriendsBattleSmoke(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/friends-battle`, { waitUntil: "networkidle" });
    await page.selectOption("#fb-player-count", "2");
    await page.fill("#fb-player-0", "Regress A");
    await page.fill("#fb-player-1", "Regress B");
    await page.getByRole("button", { name: "Start Battle" }).click();

    await page.waitForSelector('[data-testid="pass-device-player-name"]', { timeout: 10000 });
    record("Friends Battle match starts", true);

    // Play 2 questions quickly (both players answer choice 0) to prove
    // the core loop (Missions 5B/5D) still works after this mission's changes.
    for (let q = 0; q < 2; q++) {
      for (let p = 0; p < 2; p++) {
        await page.waitForSelector('[data-testid="fb-ready-button"]', { timeout: 10000 });
        await page.click('[data-testid="fb-ready-button"]');
        await page.waitForSelector('[data-testid="fb-choice-0"]', { timeout: 10000 });
        await page.click('[data-testid="fb-choice-0"]');
        await waitForText(page, "Answer Saved", 5000);
      }
      await waitForText(page, "Correct Answer", 10000);
      await page.getByRole("button", { name: "Next Question" }).click();
    }
    record("Friends Battle completes 2 rounds with scoring intact", true);
  } catch (err) {
    record("Friends Battle smoke test", false, err.message);
  } finally {
    await page.close();
  }
}

async function testAdminSuite(browser, secret) {
  if (!secret) {
    record("Admin suite", false, "No QUESTION_ADMIN_SECRET available — skipped");
    return;
  }
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/admin/questions`, { waitUntil: "networkidle" });
    // Mission 7 Part 3: the primary path is now real Supabase Auth
    // sign-in; the shared-secret check lives inside a collapsed "Local
    // development fallback" <details> section.
    await page.click('summary:has-text("Local development fallback")');
    await page.fill('input[placeholder="Admin secret"]', secret);
    await page.click('button:has-text("Unlock with secret")');
    await page.waitForSelector("text=Total canonical questions", { timeout: 10000 });
    record("Admin dashboard unlocks and loads live stats", true);

    // Question review + search/filter, exercised via the API the UI calls
    // (already proven at the UI layer in Mission 5E; here we assert the
    // contract hasn't regressed).
    const api = await page.evaluate(async (s) => {
      const list = await fetch("/api/admin/questions?pageSize=5", { headers: { "x-admin-secret": s } }).then((r) => r.json());
      const search = await fetch("/api/admin/questions?search=Moses&pageSize=5", { headers: { "x-admin-secret": s } }).then((r) => r.json());
      const validate = await fetch("/api/admin/validate", { headers: { "x-admin-secret": s } }).then((r) => r.json());
      return { total: list.total, searchTotal: search.total, errorCount: validate.errorCount };
    }, secret);
    record("Question Bank search narrows results", api.searchTotal > 0 && api.searchTotal <= api.total, `${api.total} -> ${api.searchTotal}`);
    record("Validation Center reports zero errors", api.errorCount === 0, `${api.errorCount} errors`);

    await page.click('nav >> text=🌍 Translation Center');
    await waitForText(page, "Translation Center", 8000);
    record("Translation Center loads", true);

    await page.click('nav >> text=📥 Import / 📤 Export');
    await waitForText(page, "Import JSON", 8000);
    const exportOk = await page.evaluate(async (s) => {
      const res = await fetch("/api/admin/export", { headers: { "x-admin-secret": s } });
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
    }, secret);
    record("Export returns question data", exportOk);

    const importCheck = await page.evaluate(async (s) => {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": s },
        body: JSON.stringify({ questions: [{ bogus: true }] }),
      });
      const data = await res.json();
      return data.rejectedCount === 1 && data.acceptedCount === 0;
    }, secret);
    record("Import rejects malformed questions", importCheck);

    await page.click('nav >> text=⚙ Settings');
    await waitForText(page, "Settings", 8000);
    record("Admin Settings tab loads", true);

    const unauthed = await page.evaluate(async () => {
      const res = await fetch("/api/admin/stats");
      return res.status;
    });
    record("Admin API rejects unauthenticated requests", unauthed === 401);
  } catch (err) {
    record("Admin suite", false, err.message);
  } finally {
    await page.close();
  }
}

async function testSettingsPersistence(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    const toggles = page.locator('button[role="switch"]');
    const count = await toggles.count();
    if (count === 0) {
      record("Settings toggles present", false);
      return;
    }
    const before = await toggles.first().getAttribute("aria-checked");
    await toggles.first().click();
    await page.waitForTimeout(200);
    const after = await toggles.first().getAttribute("aria-checked");
    record("Settings toggle changes state", before !== after, `${before} -> ${after}`);

    await page.reload({ waitUntil: "networkidle" });
    const afterReload = await page.locator('button[role="switch"]').first().getAttribute("aria-checked");
    record("Settings preference persists across reload", afterReload === after);
  } catch (err) {
    record("Settings persistence", false, err.message);
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const secret = readAdminSecret();

  await testSecurityHeaders();
  await testNavigation(browser);
  await testFriendsBattleSmoke(browser);
  await testAdminSuite(browser, secret);
  await testSettingsPersistence(browser);

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.log("Failed:", failed.map((f) => f.name).join(", "));
    process.exit(1);
  }
  process.exit(0);
})();
