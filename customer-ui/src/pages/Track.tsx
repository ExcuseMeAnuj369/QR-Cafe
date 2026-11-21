import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChefHat,
  Receipt,
  Utensils,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OrderStepper from "@/components/OrderStepper";
import ServiceFab from "@/components/ServiceFab";
import Confetti from "@/components/Confetti";
import AmbientBackground from "@/components/AmbientBackground";
import NoSessionCard from "@/components/NoSessionCard";
import { useNow } from "@/lib/useNow";
import { getLanguage, getSession } from "@/lib/local";
import { makeT } from "@/lib/i18n";
import { rupees } from "@/lib/format";
import type { Order, OrderStatus, ServiceRequest, ServiceType } from "@/lib/types";

const TYPE_EMOJI: Record<ServiceType, string> = {
  water: "💧",
  napkin: "🧻",
  bowl: "🥣",
  spoon: "🥄",
  waiter: "🔔",
  highchair: "🪑",
  clean: "🧹",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  placed: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  preparing: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  ready: "bg-green-500/20 text-green-400 border border-green-500/30",
  served: "bg-white/10 text-muted-foreground border border-white/10",
};

const STATUS_KEY: Record<OrderStatus, "stepPlaced" | "stepKitchen" | "stepReady" | "stepServed"> = {
  placed: "stepPlaced",
  preparing: "stepKitchen",
  ready: "stepReady",
  served: "stepServed",
};

