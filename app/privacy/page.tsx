import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
};

/**
 * Mission 24. Describes what the app actually does today, verified
 * against the implementation (lib/liveBattleRoom.ts, lib/analytics.ts,
 * lib/errorReporting.ts, lib/mobile/onboarding.ts,
 * supabase/migrations/20260711_final_multiplayer.sql,
 * QUESTION_PUBLISHING.md) rather than aspirational claims — CLAUDE.md:
 * "Do not make legal claims that the implementation does not support."
 *
 * This is not a substitute for legal review. It is technically accurate
 * as of this mission; it has not been reviewed by a lawyer for
 * jurisdiction-specific requirements (e.g. GDPR, CCPA, COPPA) — see
 * RELEASE_CHECKLIST.md.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[#a7aebd]">Last updated: see RELEASE_CHECKLIST.md in the project repository.</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <h2 className="text-lg font-semibold text-[#f3efe2]">Playing without an account</h2>
        <p>
          Solo Play and Friends Battle (pass-and-play) require no account at all. Your progress — XP, coins,
          achievements, daily rewards, campaign progress, sound/display preferences, and the profile details you
          enter during onboarding (avatar, display name, country, church) — is stored only in your browser or
          device&apos;s local storage. It never leaves your device and we never see it, unless you start a Live
          Battle (see below).
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Live Battle: anonymous sign-in</h2>
        <p>
          Joining or hosting a Live Battle room uses Supabase anonymous authentication. You&apos;re issued a random
          player ID — we do not collect an email address, real name, phone number, or any government ID to play. The
          display name you type in for that game, your selected answers, and your score are stored in our database
          so the other players in your room can see them during and after the game, and so all-time leaderboard
          stats can be computed. This data is retained indefinitely for finished games (it powers the leaderboard);
          abandoned, never-started rooms are automatically deleted after 2 hours.
        </p>
        <p>
          Session persistence for this anonymous sign-in uses a small number of essential, functional cookies — not
          advertising or tracking cookies, and not shared with any third party.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Administrator accounts</h2>
        <p>
          Separately from players, a small number of content-review staff sign in with a real email and password to
          moderate and publish Bible question content. This is not available to players — there is no self-service
          account signup in this app today.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">AI-generated content</h2>
        <p>
          Some Bible quiz questions are drafted with AI assistance from a topic/level prompt (no player data is ever
          sent to the AI provider). Every AI-drafted question is stored as a draft and reviewed by a human
          administrator before it can be marked published — a player is never shown AI-generated content that
          hasn&apos;t been explicitly approved.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Notifications</h2>
        <p>
          During onboarding you can choose to be asked about daily reminders. Today, this only records your
          preference and, on some platforms, triggers the browser&apos;s standard notification-permission prompt — the
          app does not currently send any push or local notifications. If that changes in a future release, this
          policy will be updated first.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Analytics</h2>
        <p>
          Analytics are off by default and, in this deployment, no analytics provider is connected — collecting
          analytics is currently a complete no-op with zero network requests. If a provider is ever enabled, only
          coarse, non-identifying event names and properties would be recorded (e.g. &ldquo;level 3 completed&rdquo;) —
          never player names, room codes, or answer content. See lib/analytics.ts in the project repository for
          exactly what is and isn&apos;t sent.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Error reporting</h2>
        <p>
          If an unexpected error occurs, technical details (not your answers or personal information) are logged to
          the browser console to help fix the bug. No external error-reporting service is connected in this
          deployment.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">What we don&apos;t collect</h2>
        <p>
          We do not access your camera, microphone, or precise location, and we do not use advertising identifiers.
          Server-side request IP addresses are used only transiently, in memory, to rate-limit abusive traffic on a
          few specific endpoints — they are not written to a database or logged permanently.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Your choices</h2>
        <p>
          You can clear local storage yourself at any time through your browser or device settings to remove
          on-device progress and preferences. To request deletion of Live Battle data tied to your anonymous player
          ID, contact us through the channel on our <a className="underline" href="/support">Support</a> page.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Contact</h2>
        <p>Questions about this policy should go through our <a className="underline" href="/support">Support</a> page.</p>
      </section>
    </main>
  );
}
