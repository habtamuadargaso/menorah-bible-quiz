"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-center">
      {/* Mission 25A brand system — see public/branding/ */}
      <img src="/branding/logo-symbol.svg" alt="Menorah Bible Quiz" className="mx-auto mb-4 h-9 w-9 opacity-90" />
      <div className="mx-auto max-w-lg text-xs leading-relaxed text-[#7c8394]">{t.footer.verse}</div>
      <div className="mt-4 text-xs text-[#5c6272]">{t.footer.tagline}</div>
      <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm text-[#a7aebd]">
        {/* Mission 27 — #a7aebd is an existing site color (was previously
            only the hover state) at 8.65:1 contrast against the navy-950
            footer background, replacing the prior #5c6272 default which
            measured 3.16:1 (fails WCAG AA's 4.5:1 for text this size).
            px-2 py-2.5 brings each link's interactive box to a full
            24x24+ CSS-pixel target (WCAG 2.5.8) and close to the
            44px-tall comfortable-tap guideline on mobile, without
            changing the footer's compact visual density. */}
        <Link
          href="/about"
          className="rounded px-2 py-2.5 underline decoration-dotted underline-offset-2 outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          About
        </Link>
        <Link
          href="/privacy"
          className="rounded px-2 py-2.5 underline decoration-dotted underline-offset-2 outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="rounded px-2 py-2.5 underline decoration-dotted underline-offset-2 outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          Terms
        </Link>
        <Link
          href="/support"
          className="rounded px-2 py-2.5 underline decoration-dotted underline-offset-2 outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          Support
        </Link>
      </nav>
    </footer>
  );
}
