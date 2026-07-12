"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-center">
      <div className="mx-auto max-w-lg text-xs leading-relaxed text-[#7c8394]">{t.footer.verse}</div>
      <div className="mt-4 text-xs text-[#5c6272]">{t.footer.tagline}</div>
    </footer>
  );
}
