"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GuestTestPage() {
  const [status, setStatus] = useState("Creating player profile...");

  useEffect(() => {
    let active = true;

    async function setupGuestPlayer() {
      try {
        const supabase = createClient();

        const {
          data: { user: existingUser },
          error: getUserError,
        } = await supabase.auth.getUser();

        if (getUserError) {
          console.log("No existing user session:", getUserError.message);
        }

        let user = existingUser;

        if (!user) {
          const { data, error: signInError } =
            await supabase.auth.signInAnonymously();

          if (signInError) {
            throw signInError;
          }

          user = data.user;
        }

        if (!user) {
          throw new Error("No authenticated user was created.");
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              display_name: "Guest Player",
              language: "en",
              xp: 0,
              coins: 0,
              player_level: 1,
              campaign_level: 1,
              games_played: 0,
              games_won: 0,
            },
            {
              onConflict: "id",
            }
          );

        if (profileError) {
          throw profileError;
        }

        if (active) {
          setStatus(`Player profile ready: ${user.id}`);
        }
      } catch (error: unknown) {
        console.error("Profile setup error:", error);

        let message = "Profile setup failed.";

        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ) {
          message = error.message;
        }

        if (active) {
          setStatus(`Error: ${message}`);
        }
      }
    }

    setupGuestPlayer();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-xl rounded-2xl border p-8 text-center">
        <h1 className="text-2xl font-bold">Guest Profile Test</h1>

        <p className="mt-4 break-all">{status}</p>
      </div>
    </main>
  );
}