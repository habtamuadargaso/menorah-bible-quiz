import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/friends-battle" } };

export default function FriendsBattleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
