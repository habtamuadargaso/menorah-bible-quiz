import type { IconName } from "@/lib/categories";

export default function CategoryIcon({
  icon,
  className,
}: {
  icon: IconName;
  className?: string;
}) {
  const stroke = "#e8c15f";
  const common = { stroke, strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  switch (icon) {
    case "scroll":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" {...common} />
          <path d="M4 4a3 3 0 0 0 3 3M20 20a3 3 0 0 1-3-3" {...common} />
          <path d="M9 9h8M9 13h8" stroke={stroke} strokeWidth={1.1} strokeLinecap="round" />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M12 3v18M6 9h12" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      );
    case "lamp":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M12 3c2.5 3 3 5 1.4 7.2A2.5 2.5 0 0 1 12 16a2.5 2.5 0 0 1-1.4-5.8C12.2 8 12 5.5 12 3Z" {...common} />
          <path d="M9 20h6M12 16v4" {...common} />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="m12 3 2.4 5.8L20 9.4l-4.4 4 1.4 6L12 16.6 6.9 19.4l1.4-6L4 9.4l5.6-.6Z" {...common} />
        </svg>
      );
    case "flame":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M12 3c3 3.5 5 6.4 5 9.6a5 5 0 0 1-10 0c0-1.2.4-2.2 1-3 .2 1.2.9 1.8 1.6 1.8-.6-3 .6-5.4 2.4-8.4Z" {...common} />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M4 5.5c2-1 5-1 8 0 3-1 6-1 8 0v13c-2-1-5-1-8 0-3-1-6-1-8 0Z" {...common} />
          <path d="M12 5.5v13" stroke={stroke} strokeWidth={1.1} />
        </svg>
      );
    case "crown":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M4 18h16M4 18 3 9l5 4 4-7 4 7 5-4-1 9Z" {...common} />
        </svg>
      );
    case "pray":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M12 4v9M8 21c0-4 1.8-6.5 4-8 2.2 1.5 4 4 4 8" {...common} />
          <circle cx="12" cy="4" r="1.6" fill={stroke} stroke="none" />
        </svg>
      );
    case "fish":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M3 12c4-5 10-6 18-2-8 4-14 3-18-2Zm14-2 3-3M17 14l3 3" {...common} />
        </svg>
      );
    case "question":
    default:
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1.5 1-1.5 2.2" {...common} />
          <circle cx="12" cy="17.5" r="0.9" fill={stroke} stroke="none" />
        </svg>
      );
  }
}
