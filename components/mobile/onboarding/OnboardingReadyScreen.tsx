"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf } from "lucide-react";
import heroArtwork from "@/public/images/menorah-hero-premium.webp";
import Confetti from "@/components/Confetti";

// Mission 21.1 — matches the approved mockup: the hero artwork is inset
// (not full-bleed) with laurel-branch flourishes flanking it, gold
// confetti (reusing the existing Confetti component, already used by
// MobileLevelComplete — no new particle system), then heading/subtitle
// sitting close beneath it and a bordered, glowing verse card. The
// shell's own Continue button (labelled "Start My Journey" by the
// caller) is what actually finishes onboarding.
export default function OnboardingReadyScreen({
  headline,
  subtitle,
  verseQuote,
  verseReference,
}: {
  headline: string;
  subtitle: string;
  verseQuote: string;
  verseReference: string;
}) {
  const reduceMotion = useReducedMotion();
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    setConfettiActive(true);
  }, []);

  return (
    <div className="flex h-full flex-col px-5">
      <Confetti active={confettiActive} />

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mt-2 h-[32vh] min-h-[220px] w-full flex-shrink-0 overflow-hidden rounded-2xl"
      >
        <Image
          src={heroArtwork}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 42%" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(120% 100% at 50% 55%, transparent 55%, rgba(8,13,34,0.4) 100%)",
          }}
        />
        <Leaf className="absolute bottom-4 left-2 h-9 w-9 -scale-x-100 text-gold-500/40" aria-hidden />
        <Leaf className="absolute bottom-4 right-2 h-9 w-9 text-gold-500/40" aria-hidden />
      </motion.div>

      <div className="flex flex-1 flex-col items-center gap-4 pt-4 text-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h1 className="font-display text-2xl font-bold text-gold-400">{headline}</h1>
          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-[#c6cbd6]">{subtitle}</p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="w-full rounded-card-sm border border-gold-400/50 bg-white/[0.03] px-5 py-4 shadow-gold"
        >
          <p className="text-sm italic leading-relaxed text-[#e4e7ee]">&ldquo;{verseQuote}&rdquo;</p>
          <p className="mt-2 text-xs font-semibold text-gold-400">{verseReference}</p>
        </motion.div>
      </div>
    </div>
  );
}
