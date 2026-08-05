import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/learn" } };

export default function LearnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
