// Veg / Non-veg mark — geometric shapes, not just colour (colour-blindness safe).
export function VegMark({ veg, className }: { veg: boolean; className?: string }) {
  if (veg) {
    return (
      <span
        role="img"
        aria-label="veg"
        data-testid={`veg-mark-${veg ? "veg" : "nonveg"}`}
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-green-500 bg-green-500/10 ${className ?? ""}`}
      >
        <span className="h-2 w-2 rounded-full bg-green-500" />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label="non-veg"
      data-testid="veg-mark-nonveg"
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-red-500 bg-red-500/10 ${className ?? ""}`}
    >
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden>
        <polygon points="5,1 9,9 1,9" fill="#EF4444" />
      </svg>
    </span>
  );
}

export default VegMark;
