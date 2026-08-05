"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, CalendarDays, ChevronRight, Church, Flame, Play, Swords, Users } from "lucide-react";
import heroArtwork from "@/public/images/menorah-hero-premium.webp";
import { getDailyVerse, getVerseText } from "@/lib/bible/verses";
import type { ProfileStats } from "@/lib/profileStats";
import { hapticLight } from "@/lib/mobile/haptics";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SHOW_CHURCH_MODE, SHOW_DAILY_CHALLENGE } from "@/lib/features/version";

type Props = {
  displayName: string;
  isGuest: boolean;
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  streak: number;
  stats: ProfileStats | null;
  onDailyChallenge: () => void;
  onLiveBattle: () => void;
  onChurchMode: () => void;
};

const cardSurface = "rounded-[22px] border border-white/10 bg-white/[0.045] shadow-[0_16px_40px_rgba(0,0,0,0.24)]";

export default function MobileHomeDashboard({
  displayName,
  isGuest,
  level,
  totalXp,
  xpIntoLevel,
  xpForNextLevel,
  progressPct,
  streak,
  stats,
  onDailyChallenge,
  onLiveBattle,
  onChurchMode,
}: Props) {
  const { lang, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const isAmharic = lang === "am";
  const name = isGuest ? t.common.guest : displayName;
  const verse = getDailyVerse();
  const verseText = getVerseText(verse, lang);
  const activity = stats?.recentActivity.slice(0, 3) ?? [];
  const entrance = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.15 : 0.28, delay },
  });

  const modes = [
    {
      key: "solo",
      title: isAmharic ? "ብቸኛ ጥያቄ" : "Solo Quiz",
      subtitle: isAmharic ? "በ10 ደረጃዎች ይማሩ" : "Learn through 10 levels",
      status: isAmharic ? "10 ደረጃዎች" : "10 Levels",
      icon: Play,
      accent: "border-blue-400/25 bg-blue-500/10 text-blue-300",
      href: "/learn",
    },
    {
      key: "friends",
      title: isAmharic ? "የጓደኞች ውድድር" : "Friends Battle",
      subtitle: isAmharic ? "በአንድ መሣሪያ ይጫወቱ" : "Pass and play together",
      status: isAmharic ? "1 መሣሪያ" : "1 Device",
      icon: Users,
      accent: "border-teal-400/25 bg-teal-500/10 text-teal-300",
      href: "/friends-battle",
    },
    {
      key: "live",
      title: isAmharic ? "የቀጥታ ውድድር" : "Live Battle",
      subtitle: isAmharic ? "ክፍል ይፍጠሩ ወይም ይቀላቀሉ" : "Create or join a room",
      status: isAmharic ? "መስመር ላይ" : "Online",
      icon: Swords,
      accent: "border-purple-400/25 bg-purple-500/10 text-purple-300",
      onClick: onLiveBattle,
    },
    {
      key: "church",
      title: isAmharic ? "የቤተ ክርስቲያን ሁነታ" : "Church Mode",
      subtitle: isAmharic ? "የቡድን ውድድር ያስተናግዱ" : "Host a church competition",
      status: isAmharic ? "ቡድን" : "Group",
      icon: Church,
      accent: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-300",
      onClick: onChurchMode,
    },
    {
      key: "daily",
      title: isAmharic ? "የዕለቱ ፈተና" : "Daily Challenge",
      subtitle: isAmharic ? "የዕለቱን ፈተና ይጫወቱ" : "Today's Bible challenge",
      status: isAmharic ? "ዕለታዊ" : "Daily",
      icon: CalendarDays,
      accent: "border-amber-400/25 bg-amber-500/10 text-amber-300",
      onClick: onDailyChallenge,
    },
  ];
  const visibleModes = modes.filter((mode) => {
    if (mode.key === "daily") return SHOW_DAILY_CHALLENGE;
    if (mode.key === "church") return SHOW_CHURCH_MODE;
    return true;
  });
  const modeGroups = [
    { label: isAmharic ? "አሁን ይጫወቱ" : "Play Now", items: visibleModes.slice(0, 3) },
    { label: isAmharic ? "ልዩ ሁነታዎች" : "Special Modes", items: visibleModes.slice(3) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-4 px-3 pb-5 pt-3">
      <motion.section {...entrance()} className={`relative min-h-[176px] overflow-hidden p-5 ${cardSurface}`}>
        <div aria-hidden className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative z-10 max-w-[58%] pt-1">
          <p className="font-display text-[25px] font-bold leading-[1.08] text-[#fbf6e8]">
            {isAmharic ? `እንኳን ደህና መጡ፣ ${name}!` : <>Welcome back,<br /><span className="text-gold-400">{name}!</span></>}
          </p>
          <p className="mt-3 text-[13px] leading-5 text-[#aeb5c3]">
            {isAmharic ? "በየቀኑ በእግዚአብሔር ቃል ማደግዎን ይቀጥሉ።" : "Keep growing in God’s Word every day."}
          </p>
        </div>
        <div aria-hidden className="absolute inset-y-0 right-0 w-[48%] overflow-hidden">
          <Image src={heroArtwork} alt="" fill priority sizes="190px" className="object-cover" style={{ objectPosition: "right center" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1830] via-[#0c1830]/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1429]/55 via-transparent to-transparent" />
        </div>
      </motion.section>

      <motion.section {...entrance(0.03)} aria-label={isAmharic ? "የተጫዋች እድገት" : "Player progress"} className="grid grid-cols-3 gap-2">
        <div className={`${cardSurface} flex min-h-[118px] flex-col p-3`}>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f97a7]">{t.common.level}</span>
          <span className="mt-auto font-display text-3xl font-bold text-gold-400">{level}</span>
          <span className="mt-1 text-[11px] text-[#aab1c0]">{isAmharic ? "የአሁኑ ደረጃ" : "Current level"}</span>
        </div>
        <div className={`${cardSurface} col-span-1 flex min-h-[118px] flex-col p-3`}>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f97a7]">{isAmharic ? "የXP እድገት" : "XP Progress"}</span>
          <span className="mt-auto font-display text-lg font-bold text-[#f7f0dc]">{xpIntoLevel} <span className="text-xs text-[#8f97a7]">/ {xpForNextLevel}</span></span>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-600" style={{ width: `${progressPct}%` }} /></div>
          <span className="mt-1.5 text-[10px] text-[#8f97a7]">{progressPct}% · {totalXp.toLocaleString()} XP</span>
        </div>
        <div className={`${cardSurface} flex min-h-[118px] flex-col p-3`}>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f97a7]">{isAmharic ? "ተከታታይ" : "Streak"}</span>
          <Flame className={`mt-auto h-6 w-6 ${streak > 0 ? "text-streak-400" : "text-[#667084]"}`} strokeWidth={1.8} aria-hidden />
          <span className="mt-1 font-display text-lg font-bold text-[#f7f0dc]">{streak} <span className="text-xs font-normal text-[#aab1c0]">{isAmharic ? "ቀን" : streak === 1 ? "day" : "days"}</span></span>
        </div>
      </motion.section>

      <motion.div {...entrance(0.05)}>
        <Link href="/learn" onClick={hapticLight} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 px-5 text-sm font-bold text-navy-950 shadow-[0_10px_24px_rgba(201,154,46,0.25),inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950">
          {isAmharic ? "ጉዞውን ይቀጥሉ" : "Continue Journey"}<ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>

      <motion.section {...entrance(0.07)} className={`${cardSurface} flex items-center gap-3 p-4`}>
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-500/10 text-gold-300"><BookOpen className="h-5 w-5" strokeWidth={1.8} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400">{isAmharic ? "የዛሬ ጥቅስ" : "Today’s Verse"}</span><span className="flex-none text-[10px] font-bold text-gold-300">{verse.reference}</span></div>
          <p className="mt-1 line-clamp-2 font-display text-[13px] italic leading-5 text-[#e9e4d8]">“{verseText}”</p>
        </div>
        <ChevronRight className="h-4 w-4 flex-none text-[#747d8e]" aria-hidden />
      </motion.section>

      <motion.section {...entrance(0.09)}>
        {modeGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex === 0 ? "" : "mt-8"}>
            <h2 className="mb-4 px-1 font-display text-sm font-bold uppercase tracking-[0.16em] text-gold-400">{group.label}</h2>
            <div className="space-y-4">
              {group.items.map(({ icon: Icon, ...mode }) => {
                const content = <><span className={`pointer-events-none flex h-16 w-16 flex-none items-center justify-center rounded-[22px] border ${mode.accent}`}><Icon className="h-8 w-8" strokeWidth={1.7} aria-hidden /></span><span className="pointer-events-none min-w-0 flex-1"><span className="block truncate font-display text-2xl font-bold leading-tight text-[#f7f0dc]">{mode.title}</span><span className="mt-1.5 block truncate text-base leading-6 text-[#9ca4b4]">{mode.subtitle}</span></span><ChevronRight className="pointer-events-none h-6 w-6 flex-none text-[#747d8e]" strokeWidth={1.8} aria-hidden /></>;
                const classes = `${cardSurface} flex min-h-[124px] w-full items-center gap-4 px-5 py-4 text-left outline-none transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-gold-500/25 hover:bg-white/[0.06] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-gold-300`;
                return mode.href ? <Link key={mode.title} href={mode.href} onClick={hapticLight} aria-label={mode.title} className={classes}>{content}</Link> : <button key={mode.title} type="button" aria-label={mode.title} onClick={() => { hapticLight(); mode.onClick?.(); }} className={classes}>{content}</button>;
              })}
            </div>
          </div>
        ))}
      </motion.section>

      <motion.section {...entrance(0.11)}>
        <h2 className="mb-2.5 px-1 font-display text-sm font-bold uppercase tracking-[0.16em] text-gold-400">{t.profile.recentActivityHeading}</h2>
        <div className={`${cardSurface} p-4`}>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center px-3 py-6 text-center"><BookOpen className="h-6 w-6 text-[#687184]" strokeWidth={1.6} aria-hidden /><p className="mt-3 text-sm leading-6 text-[#8f97a7]">{isAmharic ? "ሲማሩ እና ሲጫወቱ እንቅስቃሴዎ እዚህ ይታያል።" : "Your activity will appear here as you learn and play."}</p></div>
          ) : (
            <ol className="divide-y divide-white/10">
              {activity.map((entry) => {
                const category = t.categories[entry.categoryId];
                return <li key={entry.date} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="h-2 w-2 flex-none rounded-full bg-gold-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#f3efe2]">{category.title}</p><p className="mt-0.5 text-xs text-[#8f97a7]">{entry.correct}/{entry.total} {t.result.correct.toLowerCase()} · +{entry.xpEarned} XP</p></div><time className="text-[10px] text-[#737c8d]">{new Date(entry.date).toLocaleDateString(lang === "am" ? "am-ET" : undefined, { month: "short", day: "numeric" })}</time></li>;
              })}
            </ol>
          )}
        </div>
      </motion.section>
    </div>
  );
}
