export function BrandSymbol({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden className={className}>
      <path d="M128 35v142M96 54v55c0 38 13 60 32 66M160 54v55c0 38-13 60-32 66M63 78v35c0 44 24 68 65 68M193 78v35c0 44-24 68-65 68M32 104v16c0 44 35 69 96 69M224 104v16c0 44-35 69-96 69" fill="none" stroke="#e4b83c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      {[32, 63, 96, 128, 160, 193, 224].map((x, index) => {
        const tops = [82, 56, 32, 10, 32, 56, 82];
        const y = tops[index];
        return <path key={x} d={`M ${x} ${y + 13} C ${x - 8} ${y + 9}, ${x - 7} ${y + 4}, ${x} ${y} C ${x + 7} ${y + 4}, ${x + 8} ${y + 9}, ${x} ${y + 13} Z`} fill="#ffd978" />;
      })}
      <path d="M128 188c-29-12-64-13-104-2l9 47c36-10 68-6 95 10Z" fill="#f8efd6" />
      <path d="M128 188c29-12 64-13 104-2l-9 47c-36-10-68-6-95 10Z" fill="#f8efd6" />
      <path d="M128 189v53" stroke="#b88824" strokeWidth="8" />
    </svg>
  );
}

export default function BrandLockup({ compact = false, title }: { compact?: boolean; title?: string }) {
  return (
    <span className={`flex min-w-0 items-center ${compact ? "gap-2" : "gap-3"}`}>
      <BrandSymbol className={`${compact ? "h-8 w-8" : "h-11 w-11"} flex-none`} />
      <span className="min-w-0">
        <span className={`${compact ? "text-sm" : "text-xl"} block truncate font-display font-bold leading-none tracking-[0.015em] text-[#fbf6e8]`}>
          {title ?? <>Menorah <span className="text-gold-500">Bible Quiz</span></>}
        </span>
        {!compact && <span className="mt-1.5 block h-0.5 w-20 rounded-full bg-gold-500" />}
      </span>
    </span>
  );
}
