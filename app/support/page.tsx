import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <h1 className="text-3xl font-bold">Support</h1>
      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <p>Running into a problem, or have a question about a Bible reference in a quiz question? We&apos;d like to hear from you.</p>
        <div className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5">
          <p className="font-semibold text-[#f3efe2]">Contact</p>
          <p className="mt-1 text-[#c6cbd6]">Email the Menorah Bible Quiz support team:</p>
          <a className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center rounded-full border border-gold-500/40 bg-navy-950/40 px-5 py-2 font-semibold text-gold-300 underline decoration-dotted underline-offset-4 outline-none hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300" href="mailto:support@menorahbiblequiz.com">support@menorahbiblequiz.com</a>
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
            notifications — see our <a className="inline-flex min-h-[44px] items-center underline" href="/privacy">Privacy Policy</a>.
          </li>
        </ul>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Response expectations</h2>
        <p>Include your device, app version, and steps to reproduce the issue so the support team can investigate efficiently.</p>
      </section>
    </main>
  );
}
