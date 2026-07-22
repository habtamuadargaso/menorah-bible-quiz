import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

/**
 * Mission 7 Part 15. Placeholder support page — wire the email/contact
 * link below to a real inbox before launch; it's intentionally not
 * invented here.
 */
export default function SupportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <h1 className="text-3xl font-bold">Support</h1>
      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <p>Running into a problem, or have a question about a Bible reference in a quiz question? We&apos;d like to hear from you.</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="font-semibold text-[#f3efe2]">Contact</p>
          <p className="mt-1 text-[#a7aebd]">
            Add a real support email or contact form here before launch — none is configured in this codebase yet.
          </p>
        </div>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Common questions</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Live Battle requires an internet connection; Friends Battle (pass-and-play) works fully offline.</li>
          <li>
            If a language shows an &ldquo;unavailable&rdquo; message instead of a question, that language&apos;s content simply
            isn&apos;t translated yet for that level — the app never silently substitutes English.
          </li>
        </ul>
      </section>
    </main>
  );
}
