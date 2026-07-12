"use client";

// ---------------------------------------------------------------------------
// Auth placeholder — Guest mode only, no backend wired up yet.
//
// FUTURE (Supabase-ready): when real accounts are added, this is the only
// file that should need real logic changes. A typical wiring would be:
//
//   import { createClient } from "@supabase/supabase-js";
//   const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   );
//
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data }) => {
//       setUser(data.session ? mapSupabaseUser(data.session.user) : null);
//     });
//     const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session ? mapSupabaseUser(session.user) : null);
//     });
//     return () => sub.subscription.unsubscribe();
//   }, []);
//
//   async function signIn(email: string) {
//     await supabase.auth.signInWithOtp({ email });
//   }
//   async function signOut() {
//     await supabase.auth.signOut();
//   }
//
// Once wired, `signInWithEmail`/`signOut` below would call the real
// Supabase methods instead of just no-op-ing, and localStorage progress
// (lib/progress.ts, lib/leaderboard.ts) would sync up to a `profiles` /
// `scores` table keyed by the authenticated user's id.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppUser } from "./types";

interface AuthContextValue {
  user: AppUser | null;
  isGuest: boolean;
  /** Not yet implemented — see the Supabase notes above. Currently a no-op. */
  signInWithEmail: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => void;
}

const GUEST_USER: AppUser = { id: "guest", displayName: "Guest", isGuest: true };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<AppUser>(GUEST_USER);

  async function signInWithEmail(_email: string) {
    // Placeholder only — no backend yet. Wire this up to Supabase (see the
    // comment block at the top of this file) when accounts are ready.
    return { ok: false, message: "Sign-in is coming soon — you're playing as a Guest for now." };
  }

  function signOut() {
    // no-op in guest-only mode
  }

  return (
    <AuthContext.Provider value={{ user, isGuest: user.isGuest, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}
