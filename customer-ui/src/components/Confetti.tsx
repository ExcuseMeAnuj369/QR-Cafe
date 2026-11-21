import { useEffect, useMemo, useState, type CSSProperties } from "react";

const COLORS = ["#F59E0B", "#FBBF24", "#FCD34D", "#4ADE80", "#FFFFFF"];

// Lightweight CSS confetti burst — saffron & gold, fires once per `fire` toggle.
export default function Confetti({ fire, onDone }: { fire: boolean; onDone?: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!fire) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2600);
    return () => clearTimeout(timer);
  }, [fire, onDone]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.5 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 160,
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 6,
        round: Math.random() > 0.5,
      })),
    [fire],
  );

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" data-testid="confetti-burst">
      {pieces.map((p, i) => (
        <span
          key={`${fire}-${i}`}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 1.8,
              background: p.color,
              borderRadius: p.round ? "50%" : 2,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export { Confetti };
