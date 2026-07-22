import type { NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "./session";

/**
 * Two authorization paths, checked in order (Mission 7 Part 3):
 *
 *  1. Real per-user auth: a live Supabase Auth session whose user is
 *     listed in the admin_users table. This is the path production
 *     deployments should use.
 *
 *  2. Shared-secret fallback (x-admin-secret header vs QUESTION_ADMIN_SECRET,
 *     the original Mission 5E mechanism): kept only as a documented
 *     local-development convenience for when no Supabase admin account has
 *     been provisioned yet. It grants access to anyone with the secret,
 *     not per-user — do not rely on it in production once real admin
 *     accounts exist. See ADMIN.md.
 *
 * Nothing here logs or echoes back the secret or any session token.
 */
export async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const session = await getAdminSessionFromRequest(request);
  if (session) return true;

  const supplied = request.headers.get("x-admin-secret");
  const expected = process.env.QUESTION_ADMIN_SECRET;
  return Boolean(expected) && supplied === expected;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}
