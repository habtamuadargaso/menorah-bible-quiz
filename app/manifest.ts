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
    ],
  };
}
