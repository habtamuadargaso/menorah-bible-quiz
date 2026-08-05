import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/multiplayer" } };

export default function MultiplayerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
