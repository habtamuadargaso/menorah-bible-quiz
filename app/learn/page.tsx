"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CategoryGrid from "@/components/CategoryGrid";
import BibleLearningSection from "@/components/BibleLearningSection";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import type { CategoryId } from "@/lib/categories";

// Mission 15 — new route giving the mobile bottom nav's "Learn" tab a real
// URL. Renders the same CategoryGrid + BibleLearningSection content already
// shown inline on "/" (no new content invented). Category selection can't
// launch the quiz here directly, because quiz-launch state (categoryId,
// gameLevel, stage) lives only in app/page.tsx's stage machine — so this
// hands off via a query param that app/page.tsx reads once on mount.
export default function LearnRoute() {
  const { t } = useLanguage();
  const router = useRouter();

  function handleSelectCategory(id: CategoryId) {
    router.push(`/?category=${id}`);
  }

  return (
    <main
      className="min-h-screen w-full pb-20 md:pb-0"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          <span aria-hidden>←</span>
          {t.nav.home}
        </Link>
      </div>

      <CategoryGrid onSelect={handleSelectCategory} />
      <BibleLearningSection />

      <MobileBottomNav />
    </main>
  );
}
