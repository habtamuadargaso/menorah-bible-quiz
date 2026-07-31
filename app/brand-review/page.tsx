import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Brand Review",
  description: "Temporary comparison page for proposed Menorah Bible Quiz header treatments.",
  robots: { index: false, follow: false },
};

type Treatment = "cinematic" | "vector" | "hybrid";

const treatments: Array<{
  id: Treatment;
  option: string;
  name: string;
  summary: string;
}> = [
  {
    id: "cinematic",
    option: "A",
    name: "Refined cinematic branding",
    summary: "Layered warm-gold mark, cream Bible, restrained glow, and dimensional framing that echoes the Home hero.",
  },
  {
    id: "vector",
    option: "B",
    name: "Clean premium vector branding",
    summary: "High-contrast geometry with broad strokes and a strong open-Bible base for dependable small-size clarity.",
  },
  {
    id: "hybrid",
    option: "C",
    name: "Hybrid branding",
    summary: "The simplest heavy symbol paired with larger premium typography and a subtle gold rule for authority.",
  },
];

const symbolSizes = [16, 32, 48, 64, 128, 256, 1024];

function Flame({ x, y, compact = false }: { x: number; y: number; compact?: boolean }) {
  const width = compact ? 8 : 10;
  const height = compact ? 13 : 16;
  return (
    <path
      d={`M ${x} ${y + height} C ${x - width} ${y + height - 4}, ${x - width + 1} ${y + 4}, ${x} ${y} C ${x + width - 1} ${y + 4}, ${x + width} ${y + height - 4}, ${x} ${y + height} Z`}
      fill="#ffd978"
    />
  );
}

