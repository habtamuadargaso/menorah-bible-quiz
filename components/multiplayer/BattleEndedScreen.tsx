"use client";

import { LogOut, OctagonX } from "lucide-react";

export default function BattleEndedScreen({ onLeave }: { onLeave: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(165deg,#080d22_0%,#171034_45%,#080d22_100%)] px-4 py-12 text-center text-[#f3efe2]">
      <section className="w-full max-w-lg rounded-[28px] border border-red-300/20 bg-white/[0.05] p-7 shadow-2xl sm:p-10" aria-labelledby="battle-ended-title">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-400/10 text-red-200">
          <OctagonX className="size-8" aria-hidden="true" />
        </div>
        <h1 id="battle-ended-title" className="mt-5 font-display text-3xl font-bold sm:text-4xl">Battle Ended</h1>
        <p className="mt-3 text-base leading-7 text-[#c6cbd6]">The host ended this battle.</p>
        <button type="button" onClick={onLeave} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-6 font-bold text-navy-950 outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950">
          <LogOut className="size-5" aria-hidden="true" /> Back to Home
        </button>
      </section>
    </main>
  );
}
