"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import heroArtwork from "@/public/images/menorah-hero-premium.webp";

// Mission 21.1 — redrawn to match the approved mockup: a large, full-width
// cinematic crop of the approved hero artwork (no circular crop, no
// cropping of the Menorah/flames/Bible — same crop-safety reasoning as
// MobileHero.tsx: the container's aspect ratio stays narrower than the
// source's own, so `cover` always scales to the full source height
// first), fading into the navy background at its base.
export default function OnboardingWelcomeScreen({
  eyebrow,
  subtitle,
}: {
  eyebrow: string;
  subtitle: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative h-[46vh] min-h-[280px] w-full flex-shrink-0 overflow-hidden"
      >
        <Image
          src={heroArtwork}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 42%" }}
          priority
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(8,13,34,0) 55%, rgba(8,13,34,0.55) 82%, rgba(8,13,34,1) 100%), radial-gradient(60% 50% at 50% 100%, rgba(232,193,95,0.12) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      <div className="flex flex-1 flex-col items-center px-6 pt-5 text-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{eyebrow}</p>
          <h1 className="mt-1.5 font-display text-[34px] font-bold leading-[1.15] text-[#fbf6e8]">
            Menorah
            <br />
            <span className="text-gold-500">Bible Quiz</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-[#c6cbd6]">{subtitle}</p>
        </motion.div>
      </div>
    </div>
  );
}
