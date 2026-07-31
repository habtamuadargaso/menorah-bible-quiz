import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

/**
 * Mission 24. The contact channel below is a real, required gap — this
 * codebase has no support email or form wired up anywhere, and one must
 * not be invented (CLAUDE.md: no fabricated contact information). Whoever
 * owns this deployment must supply a real, monitored email address (or
 * contact form) here before App Store / Play Store submission; both
 * stores require a working support URL. See Mission 24's compliance
 * report for the exact wording to replace once that address exists.
 */
export default function SupportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <h1 className="text-3xl font-bold">Support</h1>
      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <p>Running into a problem, or have a question about a Bible reference in a quiz question? We&apos;d like to hear from you.</p>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
          <p className="font-semibold text-[#f3efe2]">Contact</p>
          <p className="mt-1 text-amber-200">
            A support contact for this app has not been configured yet. The app&apos;s owner needs to add a real,
            monitored email address or contact form here before this app can be submitted to the App Store or
            Google Play — both require a working support channel.
          </p>
        </div>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Common questions</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Live Battle requires an internet connection; Friends Battle (pass-and-play) works fully offline.</li>
          <li>
            If a language shows an &ldquo;unavailable&rdquo; message instead of a question, that language&apos;s content simply
            isn&apos;t translated yet for that level — the app never silently substitutes English.
          </li>
          <li>
            Solo Play progress (XP, coins, achievements) lives in your browser or device&apos;s local storage. Clearing
            your browser data or uninstalling the app will erase it — there is currently no account-based cloud
            backup for it.
          </li>
          <li>
            The onboarding &ldquo;daily reminder&rdquo; choice is saved, but the app does not yet send any push or local
            notifications — see our <a className="underline" href="/privacy">Privacy Policy</a>.
          </li>
        </ul>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Response expectations</h2>
        <p className="text-amber-200">
          Not yet defined — depends on the real support channel above once it exists.
        </p>
      </section>
    </main>
  );
}
