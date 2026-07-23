import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Menorah Bible Quiz",
    short_name: "Menorah Quiz",
    description: "A multilingual Bible learning game for individuals, families, and churches.",
    start_url: "/",
    display: "standalone",
    background_color: "#050b1c",
    theme_color: "#d4af37",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      // Mission 12: PNG icons at standard PWA/mobile sizes, generated from
      // icon.svg via `npx @capacitor/assets generate` (see MOBILE_SETUP.md)
      // — iOS "Add to Home Screen" and some Android launchers render these
      // better than a bare SVG. "maskable" tells Android it can safely crop
      // to its own adaptive-icon shape (the same source already has enough
      // padding around the menorah mark for that).
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
