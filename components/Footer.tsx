"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-center">
      <div className="mx-auto max-w-lg text-xs leading-relaxed text-[#7c8394]">{t.footer.verse}</div>
      <div className="mt-4 text-xs text-[#5c6272]">{t.footer.tagline}</div>
      <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#5c6272]">
        <Link href="/about" className="underline decoration-dotted underline-offset-2 hover:text-[#a7aebd]">
          About
        </Link>
        <Link href="/privacy" className="underline decoration-dotted underline-offset-2 hover:text-[#a7aebd]">
          Privacy
        </Link>
        <Link href="/terms" className="underline decoration-dotted underline-offset-2 hover:text-[#a7aebd]">
          Terms
        </Link>
        <Link href="/support" className="underline decoration-dotted underline-offset-2 hover:text-[#a7aebd]">
          Support
        </Link>
      </nav>
    </footer>
  );
}
