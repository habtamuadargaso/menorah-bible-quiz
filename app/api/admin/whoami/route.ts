import type { NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

/**
 * Lets the admin dashboard ask "am I already signed in as an admin?" via a
 * cookie-only request (no secret header) on page load, so a returning
 * admin with a live Supabase session skips the unlock screen entirely.
 */
export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "admin-whoami", 300, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return Response.json({ authorized: false });
  }
  return Response.json({ authorized: true, email: session.email, role: session.role });
}
