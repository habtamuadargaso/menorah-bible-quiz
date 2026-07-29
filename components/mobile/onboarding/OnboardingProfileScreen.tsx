"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Camera, User, MapPin, ChevronDown, Church } from "lucide-react";
import type { OnboardingProfile } from "@/lib/mobile/onboarding";
import { hapticLight } from "@/lib/mobile/haptics";

const AVATARS = ["🕎", "📖", "✝️", "🕊️", "⭐", "👑", "🔥", "🌿"];

const inputWrapClass =
  "flex items-center gap-3 rounded-card-sm border border-white/10 bg-white/[0.04] px-4 py-4 focus-within:border-gold-400/50 focus-within:ring-2 focus-within:ring-gold-300";
const inputClass = "w-full bg-transparent text-[15px] text-[#f3efe2] outline-none placeholder:text-[#8d94a3]";

// Mission 21.1 — matches the approved mockup: a centered two-tone
// heading, then a horizontal split (a large avatar preview + camera badge
// on the left, the three fields stacked on the right) instead of the
// previous full-width vertical stack. Tapping the avatar/camera badge
// still cycles through the same emoji set as before — the mockup's photo
// illustration has no equivalent asset in this repo, so the picker
// interaction (not its visual) is what's preserved. Stored locally only
// (lib/mobile/onboarding.ts); intentionally does not write to the real
// Supabase profile/auth system, since none of this is required for any
// existing feature and the mission calls for no schema changes unless
// absolutely required.
export default function OnboardingProfileScreen({
  heading,
  headingAccent,
  subheading,
  nameLabel,
  namePlaceholder,
  countryLabel,
  countryPlaceholder,
  churchLabel,
  churchPlaceholder,
  profile,
  onChange,
}: {
  heading: string;
  headingAccent: string;
  subheading: string;
  nameLabel: string;
  namePlaceholder: string;
  countryLabel: string;
  countryPlaceholder: string;
  churchLabel: string;
  churchPlaceholder: string;
  profile: OnboardingProfile;
  onChange: (next: OnboardingProfile) => void;
}) {
  const reduceMotion = useReducedMotion();

  function cycleAvatar() {
    const idx = AVATARS.indexOf(profile.avatar);
    const next = AVATARS[(idx + 1) % AVATARS.length];
    onChange({ ...profile, avatar: next });
  }

  return (
    <div className="flex h-full flex-col px-5 pb-4">
      <h1 className="text-center font-display text-xl font-bold leading-tight text-[#fbf6e8]">
        {heading} <span className="text-gold-500">{headingAccent}</span>
      </h1>
      <p className="mt-1.5 text-center text-sm text-[#c6cbd6]">{subheading}</p>

      <div className="mt-8 flex items-start gap-4">
        <motion.button
          type="button"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          onClick={() => {
            hapticLight();
            cycleAvatar();
          }}
          aria-label={profile.avatar}
          className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold-400/50 bg-gradient-to-br from-gold-500/20 via-navy-900/60 to-purple-500/15 text-5xl shadow-gold"
        >
          <span aria-hidden>{profile.avatar}</span>
          <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-navy-950 bg-gold-400 text-navy-900">
            <Camera className="h-5 w-5" aria-hidden />
          </span>
        </motion.button>

        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <label className="block">
            <span className={inputWrapClass}>
              <User className="h-5 w-5 flex-shrink-0 text-gold-400/70" aria-hidden />
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => onChange({ ...profile, displayName: e.target.value })}
                placeholder={namePlaceholder || nameLabel}
                aria-label={nameLabel}
                maxLength={40}
                className={inputClass}
              />
            </span>
          </label>

          <label className="block">
            <span className={inputWrapClass}>
              <MapPin className="h-5 w-5 flex-shrink-0 text-gold-400/70" aria-hidden />
              <input
                type="text"
                value={profile.country}
                onChange={(e) => onChange({ ...profile, country: e.target.value })}
                placeholder={countryPlaceholder || countryLabel}
                aria-label={countryLabel}
                maxLength={56}
                className={inputClass}
              />
              <ChevronDown className="h-5 w-5 flex-shrink-0 text-gold-400/70" aria-hidden />
            </span>
          </label>

          <label className="block">
            <span className={inputWrapClass}>
              <Church className="h-5 w-5 flex-shrink-0 text-gold-400/70" aria-hidden />
              <input
                type="text"
                value={profile.church}
                onChange={(e) => onChange({ ...profile, church: e.target.value })}
                placeholder={churchPlaceholder || churchLabel}
                aria-label={churchLabel}
                maxLength={80}
                className={inputClass}
              />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
