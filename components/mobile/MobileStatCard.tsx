"use client";

import type { ReactNode } from "react";

// Mission 15 — compact stat pill used on the mobile home dashboard's stat
// row and reused as-is on the mobile /profile stat grid. Values are always
// passed in from real data already computed by the caller (lib/progress.ts,
// lib/profileStats.ts) — never fabricated here.
export default function MobileStatCard({
  icon,
  value,
  label,
  tone = "gold",
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone?: "gold" | "neutral";
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 rounded-card-sm border px-3 py-3 text-center ${
        tone === "gold" ? "border-gold-500/25 bg-glass-gold" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <span className="text-lg leading-none" aria-hidden>
        {icon}
      </span>
      <span className="font-display text-lg font-bold text-[#fbf6e8]">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b0]">{label}</span>
    </div>
  );
}
