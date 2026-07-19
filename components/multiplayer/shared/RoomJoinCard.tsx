"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import RoomQrCode from "./RoomQrCode";

export default function RoomJoinCard({
  roomCode,
  joinUrl,
  roomCodeLabel,
  joinUrlLabel,
  qrHeading,
  qrHint,
  copyLabel,
  copiedLabel,
  shareLabel,
}: {
  roomCode: string;
  joinUrl: string;
  roomCodeLabel: string;
  joinUrlLabel: string;
  qrHeading: string;
  qrHint: string;
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
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: `Join my Bible Battle room! Code: ${roomCode}`, url: joinUrl });
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
      className="grid gap-6 rounded-card border border-gold-500/20 bg-glass-gold p-6 shadow-premium sm:grid-cols-[auto,1fr] sm:p-8"
    >
      <div className="flex flex-col items-center gap-2">
        <RoomQrCode url={joinUrl} />
        <p className="max-w-[168px] text-center text-[11px] leading-snug text-[#a7aebd]">{qrHint}</p>
      </div>

      <div className="flex flex-col justify-center text-center sm:text-left">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{qrHeading}</span>
        <p className="mt-2 text-[11px] uppercase tracking-wide text-[#8d94a3]">{roomCodeLabel}</p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`${copyLabel}: ${roomCode}`}
          className="mx-auto mt-1 flex w-fit items-center gap-3 rounded-2xl border border-gold-500/50 bg-gold-500/10 px-6 py-3 outline-none transition-colors hover:bg-gold-500/15 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 sm:mx-0"
        >
          <span className="font-display text-3xl font-black tracking-[0.35em] text-gold-300">{roomCode}</span>
          <span aria-hidden>{copied ? "✓" : "📋"}</span>
        </button>

        <p className="mt-3 text-[11px] uppercase tracking-wide text-[#8d94a3]">{joinUrlLabel}</p>
        <p className="truncate text-sm text-[#c6cbd6]">{joinUrl}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-gold-500/45 px-4 py-2 text-xs font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {copied ? `✓ ${copiedLabel}` : `📋 ${copyLabel}`}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-purple-400/45 px-4 py-2 text-xs font-bold text-purple-200 outline-none transition-colors hover:bg-purple-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            📤 {shareLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
