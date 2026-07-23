"use client";

import { useEffect, type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { applyPreferenceClasses } from "@/lib/preferences";

export default function Providers({ children }: { children: ReactNode }) {
  // Mission 6: applies any saved reduced-motion/high-contrast preference
  // (lib/preferences.ts) once on mount — client-only, so the
  // server-rendered HTML never mismatches the first client render.
  useEffect(() => {
    applyPreferenceClasses();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
