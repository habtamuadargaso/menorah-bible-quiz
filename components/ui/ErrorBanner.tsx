"use client";

/**
 * Mission 6 Part 5 — a single reusable "something went wrong" banner with
 * a Retry action, so error states stop being raw thrown-error text with no
 * way forward. `message` should already be a friendly, translated string
 * (callers are responsible for mapping technical errors to something a
 * player/admin can act on — see the friendly-error helpers this mission
 * adds to lib/i18n for the player-facing flows).
 */
export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center">
      <p className="text-sm text-red-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-red-400/40 px-4 py-2 text-xs font-bold text-red-200 outline-none transition-colors hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-300"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
