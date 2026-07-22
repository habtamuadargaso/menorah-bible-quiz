import type { MetadataRoute } from "next";

/** Only public, stable, non-room-specific routes — Live Battle host/play
 * URLs are dynamic and private (a room code), and are excluded here as
 * well as in robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = ["/", "/friends-battle", "/multiplayer", "/multiplayer/join", "/leaderboard", "/settings", "/about", "/privacy", "/terms", "/support"];

  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }));
}
