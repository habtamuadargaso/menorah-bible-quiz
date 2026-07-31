import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Menorah Bible Quiz",
    short_name: "Menorah Quiz",
    description: "A multilingual Bible learning game for individuals, families, and churches.",
    start_url: "/",
    display: "standalone",
    // Mission 25A brand system — official Deep Navy / Gold, replacing the
    // prior ad hoc #050b1c / #d4af37.
    background_color: "#0A1E3D",
    theme_color: "#D4AF37",
    icons: [
      { src: "/branding/logo-symbol.svg", sizes: "any", type: "image/svg+xml" },
      // PNG icons at standard PWA/mobile sizes, generated from the new
      // brand symbol (see public/branding/ and MOBILE_SETUP.md). "maskable"
      // tells Android it can safely crop to its own adaptive-icon shape —
      // the symbol has enough built-in padding for that.
      { src: "/icons/icon-48.png", sizes: "48x48", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
