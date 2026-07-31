import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  robots: { index: false, follow: false },
};

/**
 * Mission 24. Verified against the implementation — see the same caveat
 * in app/privacy/page.tsx. Not a substitute for legal review.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-[#f3efe2]">
      <h1 className="text-3xl font-bold">Terms of Use</h1>
      <p className="mt-2 text-sm text-[#a7aebd]">Last updated: see RELEASE_CHECKLIST.md in the project repository.</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#c6cbd6]">
        <h2 className="text-lg font-semibold text-[#f3efe2]">Purpose</h2>
        <p>
          Menorah Bible Quiz is a Bible-learning game for individuals, families, churches, and live competitions.
          It&apos;s provided for educational and recreational use.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Acceptable use</h2>
        <p>
          Don&apos;t use automated tools to abuse the service — for example, flooding room creation, scripted mass
          joining of Live Battle rooms, or hammering the AI question generator. Don&apos;t attempt to access another
          player&apos;s data or another room&apos;s answers outside of normal gameplay.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Multiplayer conduct &amp; display names</h2>
        <p>
          Live Battle and Friends Battle let you choose a display name visible to other players in your room. Don&apos;t
          use a display name that is abusive, impersonates someone else, or is otherwise inappropriate for a game
          used by families, churches, and young people. This is currently the only content you can share with other
          players — there is no chat or free-text messaging feature in the app.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">AI-generated Bible questions</h2>
        <p>
          Some questions are drafted with AI assistance, but none reach players until a human administrator reviews
          and explicitly approves them (see our <a className="underline" href="/privacy">Privacy Policy</a>). Even so,
          quiz content — AI-assisted or not — should not be treated as a final theological authority. Always refer to
          Scripture itself for study and doctrine.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Suspension &amp; enforcement</h2>
        <p>
          We reserve the right to restrict, suspend, or remove access to Live Battle rooms or player data associated
          with an anonymous player ID found to violate these terms. Because accounts here are anonymous by design,
          enforcement is applied at the level of a room or a specific anonymous player ID, not a real-world identity.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Intellectual property</h2>
        <p>
          The Menorah Bible Quiz name, app design, and code are owned by its operator. Quoted Bible text is drawn
          from a public-domain translation; if you plan to redistribute this app commercially, verify and attribute
          the specific translation used before doing so.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Disclaimer</h2>
        <p>
          This app is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranty of any kind, express or
          implied, including but not limited to warranties of accuracy, merchantability, or fitness for a particular
          purpose. We do not guarantee the service will be uninterrupted, error-free, or available at all times.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, the operator of Menorah Bible Quiz is not liable for any indirect,
          incidental, or consequential damages arising from your use of the app, including loss of local progress
          data, service interruptions, or Live Battle connectivity issues.
        </p>

        <h2 className="text-lg font-semibold text-[#f3efe2]">Contact</h2>
        <p>Questions about these terms should go through our <a className="underline" href="/support">Support</a> page.</p>
      </section>
    </main>
  );
}
