"use client";

import type { ReactNode } from "react";
import MobileBottomNav from "./MobileBottomNav";
import MobileAmbientGlow from "./MobileAmbientGlow";

// Mission 15 — layout shell for the new mobile home dashboard only. Not a
// replacement for components/Providers.tsx (LanguageProvider/AuthProvider/
// NativeAppBootstrap stay exactly where they are in app/layout.tsx); this
// just gives new mobile-only screens a min-h-[100dvh] frame plus the bottom
// nav, with room at the bottom for the nav's own safe-area padding.
export default function MobileAppShell({
  children,
  hideBottomNav,
}: {
  children: ReactNode;
  hideBottomNav?: boolean;
}) {
  return (
    <div className={`relative flex min-h-[100dvh] w-full flex-col md:hidden ${hideBottomNav ? "" : "pb-20"}`}>
      <MobileAmbientGlow />
      <div className="relative flex-1">{children}</div>
      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
