"use client";

import { useRouter } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

// Mission 15 — thin route wrapper mirroring app/leaderboard/page.tsx's
// pattern, giving mobile's bottom-nav Profile tab a real URL. ProfilePage
// itself is untouched (same props it already takes inside app/page.tsx's
// "profile" stage) — this route just gives it a stable address plus the
// mobile bottom nav as a sibling, without wrapping it in a shell that could
// disturb its existing desktop-safe layout.
export default function ProfileRoute() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen w-full pb-20 md:pb-0"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <ProfilePage onCategories={() => router.push("/")} onLeaderboard={() => router.push("/leaderboard")} />
      <MobileBottomNav />
    </main>
  );
}
