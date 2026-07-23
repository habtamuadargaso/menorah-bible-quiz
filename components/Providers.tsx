"use client";

import { useEffect, type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { applyPreferenceClasses } from "@/lib/preferences";
import NativeAppBootstrap from "@/components/mobile/NativeAppBootstrap";

export default function Providers({ children }: { children: ReactNode }) {
  // Mission 6: applies any saved reduced-motion/high-contrast preference
  // (lib/preferences.ts) once on mount — client-only, so the
  // server-rendered HTML never mismatches the first client render.
  useEffect(() => {
    applyPreferenceClasses();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        {/* Mission 12: no-op on the website, wires up the native shell
            (status bar, splash screen, back button, deep links) when this
            same app is running inside Capacitor — see the component's own
            doc comment. */}
        <NativeAppBootstrap />
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}
