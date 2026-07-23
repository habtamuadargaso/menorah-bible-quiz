import type { NextRequest } from "next/server";
import { createServerClientFromRequest } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  email: string | null;
  role: string;
}

/**
 * Real per-user admin check (Mission 7 Part 3): verifies the caller has a
 * live Supabase Auth session AND is listed in admin_users. Returns null on
 * any failure (no session, expired session, authenticated-but-not-admin) —
 * callers should fall back to isAuthorizedAdminRequest()'s shared-secret
 * path, not treat null as an error.
 */
export async function getAdminSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const supabase = createServerClientFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) return null;

    return { userId: user.id, email: user.email ?? null, role: adminRow.role as string };
  } catch {
    return null;
  }
}
