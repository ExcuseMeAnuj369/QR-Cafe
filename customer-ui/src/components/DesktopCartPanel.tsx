import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Utensils, ShieldCheck, Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdvancePaymentModal from "@/components/AdvancePaymentModal";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/format";
import { saveSession } from "@/lib/local";
import { toast } from "sonner";
import type { Lang, QRDSession } from "@/lib/types";
import type { StringKey, TFunc } from "@/lib/i18n";

interface Props {
  session: QRDSession | null;
  lang: Lang;
  t: TFunc;
  placing: boolean;
  onPlace(advancePaid?: number, advancePaymentId?: string): void;
  selectedSeat: number;
  onSelectSeat(seat: number): void;
}

export default function DesktopCartPanel({
  session,
  lang,
  t,
  placing,
  onPlace,
  selectedSeat,
  onSelectSeat,
}: Props) {
  const cart = useCart();
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);

  const spiceKey: Record<string, StringKey> = {
    mild: "mild",
    medium: "medium",
    hot: "hot",
    extrahot: "extraHot",
  };

  const isGroupActive = !!(session?.group_id || session?.linked_table_id);
  const currentTable = session?.table_id || "T-04";
  const linkedTable = session?.linked_table_id || "T-05";

  // Live connected seats list across single table or merged tables
  const seatsList = isGroupActive
    ? [
        { id: 1, table: currentTable, chair: 1, shortLabel: `T-${currentTable} · C1`, label: `Table ${currentTable} • Chair 1 (You)`, isHost: true, isLinked: false },
        { id: 2, table: currentTable, chair: 2, shortLabel: `T-${currentTable} · C2`, label: `Table ${currentTable} • Chair 2 (Guest)`, isHost: false, isLinked: false },
        { id: 3, table: linkedTable, chair: 1, shortLabel: `T-${linkedTable} · C1`, label: `Table ${linkedTable} • Chair 1 (Friend)`, isHost: false, isLinked: true },
        { id: 4, table: linkedTable, chair: 2, shortLabel: `T-${linkedTable} · C2`, label: `Table ${linkedTable} • Chair 2 (Guest)`, isHost: false, isLinked: true },
      ]
    : (session?.claimed_chairs && session.claimed_chairs.length > 0 ? session.claimed_chairs : [1, 2]).map((c) => ({
        id: c,
        table: currentTable,
        chair: c,
        shortLabel: c === 1 ? "Chair 1 (You)" : `Chair ${c}`,
        label: c === 1 ? `Chair 1 (${session?.user_name || "You - Host"})` : `Chair ${c} (Guest)`,
        isHost: c === 1,
        isLinked: false,
      }));

  const activeSeatObj = seatsList.find((x) => x.id === selectedSeat) || seatsList[0];

  const subtotal = cart.subtotal;
  const cgst = Math.round(subtotal * 0.025);
  const sgst = Math.round(subtotal * 0.025);
  const grandTotal = subtotal + cgst + sgst;
  const advanceRequired = Math.round(grandTotal * 0.20);

  const handleAdvanceSuccess = (paymentId: string, advanceAmount: number) => {
    setAdvanceModalOpen(false);
    onPlace(advanceAmount, paymentId);
  };

  const handleAddGuestChair = () => {
    if (!session) return;
    const currentClaimed = session.claimed_chairs || [1];
    const nextChair = Math.max(...currentClaimed, 1) + 1;
    if (nextChair > 6) {
      toast.info("Maximum 6 chairs supported per table.");
      return;
    }
    const updatedChairs = [...currentClaimed, nextChair].sort((a, b) => a - b);
    const updated = {
      ...session,
      party_size: updatedChairs.length,
      seats_count: updatedChairs.length,
      claimed_chairs: updatedChairs,
      guest_seats: updatedChairs.filter((c) => c !== (session.chair_id || 1)),
    };
    saveSession(updated);
    toast.success(`Chair ${nextChair} added directly as Guest (No Phone)!`, {
      description: "You can now add dishes specifically for this seat.",
    });
    onSelectSeat(nextChair);
  };

  return (
    <>
      <aside
        className="glass-card sticky top-24 flex h-[calc(100vh-7.5rem)] flex-col rounded-3xl border border-white/10 p-5 shadow-2xl"
        data-testid="desktop-cart-panel"
      >
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Table Order Basket</h2>
                <p className="text-xs text-muted-foreground">{cart.count} items selected</p>
              </div>
            </div>
            {cart.lines.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cart.clear()}
                className="h-8 text-xs text-muted-foreground hover:text-red-400"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Group Status Pill (If Merged) */}
          {isGroupActive && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs text-purple-200">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="font-extrabold text-white">Table {currentTable}</span>
                <span className="text-purple-400">⇄</span>
                <span className="font-extrabold text-purple-200">Table {linkedTable}</span>
              </div>
              <span className="font-mono text-[10px] text-purple-300">
                #{session?.group_id}
              </span>
            </div>
          )}

          {/* Host & Guest Seat Selector */}
          <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                <span>Active Ordering Chair:</span>
              </span>
              <span className="font-extrabold text-amber-400 text-[11px] truncate max-w-[160px]">
                {activeSeatObj?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {seatsList.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectSeat(st.id)}
                  className={`flex items-center justify-between rounded-xl py-2 px-2.5 text-xs font-bold transition-all ${
                    selectedSeat === st.id
                      ? "bg-amber-400 text-black shadow-md shadow-amber-500/25 scale-[1.02]"
                      : st.isLinked
                      ? "border border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
                      : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{st.shortLabel}</span>
                  <span className="text-[10px] opacity-75 ml-1 shrink-0">{st.isHost ? "👑 Me" : "Guest"}</span>
                </button>
              ))}
            </div>

            {/* Quick Add Guest Chair (No Phone) */}
            {!isGroupActive && (
              <button
                type="button"
                onClick={handleAddGuestChair}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/[0.015] py-1.5 text-[11px] font-bold text-muted-foreground hover:border-amber-500/40 hover:text-amber-300 transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add Guest Chair (No Phone Needed)</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1 py-3.5">
          {cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-muted-foreground">
                <Utensils className="h-6 w-6 opacity-40" />
              </div>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">{t("cartEmpty")}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Select dishes from menu for Chair 1 (You) or Guests
              </p>
            </div>
          ) : (
            cart.lines.map((line, i) => {
              const seatObj = seatsList.find((s) => s.id === line.seat) || seatsList[0];
              return (
                <div
                  key={line.key}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/15"
                  data-testid={`desktop-cart-line-${i}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`h-4.5 rounded-md px-1.5 text-[9px] font-black ${
                          seatObj?.isLinked
                            ? "bg-purple-500/25 text-purple-200 border border-purple-500/40"
                            : line.seat === 1
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {seatObj?.shortLabel || `Seat ${line.seat}`}
                      </Badge>
                      <h4 className="truncate text-xs font-bold text-foreground">
                        {line.item.name[lang]}
                      </h4>
                    </div>

                    {(line.spice || line.addon_ids.length > 0 || line.notes) && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                        {[
                          line.spice ? t(spiceKey[line.spice]) : null,
                          ...line.item.addons
                            .filter((a) => line.addon_ids.includes(a.id))
                            .map((a) => a.name[lang]),
                          line.notes,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 tabular-nums">
                        {rupees(line.unit * line.qty)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:bg-white/10"
                          onClick={() => cart.setQty(line.key, line.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-black tabular-nums">
                          {line.qty}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:bg-white/10"
                          onClick={() => cart.setQty(line.key, line.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-red-400 hover:bg-red-500/10"
                          onClick={() => cart.remove(line.key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Advance Payment Notice & Action */}
        {cart.lines.length > 0 && (
          <div className="border-t border-white/[0.08] pt-3.5">
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground tabular-nums">{rupees(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (CGST + SGST 5%)</span>
                <span className="font-semibold text-foreground tabular-nums">{rupees(cgst + sgst)}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-1 text-sm font-bold text-foreground">
                <span>Order Total</span>
                <span className="font-heading text-base font-black text-amber-400 tabular-nums">
                  {rupees(grandTotal)}
                </span>
              </div>
            </div>

            {/* Advance Payment Banner */}
            <div className="my-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>20% Advance to Cook:</span>
              </div>
              <span className="font-bold text-amber-400 tabular-nums">
                {rupees(advanceRequired)}
              </span>
            </div>

            <Button
              className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 font-extrabold text-black shadow-lg shadow-amber-500/25 transition-transform duration-150 hover:from-amber-300 hover:to-amber-500 active:scale-[0.98] disabled:opacity-50"
              disabled={placing}
              onClick={() => setAdvanceModalOpen(true)}
              data-testid="desktop-place-order-button"
            >
              {placing ? (
                <span>Routing to Kitchen...</span>
              ) : (
                <>
                  <span>Place Order (20% Advance)</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/80">
              Zero food waste: Cooking starts upon 20% advance confirmation.
            </p>
          </div>
        )}
      </aside>

      {/* Advance Razorpay/UPI Modal */}
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

export { DesktopCartPanel };
