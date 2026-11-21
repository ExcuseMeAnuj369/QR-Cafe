import { useMemo } from "react";

export default function AmbientBackground() {
  // Generate stable coordinates for ambient glowing orbs and luxury dining sparkles
  const sparkles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${(i * 19 + 7) % 94}%`,
      top: `${(i * 23 + 11) % 90}%`,
      size: (i % 3) + 2,
      duration: `${4 + (i % 5)}s`,
      delay: `${(i % 4) * 0.8}s`,
      opacity: 0.15 + (i % 4) * 0.1,
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Dynamic ambient color gradients */}
      <div className="animate-aura-pulse absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-amber-500/[0.07] blur-[140px]" />
      <div className="animate-float-slow absolute -right-36 top-1/4 h-[550px] w-[550px] rounded-full bg-orange-600/[0.05] blur-[150px]" />
      <div className="animate-aura-pulse absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-amber-400/[0.06] blur-[130px]" />

      {/* Subtle fine geometric grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating culinary decorative particles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="animate-float absolute rounded-full bg-amber-400"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDuration: s.duration,
            animationDelay: s.delay,
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
}

export { AmbientBackground };

