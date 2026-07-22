"use client";

import { useEffect } from "react";

export type ToastMessage = {
  id: number;
  type: "success" | "error";
  text: string;
};

let nextToastId = 1;

/** Monotonic id generator so two toasts fired in the same tick (e.g. a
 * batch action that immediately triggers a second one) never collide. */
export function makeToastId(): number {
  nextToastId += 1;
  return nextToastId;
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 5000);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
        toast.type === "success" ? "border-emerald-400/40 bg-emerald-500 text-slate-950" : "border-red-400/40 bg-red-500 text-white"
      }`}
    >
      <span className="flex-1">{toast.text}</span>
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="text-xs opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

/** Fixed-position toast stack. Render once per page/panel that needs it,
 * fed by locally-owned `toasts` state — no global store, this app doesn't
 * need one yet. */
export function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
