import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
};

/**
 * Mission 7 Part 15. This is a project policy DRAFT, not a legally
 * reviewed document — CLAUDE.md: "Do not make legal claims that the
 * implementation does not support." It describes what the app actually
 * does today (verified against lib/liveBattleRoom.ts, lib/analytics.ts,
 * lib/errorReporting.ts), not aspirational claims. Have this reviewed by
 * a lawyer before treating it as a real privacy policy.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Draft — project policy, not reviewed by a lawyer. Do not treat this as legal advice or a binding privacy
        policy until it has had legal review.
      </div>

      <h1 className="mt-8 text-3xl font-bold">Privacy Policy (Draft)</h1>
      <p className="mt-2 text-sm text-[#a7aebd]">Last updated: see RELEASE_CHECKLIST.md in the project repository.</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <h2 className="text-lg font-semibold text-[#f3efe2]">What we store</h2>
        <p>
          Solo-play progress (XP, coins, achievements, daily rewards) is stored in your browser&apos;s local storage and
          never leaves your device unless you play a Live Battle. Live Battle uses Supabase anonymous authentication
          — you get a random player ID and the display name you type in; we do not collect email addresses, real
          names, or any other identifying information to play.
        </p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Live Battle data</h2>
        <p>
          When you join or host a Live Battle room, your chosen display name, your answers, and your score are
          stored in our Supabase database so other players in the same room can see them during the game. This data
          is used only to run the game.
        </p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Analytics</h2>
        <p>
          Analytics are off by default. If enabled in a given deployment, only coarse, non-identifying event names
          and properties are recorded (e.g. &ldquo;level 3 completed&rdquo;) — never player names, room codes, or answer
          content. See lib/analytics.ts in the project repository for exactly what is and isn&apos;t sent.
        </p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Error reporting</h2>
        <p>
          If an unexpected error occurs, technical details (not your answers or personal information) may be logged
          to help fix the bug. No external error-reporting service is connected in this deployment unless
          explicitly configured — see lib/errorReporting.ts.
        </p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Contact</h2>
        <p>Questions about this policy should go through the project&apos;s support channel — see /support.</p>
      </section>
    </main>
  );
}
