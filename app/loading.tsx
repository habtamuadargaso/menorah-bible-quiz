// Mission 15 — Next.js App Router shows this automatically while the
// initial route segment loads, closing the "no branded splash on web/PWA"
// gap (Capacitor's native splash is already branded and already hides on
// hydration, not on a timer — see components/mobile/NativeAppBootstrap.tsx).
// No artificial delay: this simply IS the loading state, gone the instant
// the real page is ready.
export default function Loading() {
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <svg viewBox="0 0 24 24" className="h-12 w-12 animate-glowPulse">
        <path
          d="M12 2v9M12 11c-2.5 0-4-1.6-4-4M12 11c2.5 0 4-1.6 4-4M12 11c-4 0-7 1.4-7 5v5h14v-5c0-3.6-3-5-7-5Z"
          stroke="#e8c15f"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="8" cy="6.4" r="1" fill="#e8c15f" />
        <circle cx="12" cy="4.6" r="1" fill="#e8c15f" />
        <circle cx="16" cy="6.4" r="1" fill="#e8c15f" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-wide text-[#f7f0dc]">
        Menorah <span className="text-gold-500">Bible Quiz</span>
      </span>
      <span className="text-xs uppercase tracking-[0.3em] text-[#8d94a3]">Study the Word Together</span>
    </div>
  );
}
