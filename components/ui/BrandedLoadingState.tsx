"use client";

export default function BrandedLoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] border border-gold-500/20 bg-white/[0.04] px-8 py-10 text-center shadow-premium" role="status" aria-live="polite">
      <span aria-hidden className="mx-auto block h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-gold-400 motion-reduce:animate-none" />
      <p className="mt-4 text-sm font-semibold text-[#c6cbd6]">{label}</p>
    </div>
  );
}