function BrandSymbol({ treatment, className = "" }: { treatment: Treatment; className?: string }) {
  if (treatment === "cinematic") {
    return (
      <svg viewBox="0 0 256 256" role="img" aria-label="Seven-branched Menorah rising from an open Bible" className={className}>
        <circle cx="128" cy="126" r="103" fill="#07162e" stroke="#8b6721" strokeWidth="5" />
        <circle cx="128" cy="120" r="85" fill="none" stroke="#d9a93b" strokeOpacity=".22" strokeWidth="8" />
        <g fill="none" stroke="#e3b73f" strokeLinecap="round" strokeLinejoin="round">
          <path d="M128 43v126" strokeWidth="15" />
          <path d="M99 58v45c0 34 12 54 29 62" strokeWidth="13" />
          <path d="M157 58v45c0 34-12 54-29 62" strokeWidth="13" />
          <path d="M71 77v30c0 45 22 67 57 67" strokeWidth="13" />
          <path d="M185 77v30c0 45-22 67-57 67" strokeWidth="13" />
          <path d="M46 99v16c0 43 30 69 82 69" strokeWidth="13" />
          <path d="M210 99v16c0 43-30 69-82 69" strokeWidth="13" />
        </g>
        <g>
          <Flame x={46} y={83} /><Flame x={71} y={61} /><Flame x={99} y={42} />
          <Flame x={128} y={26} /><Flame x={157} y={42} /><Flame x={185} y={61} /><Flame x={210} y={83} />
        </g>
        <path d="M128 184c-24-13-52-15-84-8v42c32-7 60-4 84 10Z" fill="#fbf2d6" stroke="#c99a2e" strokeWidth="5" strokeLinejoin="round" />
        <path d="M128 184c24-13 52-15 84-8v42c-32-7-60-4-84 10Z" fill="#fbf2d6" stroke="#c99a2e" strokeWidth="5" strokeLinejoin="round" />
        <path d="M128 184v44" stroke="#c99a2e" strokeWidth="5" />
        <path d="M59 193c22-3 41-1 57 5M197 193c-22-3-41-1-57 5" fill="none" stroke="#c7ad67" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (treatment === "vector") {
    return (
      <svg viewBox="0 0 256 256" role="img" aria-label="Seven-branched Menorah rising from an open Bible" className={className}>
        <g fill="none" stroke="#dcb233" strokeLinecap="round" strokeLinejoin="round">
          <path d="M128 40v137" strokeWidth="17" />
          <path d="M97 57v49c0 36 13 58 31 66M159 57v49c0 36-13 58-31 66" strokeWidth="15" />
          <path d="M67 77v36c0 42 23 66 61 66M189 77v36c0 42-23 66-61 66" strokeWidth="15" />
          <path d="M39 99v19c0 43 32 69 89 69M217 99v19c0 43-32 69-89 69" strokeWidth="15" />
        </g>
        <g>
          <Flame x={39} y={79} /><Flame x={67} y={57} /><Flame x={97} y={37} />
          <Flame x={128} y={18} /><Flame x={159} y={37} /><Flame x={189} y={57} /><Flame x={217} y={79} />
        </g>
        <path d="M128 183c-27-14-59-17-96-8l7 48c34-8 64-4 89 11Z" fill="#f7edcf" stroke="#dcb233" strokeWidth="7" strokeLinejoin="round" />
        <path d="M128 183c27-14 59-17 96-8l-7 48c-34-8-64-4-89 11Z" fill="#f7edcf" stroke="#dcb233" strokeWidth="7" strokeLinejoin="round" />
        <path d="M128 185v48" stroke="#dcb233" strokeWidth="7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 256 256" role="img" aria-label="Simplified seven-branched Menorah and open Bible" className={className}>
      <path d="M128 35v142M96 54v55c0 38 13 60 32 66M160 54v55c0 38-13 60-32 66M63 78v35c0 44 24 68 65 68M193 78v35c0 44-24 68-65 68M32 104v16c0 44 35 69 96 69M224 104v16c0 44-35 69-96 69" fill="none" stroke="#e4b83c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <g>
        <Flame x={32} y={82} compact /><Flame x={63} y={56} compact /><Flame x={96} y={32} compact />
        <Flame x={128} y={10} compact /><Flame x={160} y={32} compact /><Flame x={193} y={56} compact /><Flame x={224} y={82} compact />
      </g>
      <path d="M128 188c-29-12-64-13-104-2l9 47c36-10 68-6 95 10Z" fill="#f8efd6" />
      <path d="M128 188c29-12 64-13 104-2l-9 47c-36-10-68-6-95 10Z" fill="#f8efd6" />
      <path d="M128 189v53" stroke="#b88824" strokeWidth="8" />
    </svg>
  );
}

function Wordmark({ treatment, mobile = false }: { treatment: Treatment; mobile?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center ${mobile ? "gap-2" : "gap-3"}`}>
      <BrandSymbol
        treatment={treatment}
        className={`${mobile ? "h-9 w-9" : treatment === "cinematic" ? "h-12 w-12" : "h-11 w-11"} flex-none ${treatment === "cinematic" ? "drop-shadow-[0_0_12px_rgba(232,193,95,0.48)]" : ""}`}
      />
      <div className="min-w-0">
        <div className={`${mobile ? "text-[15px]" : "text-xl"} truncate font-display font-bold leading-none tracking-[0.015em] text-[#fbf6e8]`}>
          Menorah <span className="text-[#e8c15f]">Bible Quiz</span>
        </div>
        {treatment === "cinematic" && !mobile && <div className="mt-1 h-px w-full bg-gradient-to-r from-[#e8c15f]/80 to-transparent" />}
        {treatment === "hybrid" && !mobile && <div className="mt-1.5 h-[2px] w-20 rounded-full bg-[#e8c15f]" />}
      </div>
    </div>
  );
}

function RoundControl({ children }: { children: ReactNode }) {
  return <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[#e8c15f]/30 bg-[#e8c15f]/5 text-sm font-bold text-[#e8c15f]">{children}</span>;
}

function DesktopHeader({ treatment }: { treatment: Treatment }) {
  return (
    <div className="min-w-[900px] border-b border-[#e8c15f]/20 bg-[#080d22]/95 px-6 py-3 shadow-[0_12px_40px_rgba(0,0,0,.3)]">
      <div className="flex items-center justify-between gap-6">
        <Wordmark treatment={treatment} />
        <div className="flex items-center gap-3">
          <nav className="mr-2 flex items-center gap-4 text-xs font-semibold text-[#c6cbd6]">
            <span className="text-[#e8c15f]">Home</span><span>Play</span><span>Bible</span><span>Church</span><span>Rankings</span>
          </nav>
          <span className="rounded-full border border-[#e8c15f]/30 px-3 py-1.5 text-xs font-bold text-[#e8c15f]">Level 12</span>
          <RoundControl>•••</RoundControl><RoundControl>⚙</RoundControl><RoundControl>H</RoundControl>
        </div>
      </div>
    </div>
  );
}

function MobileHeader({ treatment }: { treatment: Treatment }) {
  return (
    <div className="mx-auto w-[390px] max-w-full border-b border-[#e8c15f]/20 bg-[#080d22]/95 px-3 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,.3)]">
      <div className="flex items-center justify-between gap-2">
        <Wordmark treatment={treatment} mobile />
        <div className="flex flex-none items-center gap-1.5">
          <span className="rounded-full border border-[#e8c15f]/30 px-2 py-1 text-[10px] font-bold text-[#e8c15f]">Lv 12</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8c15f]/30 text-[#e8c15f]">⋮</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8c15f]/15 text-xs font-bold text-[#e8c15f]">H</span>
        </div>
      </div>
    </div>
  );
}

export default function BrandReviewPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050a18] text-[#f7f0dc]">
      <section className="relative overflow-hidden border-b border-[#e8c15f]/20 px-5 py-16 sm:px-8">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #8b5cf6 0, transparent 38%), radial-gradient(circle at 75% 20%, #e8c15f 0, transparent 28%)" }} />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#e8c15f]">Mission 25B · temporary review</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-5xl">A stronger identity for the Home header</h1>
          <p className="mt-4 max-w-3xl leading-7 text-[#b9c0cf]">Three review-only directions built around a seven-branched Menorah, an open Bible, warm gold, cream, and deep navy. No production asset or native icon is changed by this page.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8">
        {treatments.map((treatment) => (
          <section key={treatment.id} aria-labelledby={`${treatment.id}-heading`}>
            <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
              <div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8c15f]/35 bg-[#e8c15f]/10 font-display text-lg font-bold text-[#e8c15f]">{treatment.option}</span>
                <h2 id={`${treatment.id}-heading`} className="mt-4 font-display text-2xl font-bold">{treatment.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#9fa7b8]">{treatment.summary}</p>
              </div>

              <div className="space-y-6">
                <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1630] shadow-[0_24px_80px_rgba(0,0,0,.35)]">
                  <div className="border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#9fa7b8]">Desktop header · 72px overall</div>
                  <div className="overflow-x-auto"><DesktopHeader treatment={treatment.id} /></div>
                </article>

                <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1630] shadow-[0_24px_80px_rgba(0,0,0,.35)]">
                  <div className="border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#9fa7b8]">Mobile header · compact treatment</div>
                  <div className="p-5"><MobileHeader treatment={treatment.id} /></div>
                </article>

                <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1630]">
                  <div className="border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#9fa7b8]">Symbol scale test</div>
                  <div className="flex items-end gap-7 overflow-x-auto p-6">
                    {symbolSizes.map((size) => (
                      <div key={size} className="flex flex-none flex-col items-center gap-3">
                        <div className="flex items-center justify-center rounded-2xl border border-[#e8c15f]/15 bg-[#07162e] p-2" style={{ width: Math.max(size + 16, 48), height: Math.max(size + 16, 48) }}>
                          <BrandSymbol treatment={treatment.id} className={`h-full w-full ${treatment.id === "cinematic" ? "drop-shadow-[0_0_12px_rgba(232,193,95,.42)]" : ""}`} />
                        </div>
                        <span className="text-xs font-semibold text-[#9fa7b8]">{size}px</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
