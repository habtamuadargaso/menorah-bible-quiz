"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react";
import { hapticLight } from "@/lib/mobile/haptics";

// Shared gold-outline secondary-button style (Welcome's "Skip for now",
// Reminder's "Not Now" in the approved design both render as a gold
// outline + gold text, not the neutral gray outline used elsewhere).
export const GOLD_OUTLINE_BUTTON_CLASS =
  "min-h-[48px] w-full rounded-full border border-gold-500/40 text-sm font-bold text-gold-400 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950";

/**
 * Mission 21.1 — shared chrome for every onboarding screen, redrawn to
 * match the approved mockup: a small top-left back chevron (only when a
 * previous step exists), a "{n} / 7" progress indicator + Skip, a gold
 * pill Continue button with a trailing arrow, an optional secondary
 * outlined button underneath it (Welcome's "Skip for now", matching the
 * mockup), and an optional small footer note. Every screen component only
 * renders its own middle content — this owns the consistent layout,
 * tap-target sizing, and reduced-motion handling.
 */
export default function OnboardingShell({
  step,
  totalSteps,
  progressLabel,
  skipLabel,
  backLabel,
  onSkip,
  onBack,
  onContinue,
  continueLabel,
  continueDisabled,
  hideContinue,
  hideSkip,
  showArrow = true,
  secondaryLabel,
  onSecondary,
  footerNote,
  footerNoteIcon,
  children,
}: {
  step: number;
  totalSteps: number;
  progressLabel: string;
  skipLabel: string;
  backLabel: string;
  onSkip?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel: string;
  continueDisabled?: boolean;
  hideContinue?: boolean;
  hideSkip?: boolean;
  showArrow?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerNote?: string;
  footerNoteIcon?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <div
        className="flex flex-shrink-0 items-center gap-2 px-4 pb-2"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onBack();
            }}
            aria-label={backLabel}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#9aa1b0] outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <span className="w-8 flex-shrink-0" aria-hidden />
        )}

        <div className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < step ? "bg-gold-400" : "bg-white/10"
              }`}
              aria-hidden
            />
          ))}
        </div>
        <span className="flex-shrink-0 text-xs font-semibold text-[#8d94a3]" aria-live="polite">
          {progressLabel}
        </span>
        {!hideSkip && onSkip ? (
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onSkip();
            }}
            className="min-h-[32px] flex-shrink-0 rounded-full px-2 text-xs font-semibold text-[#9aa1b0] outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {skipLabel}
          </button>
        ) : (
          <span className="w-8 flex-shrink-0" aria-hidden />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        {children}
      </div>

      {(!hideContinue && onContinue) && (
        <div
          className="flex flex-shrink-0 flex-col gap-2.5 px-5 pt-2"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <motion.button
            type="button"
            onClick={() => {
              hapticLight();
              onContinue();
            }}
            disabled={continueDisabled}
            whileTap={reduceMotion || continueDisabled ? undefined : { scale: 0.97 }}
            className="relative flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 text-sm font-bold text-navy-900 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:opacity-40"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
            <span className="relative">{continueLabel}</span>
            {showArrow && <ArrowRight className="relative h-4 w-4" aria-hidden />}
          </motion.button>

          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onSecondary();
              }}
              className={GOLD_OUTLINE_BUTTON_CLASS}
            >
              {secondaryLabel}
            </button>
          )}

          {footerNote && (
            <p className="flex items-center justify-center gap-1.5 pt-0.5 text-center text-xs text-[#7d8494]">
              {footerNoteIcon && <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-gold-400/70" aria-hidden />}
              {footerNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
