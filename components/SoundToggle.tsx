"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { isSoundEnabled, setSoundEnabled, startGameMusic, stopGameMusic } from "@/lib/sound";

export default function SoundToggle() {
  const { t } = useLanguage();
  const [on, setOn] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOn(isSoundEnabled());
    setMounted(true);
  }, []);

  function toggleSound() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
  }

  useEffect(() => {
    if (!mounted) return;
    if (on) startGameMusic();
    else stopGameMusic();
  }, [on, mounted]);

  return (
    <button
      onClick={toggleSound}
      aria-label={on ? t.sound.on : t.sound.off}
      title={on ? t.sound.on : t.sound.off}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/30 text-gold-400 transition-colors hover:border-gold-500/60"
    >
      {on ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a3.5 3.5 0 0 0-2-3.16v6.32A3.5 3.5 0 0 0 16.5 12Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path d="M4 9v6h4l5 4V5L8 9H4Zm12 1 4 4m0-4-4 4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </svg>
      )}
    </button>
  );
}
