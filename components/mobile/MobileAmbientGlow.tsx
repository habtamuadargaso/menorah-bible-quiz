"use client";

// Mission 17.5 — shared background-depth layer for mobile-only screens
// (home dashboard, campaign journey, level complete). A subtle radial gold
// glow near the top and a subtle violet glow lower down, both blurred and
// low-opacity, sitting behind the real content (z-0, pointer-events-none,
// aria-hidden) so it reads as depth rather than a bright gradient. Static
// (no animation) — this renders behind scrollable content on every visit,
// so it stays cheap and never competes for attention with the real
// micro-animations elsewhere.
export default function MobileAmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-purple-500/[0.06] blur-3xl" />
    </div>
  );
}
