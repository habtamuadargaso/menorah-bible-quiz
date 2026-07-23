"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/errorReporting";

/**
 * Mission 7 Part 11: last-resort fallback when the root layout itself
 * throws (app/error.tsx can't catch that — it renders inside the layout).
 * Replaces the entire document, so it renders its own <html>/<body> and
 * avoids depending on globals.css / Tailwind in case those are exactly
 * what failed to load.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#080d22", color: "#f3efe2", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.8 }}>
              Menorah Bible Quiz hit an unexpected error loading the page. Please reload.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                borderRadius: 999,
                background: "#e8c15f",
                color: "#080d22",
                fontWeight: 700,
                padding: "0.75rem 1.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