export default function Track() {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const lang = getLanguage();
  const t = useMemo(() => makeT(lang), [lang]);
  const now = useNow(1000);
  const [params] = useSearchParams();
  const [celebrate, setCelebrate] = useState(() => params.get("celebrate") === "1");

  const ordersQuery = useQuery({
    queryKey: ["orders", session?.id],
    queryFn: () => apiGet<Order[]>(`/orders/${session!.id}`),
    enabled: !!session,
    refetchInterval: 2500,
  });

  const serviceQuery = useQuery({
    queryKey: ["service-requests", session?.id],
    queryFn: () => apiGet<ServiceRequest[]>(`/service-requests/${session!.id}`),
    enabled: !!session,
    refetchInterval: 3000,
  });

  const orders = ordersQuery.data ?? [];
  const activeOrders = orders.filter((o) => o.status !== "served");
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((acc, it) => acc + it.qty, 0), 0);
  const totalAmount = orders.reduce((s, o) => s + o.subtotal, 0);

  const activeRequests = (serviceQuery.data ?? []).filter((r) => r.status !== "resolved");

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AmbientBackground />

      {/* Header */}
      <header className="glass-header sticky top-0 z-40 border-b border-white/[0.08]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-white/10 bg-white/[0.03]"
              onClick={() => navigate("/menu")}
              data-testid="track-back-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-lg font-black tracking-tight text-white sm:text-xl">
                {t("liveOrders")}
              </h1>
              {session && (
                <p className="text-xs text-muted-foreground">
                  Table {session.table_id} • {orders.length} KOT Records
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-xl border-white/15 bg-white/[0.03] px-4 font-bold hover:bg-white/[0.07]"
              onClick={() => navigate("/menu")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("browseMenu")}</span>
            </Button>

            <Button
              size="sm"
              className="h-10 gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 font-extrabold text-black shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400"
              onClick={() => navigate("/bill")}
              data-testid="track-bill-button"
            >
              <Receipt className="h-4 w-4" />
              <span>{t("viewBill")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!session ? (
          <div className="mx-auto max-w-md pt-8">
            <NoSessionCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Orders List & Kitchen Steppers */}
            <div className="space-y-6 lg:col-span-8">
              {/* Animated Live Kitchen Hero Graphic */}
              <div className="glass-card relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-5">
                    {/* Animated Chef Hat with Steam Rising Graphics */}
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
                      {/* Movable Steam Particles */}
                      <span className="animate-steam-1 absolute -top-2 left-4 text-xs">♨️</span>
                      <span className="animate-steam-2 absolute -top-3 left-7 text-xs">♨️</span>
                      <span className="animate-steam-3 absolute -top-2 left-10 text-xs">♨️</span>
                      <ChefHat className="h-8 w-8" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 items-center gap-1 rounded-full bg-green-500/20 px-2 text-[10px] font-bold text-green-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                          Kitchen Live
                        </span>
                        <span className="text-xs text-muted-foreground">Direct KOT Terminal</span>
                      </div>
                      <h2 className="mt-1 font-heading text-xl font-bold text-white sm:text-2xl">
                        {activeOrders.length > 0 ? "Preparing Your Fresh Dishes" : "All Dishes Served & Enjoyed"}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Real-time status synced with kitchen display system.
                      </p>
                    </div>
                  </div>

                  {/* Quick Counters */}
                  <div className="flex items-center gap-4 border-t border-white/[0.08] pt-4 sm:border-t-0 sm:pt-0">
                    <div className="text-center sm:text-right">
                      <span className="block text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Active KOTs</span>
                      <span className="font-heading text-2xl font-black text-amber-400">{activeOrders.length}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-center sm:text-right">
                      <span className="block text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Items</span>
                      <span className="font-heading text-2xl font-black text-white">{totalItems}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty Orders State */}
              {orders.length === 0 && !ordersQuery.isPending && (
                <div className="glass-card rounded-3xl border border-white/10 p-12 text-center" data-testid="track-empty">
                  <Utensils className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 text-lg font-bold text-white">{t("noOrders")}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">You haven't placed any dishes to the kitchen yet.</p>
                  <Button
                    className="mt-6 h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 font-bold text-black shadow-lg shadow-amber-500/20"
                    onClick={() => navigate("/menu")}
                    data-testid="track-browse-menu-button"
                  >
                    {t("browseMenu")}
                  </Button>
                </div>
              )}

              {/* Orders List */}
              <div className="space-y-6" data-testid="track-orders">
                {orders.map((order) => {
                  const seats = [...new Set(order.items.map((i) => i.seat))].sort((a, b) => a - b);
                  return (
                    <section
                      key={order.id}
                      className="glass-card overflow-hidden rounded-3xl border border-white/10 p-6 shadow-xl transition-all"
                      data-testid={`track-order-${order.kot_number}`}
                    >
                      {/* KOT Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                        <div className="flex items-center gap-3">
                          <Badge className="h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 font-heading text-sm font-black text-amber-400">
                            {order.kot_number}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <span
                          className={`rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_CLASS[order.status]}`}
                          data-testid={`track-status-${order.kot_number}`}
                        >
                          {t(STATUS_KEY[order.status])}
                        </span>
                      </div>

                      {/* Stepper Progress Section */}
                      <div className="my-5 rounded-2xl border border-white/[0.04] bg-white/[0.015] p-4">
                        <OrderStepper order={order} t={t} />
                      </div>

                      {/* Seat-wise Item Breakdown */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold uppercase tracking-wider">Itemized KOT Dishes</span>
                          <span>Seats: {seats.map((s) => `S${s}`).join(", ")}</span>
                        </div>

                        <div className="space-y-2.5">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-[10px] font-bold text-amber-400">
                                  S{it.seat}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">
                                      {it.qty}x {it.name[lang]}
                                    </span>
                                    {it.spice && (
                                      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                                        🌶️ {it.spice}
                                      </span>
                                    )}
                                  </div>
                                  {(it.addons?.length > 0 || it.notes) && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {[...it.addons, it.notes].filter(Boolean).join(" • ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold text-amber-300 tabular-nums">
                                {rupees(it.line_total)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between border-t border-white/[0.06] pt-3 text-xs">
                          <span className="text-muted-foreground">KOT Subtotal</span>
                          <span className="font-bold text-foreground tabular-nums">
                            {rupees(order.subtotal)}
                          </span>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Right: Sidebar Summary & Waiter Actions */}
            <div className="space-y-6 lg:col-span-4">
              {/* Order Billing Summary Card */}
              <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl">
                <h3 className="font-heading text-base font-bold text-white">Table Dining Bill Summary</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Real-time total including taxes</p>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Dishes Ordered</span>
                    <span className="font-semibold text-foreground">{totalItems} items</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Active Orders Total</span>
                    <span className="font-semibold text-foreground tabular-nums">{rupees(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated GST (5%)</span>
                    <span className="font-semibold text-foreground tabular-nums">{rupees(Math.round(totalAmount * 0.05))}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.08] pt-2 text-sm font-bold text-foreground">
                    <span>Current Grand Total</span>
                    <span className="font-heading text-lg font-black text-amber-400 tabular-nums">
                      {rupees(totalAmount + Math.round(totalAmount * 0.05))}
                    </span>
                  </div>
                </div>

                <Button
                  className="mt-6 h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 font-extrabold text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400"
                  onClick={() => navigate("/bill")}
                >
                  <Receipt className="h-4 w-4" />
                  <span>{t("viewBill")} & Split Payment</span>
                </Button>
              </div>

              {/* Active Service Requests */}
              <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl">
                <h3 className="font-heading text-base font-bold text-white">Table Assistance</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Active waiter requests & live SLA</p>

                <div className="mt-4 space-y-2.5">
                  {activeRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
                      <p className="text-xs text-muted-foreground">No active calls. Need anything?</p>
                      <p className="text-[11px] text-amber-400 font-semibold mt-1">
                        Tap the floating bell icon at bottom-right.
                      </p>
                    </div>
                  ) : (
                    activeRequests.map((r) => {
                      const deadline = new Date(r.sla_deadline).getTime();
                      const leftSec = Math.max(0, Math.floor((deadline - now) / 1000));
                      const m = Math.floor(leftSec / 60);
                      const s = leftSec % 60;
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{TYPE_EMOJI[r.type] ?? "🔔"}</span>
                            <div>
                              <span className="font-bold text-foreground capitalize">{r.type}</span>
                              <span className="block text-[10px] text-muted-foreground">Staff Dispatched</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-amber-400">
                              {m}:{String(s).padStart(2, "0")}
                            </span>
                            <span className="block text-[9px] text-muted-foreground">SLA timer</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Waiter Call FAB */}
      {session && <ServiceFab sessionId={session.id} lang={lang} t={t} />}

      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
}

export { Track };
