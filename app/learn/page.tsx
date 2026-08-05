import type { Metadata } from "next";
import LearnRouteClient from "@/components/LearnRouteClient";

export const metadata: Metadata = {
  title: "Learn",
  description: "Explore Bible quiz categories and daily Scripture learning activities.",
};

// The selected verse is date-dependent. Render per request so the serialized
// UTC timestamp remains current instead of being frozen at build time.
export const dynamic = "force-dynamic";

export default function LearnRoute() {
  // Serialize one timestamp into the client component so SSR and hydration
  // select the exact same daily and memory verses, including at UTC midnight.
  return <LearnRouteClient verseDateIso={new Date().toISOString()} />;
}
