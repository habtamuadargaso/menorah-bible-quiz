import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/leaderboard" } };

export default function LeaderboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
