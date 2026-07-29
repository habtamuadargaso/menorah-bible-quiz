"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  markOnboardingComplete,
  saveOnboardingGoal,
  saveOnboardingProfile,
  setDailyReminderChoice,
  type OnboardingGoal,
  type OnboardingProfile,
} from "@/lib/mobile/onboarding";
import OnboardingShell from "./OnboardingShell";
import OnboardingWelcomeScreen from "./OnboardingWelcomeScreen";
import OnboardingLanguageScreen from "./OnboardingLanguageScreen";
import OnboardingExperienceScreen from "./OnboardingExperienceScreen";
import OnboardingGoalScreen from "./OnboardingGoalScreen";
import OnboardingReminderScreen from "./OnboardingReminderScreen";
import OnboardingProfileScreen from "./OnboardingProfileScreen";
import OnboardingReadyScreen from "./OnboardingReadyScreen";

const TOTAL_STEPS = 7;

/**
 * Mission 21 / 21.1 — first-launch onboarding, mobile only. Mounted by
 * app/page.tsx in place of the normal Home dashboard whenever
 * hasCompletedOnboarding() is false; nothing here touches gameplay logic,
 * Supabase, or any existing route — it only reads/writes the local
 * storage helpers in lib/mobile/onboarding.ts and calls setLang() from the
 * already-existing LanguageContext for Screen 2. Mission 21.1 redrew every
 * screen's visuals to match the approved mockup; this orchestrator's
 * persistence/navigation logic is unchanged from Mission 21.
 */
export default function MobileOnboarding({
  onComplete,
  initialDisplayName,
}: {
  onComplete: () => void;
  initialDisplayName?: string;
}) {
  const { t } = useLanguage();
  const ts = t.onboarding;
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [profile, setProfile] = useState<OnboardingProfile>({
    avatar: "🕎",
    displayName: initialDisplayName ?? "",
    country: "",
    church: "",
  });

  function goNext() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }
  function skipAll() {
    markOnboardingComplete();
    onComplete();
  }
  function selectGoal(next: OnboardingGoal) {
    setGoal(next);
    saveOnboardingGoal(next);
  }
  function updateProfile(next: OnboardingProfile) {
    setProfile(next);
    saveOnboardingProfile(next);
  }
  async function enableReminder() {
    setDailyReminderChoice(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch {
      // Respecting the user's in-app choice doesn't depend on the browser
      // permission prompt succeeding or even existing.
    }
    goNext();
  }
  function declineReminder() {
    setDailyReminderChoice(false);
    goNext();
  }
  function finish() {
    markOnboardingComplete();
    onComplete();
  }

  const progressLabel = ts.progressLabel.replace("{n}", String(step));

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={`onboarding-step-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="h-full w-full"
        >
          {step === 1 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onSkip={skipAll}
              onContinue={goNext}
              continueLabel={ts.continueButton}
              secondaryLabel={ts.welcome.skipForNow}
              onSecondary={skipAll}
              footerNote={ts.welcome.tagline}
              footerNoteIcon
            >
              <OnboardingWelcomeScreen eyebrow={ts.welcome.eyebrow} subtitle={ts.welcome.subtitle} />
            </OnboardingShell>
          )}

          {step === 2 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onSkip={skipAll}
              onBack={goBack}
              onContinue={goNext}
              continueLabel={ts.continueButton}
            >
              <OnboardingLanguageScreen
                heading={ts.language.heading}
                headingAccent={ts.language.headingAccent}
                subheading={ts.language.subheading}
              />
            </OnboardingShell>
          )}

          {step === 3 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onSkip={skipAll}
              onBack={goBack}
              onContinue={goNext}
              continueLabel={ts.continueButton}
            >
              <OnboardingExperienceScreen
                heading={ts.experience.heading}
                headingAccent={ts.experience.headingAccent}
                subheading={ts.experience.subheading}
                items={ts.experience}
              />
            </OnboardingShell>
          )}

          {step === 4 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onSkip={skipAll}
              onBack={goBack}
              onContinue={goNext}
              continueLabel={ts.continueButton}
            >
              <OnboardingGoalScreen
                heading={ts.goal.heading}
                subheading={ts.goal.subheading}
                labels={{
                  study: ts.goal.study,
                  church: ts.goal.church,
                  compete: ts.goal.compete,
                  devotion: ts.goal.devotion,
                  family: ts.goal.family,
                  knowledge: ts.goal.knowledge,
                }}
                selected={goal}
                onSelect={selectGoal}
              />
            </OnboardingShell>
          )}

          {step === 5 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onSkip={skipAll}
              onBack={goBack}
              hideContinue
              continueLabel={ts.continueButton}
            >
              <OnboardingReminderScreen
                heading={ts.reminder.heading}
                subheading={ts.reminder.subheading}
                notificationTitle={ts.reminder.notificationTitle}
                notificationBody={ts.reminder.notificationBody}
                enableLabel={ts.reminder.enable}
                notNowLabel={ts.reminder.notNow}
                settingsNote={ts.reminder.settingsNote}
                onEnable={enableReminder}
                onNotNow={declineReminder}
              />
            </OnboardingShell>
          )}

          {step === 6 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onSkip={skipAll}
              onBack={goBack}
              onContinue={goNext}
              continueLabel={ts.continueButton}
            >
              <OnboardingProfileScreen
                heading={ts.profile.heading}
                headingAccent={ts.profile.headingAccent}
                subheading={ts.profile.subheading}
                nameLabel={ts.profile.nameLabel}
                namePlaceholder={ts.profile.namePlaceholder}
                countryLabel={ts.profile.countryLabel}
                countryPlaceholder={ts.profile.countryPlaceholder}
                churchLabel={ts.profile.churchLabel}
                churchPlaceholder={ts.profile.churchPlaceholder}
                profile={profile}
                onChange={updateProfile}
              />
            </OnboardingShell>
          )}

          {step === 7 && (
            <OnboardingShell
              step={step}
              totalSteps={TOTAL_STEPS}
              progressLabel={progressLabel}
              skipLabel={ts.skip}
              backLabel={ts.back}
              onBack={goBack}
              hideSkip
              onContinue={finish}
              continueLabel={ts.ready.startButton}
              footerNote={ts.ready.blessing}
            >
              <OnboardingReadyScreen
                headline={ts.ready.headline}
                subtitle={ts.ready.subtitle}
                verseQuote={ts.ready.verseQuote}
                verseReference={ts.ready.verseReference}
              />
            </OnboardingShell>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
