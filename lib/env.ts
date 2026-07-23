/**
 * Startup environment validation. Import `assertServerEnv()` at the top of
 * server-only entry points (API routes, server components that need
 * privileged config) that cannot function without a given variable, so a
 * missing var fails fast with a clear message instead of surfacing as a
 * confusing downstream error. Never logs the value of any variable.
 */

type EnvSpec = {
  name: string;
  required: boolean;
  note?: string;
};

const CLIENT_ENV: EnvSpec[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", required: true },
  { name: "NEXT_PUBLIC_SITE_URL", required: false, note: "defaults to http://localhost:3000" },
];

const SERVER_ENV: EnvSpec[] = [
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: false, note: "or SUPABASE_SECRET_KEY; required for AI Question Factory + admin data migration" },
  { name: "GEMINI_API_KEY", required: false, note: "AI Question Factory is unavailable without it" },
  { name: "QUESTION_ADMIN_SECRET", required: false, note: "local-dev admin fallback only" },
];

/**
 * Checks required NEXT_PUBLIC_* vars are present. Safe to call from client
 * or server code. Throws with a name-only message (never a value).
 */
export function assertPublicEnv(): void {
  const missing = CLIENT_ENV.filter((v) => v.required && !process.env[v.name]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.map((v) => v.name).join(", ")}. See .env.example.`
    );
  }
}

/** Returns a report of which known env vars are set, by name only — never values. Safe to log. */
export function getEnvReport(): Array<{ name: string; set: boolean; required: boolean; note?: string }> {
  return [...CLIENT_ENV, ...SERVER_ENV].map((v) => ({
    name: v.name,
    set: Boolean(process.env[v.name]?.trim()),
    required: v.required,
    note: v.note,
  }));
}
