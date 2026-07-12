"use client";

import { useMemo } from "react";

export default function Confetti({ active }: { active: boolean }) {
  const particles = useMemo(() => {
    const colors = ["#f0c868", "#e8c15f", "#ffffff", "#c99a2e"];
    return Array.from({ length: 46 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.4,
      size: 6 + Math.random() * 6,
      rotate: Math.random() * 360,
      color: colors[i % colors.length],
    }));
    // regenerate a fresh burst every time confetti becomes active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-30px] rounded-sm animate-confettiFall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
