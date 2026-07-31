"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Swords, Trophy, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { hapticLight } from "@/lib/mobile/haptics";

type MobileNavKey = "home" | "learn" | "battle" | "leaderboard" | "profile";

const TABS: Array<{ key: MobileNavKey; href: string; icon: typeof Home }> = [
  { key: "home", href: "/", icon: Home },
  { key: "learn", href: "/learn", icon: BookOpen },
  { key: "battle", href: "/multiplayer", icon: Swords },
  { key: "leaderboard", href: "/leaderboard", icon: Trophy },
  { key: "profile", href: "/profile", icon: User },
];

function activeKeyFromPath(pathname: string): MobileNavKey | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/learn")) return "learn";
  if (pathname.startsWith("/multiplayer") || pathname.startsWith("/friends-battle")) return "battle";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

// Mission 15 — mobile-only bottom nav. Mounted per-route (not globally in
// layout.tsx/Providers.tsx) because immersive screens (an active quiz round,
// a live-battle question in progress) live inside single-page stage machines
// whose "current screen" isn't reflected in the URL, so only the route
// itself knows when the nav should be hidden.
export default function MobileBottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const active = activeKeyFromPath(pathname ?? "/");

  const labels: Record<MobileNavKey, string> = {
    home: t.nav.home,
    learn: t.nav.learn,
    battle: t.nav.battle,
    leaderboard: t.nav.leaderboard,
    profile: t.profile.title,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-gold-500/20 bg-navy-950/[0.97] px-1 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-12px_36px_rgba(0,0,0,0.34)] backdrop-blur-xl md:hidden">
      {TABS.map(({ key, href, icon: Icon }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href}
            onClick={hapticLight}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex min-h-[52px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
              isActive ? "text-gold-400" : "text-[#8d94a3]"
            }`}
          >
            {isActive && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gold-400 shadow-[0_2px_8px_rgba(232,193,95,0.45)]" />}
            <span className={`flex h-7 w-9 items-center justify-center rounded-full ${isActive ? "bg-gold-500/12" : ""}`}>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
            </span>
            <span>{labels[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
