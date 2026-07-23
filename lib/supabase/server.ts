import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Route-handler-compatible Supabase client: reads the caller's session
 * from request cookies, so `auth.getUser()` reflects whoever is signed in
 * on the browser making this request. Uses the browser-safe publishable
 * key + RLS — never the service-role key. Read-only cookie access (no
 * `setAll`): sufficient for authorization checks; a near-expiry access
 * token just means the caller's own browser client refreshes it on its
 * normal interval and the next request carries the new cookie.
 */
export function createServerClientFromRequest(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or publishable key.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {
        // Read-only in this context — see the doc comment above.
      },
    },
  });
}

/**
 * Full-privilege server client that bypasses Row Level Security. Only for
 * server-side code that has already independently verified the caller is
 * authorized (e.g. after isAuthorizedAdminRequest() passes) — never expose
 * this client or its key to the browser. Mirrors the existing pattern in
 * lib/question-factory/database.ts.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!key) throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
