"use client";

import type { ReactNode } from "react";

// Mission 15 — plain heading + optional "see all" action wrapper used to
// group card rows on the mobile home dashboard. Holds no data of its own.
export default function MobileSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-gold-400">{title}</h2>
        {action && (
          <button
            onClick={action.onClick}
            className="min-h-[32px] rounded-full px-2 text-xs font-semibold text-[#9aa1b0] outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {action.label}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
