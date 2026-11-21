import { useState } from "react";
import { Minus, Plus, Trash2, ShieldCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AdvancePaymentModal from "@/components/AdvancePaymentModal";
import { rupees } from "@/lib/format";
import type { StringKey, TFunc } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import type { Lang, QRDSession } from "@/lib/types";

interface Props {
  session: QRDSession | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  lang: Lang;
  t: TFunc;
  placing: boolean;
  onPlace(advancePaid?: number, advancePaymentId?: string): void;
}

export default function CartSheet({
  session,
  open,
  onOpenChange,
  lang,
  t,
  placing,
  onPlace,
}: Props) {
  const cart = useCart();
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);

  const spiceKey: Record<string, StringKey> = {
    mild: "mild",
    medium: "medium",
    hot: "hot",
    extrahot: "extraHot",
  };

  const subtotal = cart.subtotal;
  const grandTotal = Math.round(subtotal * 1.05);
  const advanceRequired = Math.round(grandTotal * 0.20);

  const handleAdvanceSuccess = (paymentId: string, advanceAmount: number) => {
    setAdvanceModalOpen(false);
    onOpenChange(false);
    onPlace(advanceAmount, paymentId);
  };

  const getSeatLabel = (s: number) => {
    if (s === 1) return "Seat 1 (Host - Me)";
    return `Seat ${s} (Guest)`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="glass-sheet mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl border-white/10 p-0 sm:rounded-3xl sm:border sm:bottom-6 sm:top-auto sm:shadow-2xl"
          data-testid="cart-sheet"
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20 mt-2 sm:hidden" />
          <SheetHeader className="px-6 pt-4">
            <SheetTitle className="font-heading text-lg font-bold" data-testid="cart-title">
              {t("viewCart")} — {cart.count} {t("items")}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Table {session?.table_id || "T-04"} • Review per-seat dishes before kitchen advance
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-6 pb-2 pt-3">
            {cart.lines.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground" data-testid="cart-empty">
                {t("cartEmpty")}
              </p>
            )}

            {cart.lines.map((line, i) => (
              <div
                key={line.key}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5"
                data-testid={`cart-line-${i}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`h-5 rounded-md px-1.5 text-[10px] font-black ${
                        line.seat === 1
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}
                      data-testid={`cart-seat-${i}`}
                    >
                      {getSeatLabel(line.seat)}
                    </Badge>
                    <span className="truncate text-sm font-bold" data-testid={`cart-name-${i}`}>
                      {line.item.name[lang]}
                    </span>
                  </div>

                  {(line.spice || line.addon_ids.length > 0 || line.notes) && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground" data-testid={`cart-custom-${i}`}>
                      {[
                        line.spice ? t(spiceKey[line.spice]) : null,
                        ...line.item.addons.filter((a) => line.addon_ids.includes(a.id)).map((a) => a.name[lang]),
                        line.notes,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                  <span className="text-xs tabular-nums text-muted-foreground">{rupees(line.unit)} / pc</span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-bold text-amber-400 tabular-nums" data-testid={`cart-line-total-${i}`}>
                    {rupees(line.unit * line.qty)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="h-8 w-8 rounded-lg border-white/15"
                      onClick={() => cart.setQty(line.key, line.qty - 1)}
                      data-testid={`cart-qty-minus-${i}`}
                      aria-label="decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-xs font-black tabular-nums">{line.qty}</span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="h-8 w-8 rounded-lg border-white/15"
                      onClick={() => cart.setQty(line.key, line.qty + 1)}
                      data-testid={`cart-qty-plus-${i}`}
                      aria-label="increase"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-500/10"
                      onClick={() => cart.remove(line.key)}
                      data-testid={`cart-remove-${i}`}
                      aria-label="remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cart.lines.length > 0 && (
            <div className="border-t border-white/10 px-6 py-4">
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground tabular-nums">{rupees(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {rupees(Math.round(subtotal * 0.05))}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-1 text-base font-bold text-foreground">
                  <span>Order Grand Total</span>
                  <span className="font-heading text-lg font-black text-amber-400 tabular-nums">
                    {rupees(grandTotal)}
                  </span>
                </div>
              </div>

              {/* 20% advance notice */}
              <div className="my-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>20% Advance to Cook:</span>
                </span>
                <span className="font-bold text-amber-400 tabular-nums">{rupees(advanceRequired)}</span>
              </div>

              <Button
                className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 font-black text-black shadow-lg shadow-amber-500/25 active:scale-95"
                disabled={placing}
                onClick={() => setAdvanceModalOpen(true)}
                data-testid="cart-place-button"
              >
                <span>Place Order (20% Advance)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Advance Payment Modal for Mobile */}
      <AdvancePaymentModal
        open={advanceModalOpen}
        onOpenChange={setAdvanceModalOpen}
        cartTotal={subtotal}
        itemCount={cart.count}
        onSuccess={handleAdvanceSuccess}
        onCancel={() => setAdvanceModalOpen(false)}
      />
    </>
  );
}

export { CartSheet };
