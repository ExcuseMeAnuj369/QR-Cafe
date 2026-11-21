// Shimmer skeletons shaped exactly like the menu card — no spinners anywhere.
export function MenuCardSkeleton({ testid }: { testid?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/5 bg-card p-3" data-testid={testid ?? "menu-skeleton"}>
      <div className="shimmer h-24 w-24 shrink-0 rounded-xl bg-muted" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="shimmer h-4 w-3/4 rounded bg-muted" />
        <div className="shimmer h-3 w-full rounded bg-muted" />
        <div className="shimmer h-3 w-2/3 rounded bg-muted" />
        <div className="mt-auto flex items-center justify-between">
          <div className="shimmer h-4 w-20 rounded bg-muted" />
          <div className="shimmer h-9 w-16 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function MenuListSkeleton() {
  return (
    <div className="space-y-3" data-testid="menu-skeleton-list">
      {Array.from({ length: 5 }, (_, i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default MenuListSkeleton;
