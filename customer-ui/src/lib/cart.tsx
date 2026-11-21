import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine, MenuItem, SpiceLevel } from "@/lib/types";

interface AddOpts {
  qty: number;
  spice: SpiceLevel | null;
  addon_ids: string[];
  notes: string | null;
  seat: number;
}

interface CartApi {
  lines: CartLine[];
  add(item: MenuItem, opts: AddOpts): number; // returns line qty after add
  setQty(key: string, qty: number): void;
  remove(key: string): void;
  clear(): void;
  count: number;
  subtotal: number; // paise
}

const CartContext = createContext<CartApi | null>(null);

function unitPrice(item: MenuItem, addonIds: string[]): number {
  return item.price + item.addons.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("qrd_cart");
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      // corrupted cart — start fresh
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("qrd_cart", JSON.stringify(lines));
    } catch {
      // storage full/blocked — cart just won't persist
    }
  }, [lines]);

  const add = useCallback((item: MenuItem, opts: AddOpts): number => {
    const key = [
      item.id,
      opts.spice ?? "-",
      opts.addon_ids.slice().sort().join("+"),
      opts.notes?.trim() ?? "",
      opts.seat,
    ].join("|");
    const unit = unitPrice(item, opts.addon_ids);
    let afterQty = opts.qty;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      let next: CartLine[];
      if (existing) {
        afterQty = existing.qty + opts.qty;
        next = prev.map((l) => (l.key === key ? { ...l, qty: afterQty } : l));
      } else {
        next = [
          ...prev,
          { key, item, qty: opts.qty, spice: opts.spice, addon_ids: opts.addon_ids, notes: opts.notes, seat: opts.seat, unit },
        ];
      }
      return next;
    });
    return afterQty;
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unit * l.qty, 0), [lines]);

  const api = useMemo<CartApi>(
    () => ({ lines, add, setQty, remove, clear, count, subtotal }),
    [lines, add, setQty, remove, clear, count, subtotal],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
