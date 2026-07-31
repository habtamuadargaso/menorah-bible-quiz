import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { assertPublicEnv } from "@/lib/env";

// Fails fast with a clear, value-free error if required config is missing,
// instead of letting it surface later as a confusing Supabase client error.
assertPublicEnv();

// Mission 6 Part 6: this was missing entirely, which left mobile browsers
// on default zoom/scale behavior and gave iOS no way to know the app wants
// to draw under the notch/home-indicator safe areas. viewportFit: "cover"
// is what makes `env(safe-area-inset-*)` usable in globals.css.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // Mission 25A brand system — official "Deep Navy" (#0A1E3D), replacing
  // the prior ad hoc #080d22.
  themeColor: "#0A1E3D",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Menorah Bible Quiz", template: "%s | Menorah Bible Quiz" },
  description: "A multilingual Bible learning game for individuals, families, churches, and live competitions.",
  applicationName: "Menorah Bible Quiz",
  manifest: "/manifest.webmanifest",
  // Mission 25A brand system — see public/branding/.
  icons: {
    icon: [
      { url: "/branding/favicon.ico", sizes: "any" },
      { url: "/branding/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/branding/logo-symbol.svg", type: "image/svg+xml" },
    ],
    apple: "/branding/apple-touch-icon.png",
  },
  openGraph: {
    title: "Menorah Bible Quiz",
    description: "Learn the Word. Test your faith. Grow in wisdom.",
    type: "website",
    images: [{ url: "/branding/og-image.png", width: 1200, height: 630, alt: "Menorah Bible Quiz" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menorah Bible Quiz",
    description: "Learn the Word. Test your faith. Grow in wisdom.",
    images: ["/branding/og-image.png"],
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
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
