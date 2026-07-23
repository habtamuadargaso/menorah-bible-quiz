import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  robots: { index: false, follow: false },
};

/**
 * Mission 7 Part 15. Project policy DRAFT, not legally reviewed — see the
 * same caveat in app/privacy/page.tsx.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Draft — project policy, not reviewed by a lawyer. Do not treat this as a binding legal agreement until it
        has had legal review.
      </div>

      <h1 className="mt-8 text-3xl font-bold">Terms of Use (Draft)</h1>
      <p className="mt-2 text-sm text-[#a7aebd]">Last updated: see RELEASE_CHECKLIST.md in the project repository.</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <h2 className="text-lg font-semibold text-[#f3efe2]">Purpose</h2>
        <p>
          Menorah Bible Quiz is a Bible-learning game for individuals, families, churches, and live competitions.
          It&apos;s provided as-is, for educational and recreational use.
        </p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Content accuracy</h2>
        <p>
          Questions are drawn from a canonical bank that is reviewed before being marked &ldquo;published&rdquo; (see
          QUESTION_PUBLISHING.md). Some AI-assisted content may still be in draft/review status and should not be
          treated as a final theological authority — always refer to Scripture itself.
        </p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">Fair use</h2>
        <p>Don&apos;t use automated tools to abuse the service (e.g. flooding room creation or the AI question generator).</p>
        <h2 className="text-lg font-semibold text-[#f3efe2]">No warranty</h2>
        <p>
          This app is provided without warranty of any kind. See the project repository&apos;s LICENSE (if any) for
          further terms.
        </p>
      </section>
    </main>
  );
}
