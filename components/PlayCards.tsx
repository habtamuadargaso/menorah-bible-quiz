"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type CardTheme = "gold" | "purple";
type CardIconName = "single" | "online" | "daily" | "church";

function CardIcon({ name }: { name: CardIconName }) {
  const common = {
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  switch (name) {
    case "single":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
        </svg>
      );
    case "online":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5Z" />
        </svg>
      );
    case "daily":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
          <rect x="4" y="9" width="16" height="11" rx="1.5" />
          <path d="M4 13h16M12 9v11M8 9c0-2 1.3-3.5 4-3.5S16 7 16 9" />
        </svg>
      );
    case "church":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
          <path d="M12 3v5M9.5 5.5h5" />
          <path d="M6 21v-8.5L12 8l6 4.5V21" />
          <path d="M4 21h16M10 21v-5h4v5" />
        </svg>
      );
  }
}

interface PlayCard {
  key: string;
  theme: CardTheme;
  icon: CardIconName;
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
}

export default function PlayCards({
  onSinglePlayer,
  onDailyChallenge,
  onChurchMode,
}: {
  onSinglePlayer: () => void;
  onDailyChallenge: () => void;
  onChurchMode: () => void;
}) {
  const { lang } = useLanguage();
  const isAmharic = lang === "am";

  function actionClass(theme: CardTheme) {
    return theme === "gold"
      ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-bold text-navy-950 shadow-gold transition-transform group-hover:-translate-y-0.5"
      : "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-purple transition-transform group-hover:-translate-y-0.5";
  }

  const cards: PlayCard[] = [
    {
      key: "single",
      theme: "gold",
      icon: "single",
      eyebrow: isAmharic ? "ካምፔይን" : "Campaign",
      title: isAmharic ? "ብቻዬን ተጫወት" : "Single Player",
      description: isAmharic
        ? "በራስዎ ፍጥነት 10 ደረጃዎችን ያልፉ።"
        : "Play through 10 levels at your own pace.",
      action: (
        <button onClick={onSinglePlayer} className={actionClass("gold")}>
          {isAmharic ? "ተጫወት" : "Play Now"}
        </button>
      ),
    },
    {
      key: "online",
      theme: "purple",
      icon: "online",
      eyebrow: isAmharic ? "የቀጥታ ጨዋታ" : "Live Multiplayer",
      title: isAmharic ? "የመስመር ላይ ውድድር" : "Online Battle",
      description: isAmharic
        ? "ክፍል ፍጠሩ ወይም ተቀላቀሉ እና ከጓደኞችዎ ጋር ይወዳደሩ።"
        : "Create or join a room and battle friends live.",
      action: (
        <Link href="/multiplayer" className={actionClass("purple")}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {isAmharic ? "አሁን ተቀላቀል" : "Join Now"}
        </Link>
      ),
    },
    {
      key: "daily",
      theme: "gold",
      icon: "daily",
      eyebrow: isAmharic ? "ዕለታዊ" : "Every Day",
      title: isAmharic ? "የዕለቱ ፈተና" : "Daily Challenge",
      description: isAmharic
        ? "ዕለታዊ ሽልማትዎን ይሰብስቡ እና ጅረትዎን ይገንቡ።"
        : "Claim your daily reward and build your streak.",
      action: (
        <button onClick={onDailyChallenge} className={actionClass("gold")}>
          {isAmharic ? "ክፈት" : "Open"}
        </button>
      ),
    },
    {
      key: "church",
      theme: "purple",
      icon: "church",
      eyebrow: isAmharic ? "ማህበረሰብ" : "Community",
      title: isAmharic ? "የቤተ ክርስቲያን ሁነታ" : "Church Mode",
      description: isAmharic
        ? "ለአጥቢያ ቤተ ክርስቲያን፣ ለወጣቶች ቡድን እና ለሰንበት ት/ቤት የተዘጋጀ።"
        : "Built for congregations, youth groups, and Sunday school.",
      action: (
        <button onClick={onChurchMode} className={actionClass("purple")}>
          {isAmharic ? "ያስሱ" : "Explore"}
        </button>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            whileHover={{ y: -6 }}
            className={`group relative flex flex-col overflow-hidden rounded-[26px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,.32)] backdrop-blur-sm ${
              card.theme === "gold"
                ? "border-gold-500/25 bg-gradient-to-br from-gold-500/10 via-white/[0.04] to-transparent hover:border-gold-500/50"
                : "border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-white/[0.04] to-transparent hover:border-purple-400/50"
            } transition-colors`}
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${
                card.theme === "gold" ? "bg-gold-500/15" : "bg-purple-500/20"
              }`}
            />

            <div className="relative flex flex-1 flex-col">
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                  card.theme === "gold"
                    ? "bg-gold-500/10 text-gold-400"
                    : "bg-purple-500/15 text-purple-300"
                }`}
              >
                <CardIcon name={card.icon} />
              </div>

              <div
                className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                  card.theme === "gold" ? "text-gold-400" : "text-purple-300"
                }`}
              >
                {card.eyebrow}
              </div>

              <h3 className="mt-2 font-display text-xl font-bold text-[#fbf6e8]">
                {card.title}
              </h3>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a7aebd]">
                {card.description}
              </p>

              <div className="mt-5">{card.action}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
