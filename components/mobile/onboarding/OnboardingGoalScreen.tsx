"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Church, Trophy, Flame, Users2, Lightbulb, Check } from "lucide-react";
import type { OnboardingGoal } from "@/lib/mobile/onboarding";
import { hapticLight } from "@/lib/mobile/haptics";

const GOALS: { id: OnboardingGoal; icon: React.ReactNode }[] = [
  { id: "study", icon: <BookOpen className="h-9 w-9" strokeWidth={1.5} aria-hidden /> },
  { id: "church", icon: <Church className="h-9 w-9" strokeWidth={1.5} aria-hidden /> },
  { id: "compete", icon: <Trophy className="h-9 w-9" strokeWidth={1.5} aria-hidden /> },
  { id: "devotion", icon: <Flame className="h-9 w-9" strokeWidth={1.5} aria-hidden /> },
  { id: "family", icon: <Users2 className="h-9 w-9" strokeWidth={1.5} aria-hidden /> },
  { id: "knowledge", icon: <Lightbulb className="h-9 w-9" strokeWidth={1.5} aria-hidden /> },
];

// Mission 21.1 — matches the approved mockup: bare gold line-icons sitting
// directly on the card (no icon-badge circle), a small checkmark chip
// inline next to the label when selected, and a subtle unselected border
// vs. a bright gold border+glow when selected. Same single-select
// persistence (lib/mobile/onboarding.ts) as before — only the visuals
// changed.
export default function OnboardingGoalScreen({
  heading,
  subheading,
  labels,
  selected,
  onSelect,
}: {
  heading: string;
  subheading: string;
  labels: Record<OnboardingGoal, string>;
  selected: OnboardingGoal | null;
  onSelect: (goal: OnboardingGoal) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col px-5 pb-4">
      <h1 className="text-center font-display text-xl font-bold text-[#fbf6e8]">{heading}</h1>
      <p className="mt-1.5 text-center text-sm text-[#c6cbd6]">{subheading}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {GOALS.map((goal, i) => {
          const isSelected = selected === goal.id;
          return (
            <motion.button
              key={goal.id}
              type="button"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, delay: reduceMotion ? 0 : i * 0.04 } }}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => {
                hapticLight();
                onSelect(goal.id);
              }}
              aria-pressed={isSelected}
              className={`flex min-h-[130px] flex-col items-center justify-center gap-2.5 rounded-card-sm border px-3 py-4 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                isSelected
                  ? "border-gold-400/70 bg-gold-500/[0.06] shadow-gold"
                  : "border-white/10 bg-white/[0.03] hover:border-gold-500/30"
              }`}
            >
              <span
                className={isSelected ? "text-gold-300 drop-shadow-[0_0_10px_rgba(232,193,95,0.55)]" : "text-gold-500/90"}
              >
                {goal.icon}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold leading-tight text-[#f7f0dc]">{labels[goal.id]}</span>
                {isSelected && (
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gold-400 text-navy-900">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
