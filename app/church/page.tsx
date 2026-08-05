import type { Metadata } from "next";
import Link from "next/link";
import ChurchModeSection from "@/components/ChurchModeSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Church Mode",
  alternates: { canonical: "/church" },
  description: "Host a shared-screen Bible quiz for church groups, Bible studies, and gatherings.",
};

export default function ChurchModePage() {
  return (
    <main
      id="main-content"
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <Link
          href="/"
          className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:text-gold-500 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          <span aria-hidden>←</span>
          Home
        </Link>
      </div>
      <ChurchModeSection />
      <Footer />
    </main>
  );
}
