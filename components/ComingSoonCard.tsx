"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ComingSoonCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-6 opacity-90 transition-colors hover:border-gold-500/25 hover:opacity-100"
    >
      <div className="absolute right-4 top-4 rounded-full border border-gold-500/30 bg-navy-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-400">
        {t.common.comingSoon}
      </div>
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-gold-500"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.03) 100%)",
        }}
      >
        {icon ?? (
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d="M6 10V8a6 6 0 1 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a1 1 0 0 1 1-1Z"
              stroke="#e8c15f"
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
      </div>
      <div className="font-display text-lg font-semibold text-[#f3efe2]">{title}</div>
      <p className="mt-1 text-sm leading-relaxed text-[#8d94a3]">{subtitle}</p>
    </motion.div>
  );
}
