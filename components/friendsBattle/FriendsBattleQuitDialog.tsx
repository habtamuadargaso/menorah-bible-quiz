"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function FriendsBattleQuitDialog({
  open,
  onContinue,
  onQuit,
}: {
  open: boolean;
  onContinue: () => void;
  onQuit: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const continueRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    continueRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onContinue();
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onContinue]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/80 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onContinue();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="friends-battle-quit-title"
            aria-describedby="friends-battle-quit-description"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="w-full max-w-sm rounded-card border border-gold-500/25 bg-[#11162f] p-6 text-[#f3efe2] shadow-premium"
          >
            <h2 id="friends-battle-quit-title" className="font-display text-2xl font-bold text-[#fbf6e8]">
              Quit Friends Battle?
            </h2>
            <p id="friends-battle-quit-description" className="mt-3 text-sm leading-6 text-[#b5bbc8]">
              Your current match will be discarded.<br />No XP or progress will be saved.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                ref={continueRef}
                type="button"
                onClick={onContinue}
                className="min-h-11 rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-[#e5e1d7] outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11162f]"
              >
                Continue Playing
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="min-h-11 rounded-full border border-red-400/35 bg-red-500/15 px-5 py-2.5 text-sm font-bold text-red-200 outline-none transition-colors hover:bg-red-500/25 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11162f]"
              >
                Quit Match
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
