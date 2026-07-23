"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function LobbyHeader({
  eyebrow,
  heading,
  roomCode,
  copyLabel,
  copiedLabel,
  shareLabel,
}: {
  eyebrow: string;
  heading: string;
  roomCode: string;
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
    <motion.header
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
      className="text-center"
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{heading}</h1>

      <motion.button
        type="button"
        onClick={handleCopy}
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        aria-label={`${copyLabel}: ${roomCode}`}
        className="mx-auto mt-5 flex items-center gap-3 rounded-2xl border border-gold-500/50 bg-gold-500/10 px-8 py-4 outline-none transition-colors hover:bg-gold-500/15 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        <span className="font-display text-3xl font-black tracking-[0.35em] text-gold-300">{roomCode}</span>
        <span className="text-lg" aria-hidden>
          {copied ? "✓" : "📋"}
        </span>
      </motion.button>
      <p className="mt-1.5 text-xs text-[#8d94a3]">{copied ? copiedLabel : copyLabel}</p>

      <motion.button
        type="button"
        onClick={handleShare}
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/10 px-5 py-2 text-xs font-bold text-purple-200 outline-none transition-colors hover:bg-purple-500/20 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        📤 {shareLabel}
      </motion.button>
    </motion.header>
  );
}
