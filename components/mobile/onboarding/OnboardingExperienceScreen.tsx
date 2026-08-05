"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Calendar, Swords, Users, Church, ChevronRight } from "lucide-react";
import { hapticLight } from "@/lib/mobile/haptics";
import { SHOW_CHURCH_MODE, SHOW_DAILY_CHALLENGE } from "@/lib/features/version";

// Mission 21.1 — matches the approved mockup: five premium cards (Solo
// Quiz, Daily Challenge, Live Battle, Friends Battle, Church Mode), same
// icon choices app/page.tsx already uses for these on the Home dashboard.
// Purely informational/preview — tapping only toggles a visual "selected"
// highlight (per the mockup's highlighted Live Battle card); it never
// navigates away from onboarding or writes any persisted state.
const ACCENT_CLASSES: Record<string, { border: string; icon: string; selectedBorder: string }> = {
  blue: { border: "border-blue-400/25", icon: "bg-blue-600 text-white", selectedBorder: "border-blue-400/70" },
  amber: { border: "border-amber-400/25", icon: "bg-amber-500 text-white", selectedBorder: "border-amber-400/70" },
  violet: { border: "border-purple-400/25", icon: "bg-purple-700 text-white", selectedBorder: "border-purple-400/70" },
  teal: { border: "border-teal-400/25", icon: "bg-teal-700 text-teal-200", selectedBorder: "border-teal-400/70" },
  purple: { border: "border-fuchsia-400/25", icon: "bg-fuchsia-800 text-fuchsia-200", selectedBorder: "border-fuchsia-400/70" },
};

function ExperienceCard({
  id,
  icon,
  title,
  description,
  accent,
  index,
  selected,
  onSelect,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  accent: keyof typeof ACCENT_CLASSES;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const accentClasses = ACCENT_CLASSES[accent];
  return (
    <motion.button
      type="button"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.25, delay: reduceMotion ? 0 : index * 0.05 } }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      onClick={() => {
        hapticLight();
        onSelect(id);
      }}
      aria-pressed={selected}
      className={`flex min-h-[68px] w-full items-center gap-3 rounded-card-sm border bg-white/[0.04] px-4 py-3.5 text-left shadow-premium transition-colors ${
        selected ? `${accentClasses.selectedBorder} bg-white/[0.06] shadow-gold` : accentClasses.border
      }`}
    >
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${accentClasses.icon}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-[#f7f0dc]">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-[#9aa1b0]">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 self-start text-[#6b7280]" aria-hidden />
    </motion.button>
  );
}

export default function OnboardingExperienceScreen({
  heading,
  headingAccent,
  subheading,
  items,
}: {
  heading: string;
  headingAccent: string;
  subheading: string;
  items: {
    soloCampaign: { title: string; description: string };
    dailyChallenge: { title: string; description: string };
    liveBattle: { title: string; description: string };
    churchMode: { title: string; description: string };
    friendsBattle: { title: string; description: string };
  };
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col px-5 pb-4">
      <h1 className="font-display text-xl font-bold text-[#fbf6e8]">
        {heading} <span className="text-gold-500">{headingAccent}</span>
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#c6cbd6]">{subheading}</p>

      <div className="mt-5 flex flex-col gap-2.5">
        <ExperienceCard
          id="solo"
          icon={<Play className="h-5 w-5" aria-hidden />}
          title={items.soloCampaign.title}
          description={items.soloCampaign.description}
          accent="blue"
          index={0}
          selected={selected === "solo"}
          onSelect={setSelected}
        />
        {SHOW_DAILY_CHALLENGE && (
          <ExperienceCard
            id="daily"
            icon={<Calendar className="h-5 w-5" aria-hidden />}
            title={items.dailyChallenge.title}
            description={items.dailyChallenge.description}
            accent="amber"
            index={1}
            selected={selected === "daily"}
            onSelect={setSelected}
          />
        )}
        <ExperienceCard
          id="live"
          icon={<Swords className="h-5 w-5" aria-hidden />}
          title={items.liveBattle.title}
          description={items.liveBattle.description}
          accent="violet"
          index={2}
          selected={selected === "live"}
          onSelect={setSelected}
        />
        <ExperienceCard
          id="friends"
          icon={<Users className="h-5 w-5" aria-hidden />}
          title={items.friendsBattle.title}
          description={items.friendsBattle.description}
          accent="teal"
          index={3}
          selected={selected === "friends"}
          onSelect={setSelected}
        />
        {SHOW_CHURCH_MODE && (
          <ExperienceCard
            id="church"
            icon={<Church className="h-5 w-5" aria-hidden />}
            title={items.churchMode.title}
            description={items.churchMode.description}
            accent="purple"
            index={4}
            selected={selected === "church"}
            onSelect={setSelected}
          />
        )}
      </div>
    </div>
  );
}
