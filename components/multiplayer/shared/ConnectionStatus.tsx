"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ConnectionStatus = memo(function ConnectionStatus({
  state,
  connectedLabel,
  reconnectingLabel,
  disconnectedLabel,
  compact = false,
}: {
  state: "connected" | "reconnecting" | "disconnected";
  connectedLabel: string;
  reconnectingLabel: string;
  disconnectedLabel: string;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const label = state === "connected" ? connectedLabel : state === "reconnecting" ? reconnectingLabel : disconnectedLabel;
  const dotColor = state === "connected" ? "bg-emerald-400" : state === "reconnecting" ? "bg-gold-400" : "bg-red-400";
  const textColor = state === "connected" ? "text-emerald-300" : state === "reconnecting" ? "text-gold-300" : "text-red-300";

  return (
    <div
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
      } font-semibold ${textColor}`}
    >
      <motion.span
        aria-hidden
        className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`}
        animate={reduceMotion || state === "connected" ? undefined : { opacity: [1, 0.35, 1] }}
        transition={reduceMotion ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {!compact && <span>{label}</span>}
    </div>
  );
});

export default ConnectionStatus;
