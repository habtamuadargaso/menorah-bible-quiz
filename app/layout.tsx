import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Menorah Bible Quiz", template: "%s | Menorah Bible Quiz" },
  description: "A multilingual Bible learning game for individuals, families, churches, and live competitions.",
  applicationName: "Menorah Bible Quiz",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "Menorah Bible Quiz",
    description: "Learn the Word. Test your faith. Grow in wisdom.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Menorah Bible Quiz",
    description: "Learn the Word. Test your faith. Grow in wisdom.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body bg-navy-950 text-[#f3efe2] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
