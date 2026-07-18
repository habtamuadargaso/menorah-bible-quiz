export default function SectionBackdrop({ tint }: { tint: "purple" | "gold" }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden"
    >
      <div
        className={`absolute inset-0 ${
          tint === "purple" ? "bg-purple-500/[0.05]" : "bg-gold-500/[0.04]"
        }`}
      />
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
          tint === "purple" ? "via-purple-300/25" : "via-gold-300/25"
        } to-transparent`}
      />
    </div>
  );
}
