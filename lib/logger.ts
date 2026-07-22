/**
 * Production-safe structured logging (Mission 7 Part 11). Server-side use
 * only — never import this from a "use client" component; browser-side
 * errors should go through lib/errorReporting.ts instead, which is
 * safe-by-default (no network call unless a provider is configured).
 *
 * Never pass secret values (API keys, tokens, session identifiers) as
 * `context` — this may end up in a real log aggregator once one is wired
 * up. Log the shape of the problem, not the credential involved.
 */

type LogContext = Record<string, unknown>;

function redactedContext(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  const SENSITIVE_KEYS = /secret|token|password|key|session|cookie/i;
  const safe: LogContext = {};
  for (const [k, v] of Object.entries(context)) {
    safe[k] = SENSITIVE_KEYS.test(k) ? "[redacted]" : v;
  }
  return safe;
}

function emit(level: "info" | "warn" | "error", message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...redactedContext(context),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
};
