"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Empty-state panel shown while the lobby is waiting for more players:
// a friendly illustration, the room code, and copy/share actions.
export default function InvitePanel({
  roomCode,
  heading,
  body,
  shareHint,
  copyLabel,
  copiedLabel,
  shareLabel,
}: {
  roomCode: string;
  heading: string;
  body: string;
  shareHint: string;
  copyLabel: string;
  copiedLabel: string;
  shareLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to do
    }
  }

  async function handleShare() {
    const shareText = `Join my Bible Battle room! Code: ${roomCode}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
      await handleCopy();
    } catch {
      // user cancelled the native share sheet
    }
  }

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
      className="rounded-card border border-gold-500/20 bg-glass-gold p-7 text-center shadow-premium"
    >
      <motion.div
        aria-hidden
        animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={reduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-3xl"
      >
        🕯️
      </motion.div>
      <div className="mt-3 font-display text-lg font-bold text-[#fbf6e8]">{heading}</div>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#a7aebd]">{body}</p>

      <p className="mt-5 text-xs uppercase tracking-wide text-[#9aa1b0]">{shareHint}</p>
      <div className="mx-auto mt-2 inline-flex rounded-2xl border border-gold-500/50 bg-gold-500/10 px-8 py-3 font-display text-3xl font-black tracking-[0.3em] text-gold-300">
        {roomCode}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={handleCopy}
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="rounded-full border border-gold-500/45 px-5 py-2.5 text-sm font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {copied ? `✓ ${copiedLabel}` : `📋 ${copyLabel}`}
        </motion.button>
        <motion.button
          type="button"
          onClick={handleShare}
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="rounded-full border border-purple-400/45 px-5 py-2.5 text-sm font-bold text-purple-200 outline-none transition-colors hover:bg-purple-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          📤 {shareLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
