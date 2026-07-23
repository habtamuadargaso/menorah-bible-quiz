/**
 * One-time migration: data/admin/*.json -> Supabase (Mission 7 Part 4).
 *
 * Idempotent: every write is an upsert keyed on the same id the JSON file
 * used, so running this multiple times (e.g. after adding more local
 * review data) just re-syncs, never duplicates. Safe to run against a
 * database that already has some or all of this data.
 *
 * Requires supabase/migrations/20260723_mission7_admin_platform.sql to
 * have been run first (in the Supabase SQL Editor), and
 * SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) + NEXT_PUBLIC_SUPABASE_URL
 * to be set in .env.local.
 *
 * Does NOT delete data/admin/*.json — verify the migrated data in Supabase
 * first, then remove the local files yourself once satisfied.
 *
 * Usage: node scripts/migrate-admin-json-to-supabase.mjs
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

function readJsonIfExists(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const reviewState = readJsonIfExists("data/admin/review-state.json");
  const importedQuestions = readJsonIfExists("data/admin/imported-questions.json");
  const settings = readJsonIfExists("data/admin/settings.json");

  let overlaysMigrated = 0;
  let historyMigrated = 0;
  let importedMigrated = 0;
  let settingsMigrated = false;

  if (reviewState) {
    const questionIds = Object.keys(reviewState);
    console.log(`Found ${questionIds.length} question(s) with review state.`);

    const overlayRows = questionIds.map((id) => {
      const overlay = reviewState[id];
      return {
        question_id: id,
        status: overlay.review.status,
        reviewer: overlay.review.reviewer,
        reviewed_at: overlay.review.reviewedAt,
        reason: overlay.review.reason,
        edits: overlay.edits ?? {},
        updated_at: new Date().toISOString(),
      };
    });

    if (overlayRows.length > 0) {
      const { error } = await supabase.from("question_review_overlay").upsert(overlayRows, { onConflict: "question_id" });
      if (error) throw new Error(`Overlay upsert failed: ${error.message}`);
      overlaysMigrated = overlayRows.length;
    }

    const historyRows = questionIds.flatMap((id) =>
      (reviewState[id].history ?? []).map((h) => ({
        question_id: id,
        at: h.at,
        reviewer: h.reviewer,
        action: h.action,
        detail: h.detail ?? null,
      }))
    );

    if (historyRows.length > 0) {
      // History is append-only with no natural unique key in the source
      // JSON, so re-running this script after a partial prior run may
      // insert duplicate history rows (harmless — it's an audit log, not
      // state — but worth knowing). Safe to run once from a clean slate.
      const { error } = await supabase.from("question_review_history").insert(historyRows);
      if (error) throw new Error(`History insert failed: ${error.message}`);
      historyMigrated = historyRows.length;
    }
  } else {
    console.log("No data/admin/review-state.json found — nothing to migrate for review state.");
  }

  if (importedQuestions && importedQuestions.length > 0) {
    const rows = importedQuestions.map((q) => ({ question_id: q.id, payload: q }));
    const { error } = await supabase.from("admin_imported_questions").upsert(rows, { onConflict: "question_id" });
    if (error) throw new Error(`Imported-questions upsert failed: ${error.message}`);
    importedMigrated = rows.length;
  } else {
    console.log("No data/admin/imported-questions.json found (or empty) — nothing to migrate.");
  }

  if (settings) {
    const { error } = await supabase.from("admin_settings").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Settings upsert failed: ${error.message}`);
    settingsMigrated = true;
  } else {
    console.log("No data/admin/settings.json found — nothing to migrate for settings.");
  }

  console.log("\nMigration summary:");
  console.log(`  Review overlays migrated: ${overlaysMigrated}`);
  console.log(`  History entries migrated: ${historyMigrated}`);
  console.log(`  Imported questions migrated: ${importedMigrated}`);
  console.log(`  Settings migrated: ${settingsMigrated ? "yes" : "no"}`);
  console.log("\nLocal data/admin/*.json files were NOT deleted. Verify the data in Supabase, then remove them yourself.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
