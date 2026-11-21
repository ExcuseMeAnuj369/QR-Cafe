import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Sparkles, X, Utensils, Flame, Users, Link2 } from "lucide-react";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import MenuItemCard from "@/components/MenuItemCard";
import CustomizationSheet, { type CustomizeOpts } from "@/components/CustomizationSheet";
import CartSheet from "@/components/CartSheet";
import DesktopCartPanel from "@/components/DesktopCartPanel";
import GroupModal from "@/components/GroupModal";
import ServiceFab from "@/components/ServiceFab";
import Confetti from "@/components/Confetti";
import AmbientBackground from "@/components/AmbientBackground";
import { MenuListSkeleton } from "@/components/MenuSkeleton";
import NoSessionCard from "@/components/NoSessionCard";
import { useCart } from "@/lib/cart";
import { getLanguage, getSession, saveLanguage } from "@/lib/local";
import { makeT } from "@/lib/i18n";
import { rupees } from "@/lib/format";
import type { Lang, MenuCategory, MenuItem, Order, OrderItemIn, QRDSession } from "@/lib/types";

const CATEGORIES: { id: "all" | MenuCategory; key: `cat_${MenuCategory}` | "all"; icon: string }[] = [
  { id: "all", key: "all", icon: "✨" },
  { id: "starters", key: "cat_starters", icon: "🥟" },
  { id: "mains", key: "cat_mains", icon: "🍛" },
  { id: "breads", key: "cat_breads", icon: "🫓" },
  { id: "drinks", key: "cat_drinks", icon: "🍹" },
  { id: "desserts", key: "cat_desserts", icon: "🍨" },
  { id: "kids", key: "cat_kids", icon: "🍟" },
];

export default function Menu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<QRDSession | null>(() => getSession());
  const [lang, setLang] = useState<Lang>(() => getLanguage());
  const t = useMemo(() => makeT(lang), [lang]);
  const cart = useCart();

  const [category, setCategory] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [lastSeat, setLastSeat] = useState(1);
  const [celebrate, setCelebrate] = useState(false);

  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiGet<MenuItem[]>("/menu"),
    refetchInterval: 4000,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", session?.id],
    queryFn: () => apiGet<Order[]>(`/orders/${session!.id}`),
    enabled: !!session,
    refetchInterval: 2500,
  });

  const activeOrders = (ordersQuery.data ?? []).filter((o) => o.status !== "served").length;

  const placeOrder = useMutation({
    mutationFn: (data: { items: OrderItemIn[]; advance_paid?: number; advance_payment_id?: string }) =>
      apiPost<Order>("/order", {
        session_id: session!.id,
        idempotency_key: crypto.randomUUID(),
        items: data.items,
        advance_paid: data.advance_paid,
        advance_payment_id: data.advance_payment_id,
      }),
    onSuccess: (order) => {
      cart.clear();
      setCartOpen(false);
      setCelebrate(true);
      toast.success(`${t("orderPlacedToast")} ${order.kot_number}`);
      order.warnings?.forEach((w) => toast.warning(w));
      order.rejected?.forEach((r) =>
        toast.error(`${r.name}: ${r.reason === "sold_out" ? t("soldOut") : r.reason}`)
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      setTimeout(() => navigate("/track"), 1100);
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        const detail = (e.body as { detail?: { message?: string } | string } | null)?.detail;
        if (typeof detail === "object" && detail?.message) toast.error(detail.message);
        else if (e.status === 410) toast.error(t("qrExpired"));
        else toast.error(t("rejectedToast"));
      } else {
        toast.error(t("rejectedToast"));
      }
    },
  });

  const items = menuQuery.data ?? [];
  const filtered = items.filter((it) => {
    if (category !== "all" && it.category !== category) return false;
    if (vegOnly && !it.veg) return false;
    if (bestsellerOnly && !it.tags.includes("bestseller")) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !it.name.en.toLowerCase().includes(q) &&
        !it.name.hi.includes(search.trim()) &&
        !it.name.mr.includes(search.trim())
      )
        return false;
    }
    return true;
  });

  const inCartOf = (itemId: string) =>
    cart.lines.filter((l) => l.item.id === itemId).reduce((s, l) => s + l.qty, 0);
  const qtyOf = (itemId: string) => inCartOf(itemId);
  const stockLeftOf = (item: MenuItem) =>
    item.stock === null ? null : Math.max(0, item.stock - inCartOf(item.id));

  const quickAdd = (item: MenuItem) => {
    const stockLeft = stockLeftOf(item);
    if (stockLeft !== null && stockLeft <= 0) {
      toast.info(t("onlyNLeft", { n: 0 }));
      return;
    }
    const n = cart.add(item, { qty: 1, spice: null, addon_ids: [], notes: null, seat: lastSeat });
    toast.success(t("addedToast", { n, name: item.name[lang] }));
  };

  const removeOne = (item: MenuItem) => {
    const lines = cart.lines.filter((l) => l.item.id === item.id);
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    cart.setQty(last.key, last.qty - 1);
  };

  const submitCustomize = (item: MenuItem, opts: CustomizeOpts) => {
    const stockLeft = stockLeftOf(item);
    if (stockLeft !== null && opts.qty > stockLeft) {
      toast.warning(t("onlyNLeft", { n: stockLeft }));
      return;
    }
    const n = cart.add(item, opts);
    setLastSeat(opts.seat);
    toast.success(t("addedToast", { n, name: item.name[lang] }));
    setCustomizeOpen(false);
  };

  const cycleLang = () => {
    if (!session) return;
    const order: Lang[] = ["en", "hi", "mr"];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang(next);
    saveLanguage(next);
    setSession({ ...session, language: next });
    apiPatch(`/session/${session.id}`, { language: next }).catch(() => {});
  };

  const handlePlace = (advancePaid?: number, advancePaymentId?: string) => {
    if (!session || cart.lines.length === 0) return;
    placeOrder.mutate({
      items: cart.lines.map((l) => ({
        item_id: l.item.id,
        qty: l.qty,
        spice: l.spice,
        addon_ids: l.addon_ids,
        notes: l.notes,
        seat: l.seat,
      })),
      advance_paid: advancePaid,
      advance_payment_id: advancePaymentId,
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AmbientBackground />

      <Header
        tableId={session?.table_id ?? "T-04"}
        sessionCode={session?.code ?? null}
        groupId={session?.group_id}
        linkedTableId={session?.linked_table_id}
        activeOrders={activeOrders}
        lang={lang}
        t={t}
        onLangCycle={cycleLang}
        onOpenCart={() => setCartOpen(true)}
        onOpenGroup={() => setGroupModalOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {!session ? (
          <div className="mx-auto max-w-md pt-12">
            <NoSessionCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left / Main Menu Column */}
            <div className="lg:col-span-8 xl:col-span-8">
              {/* Table Merging Group Banner */}
              {session.group_id || session.linked_table_id ? (
                <div
                  className="glass-card mb-6 overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-900/30 via-purple-950/20 to-black/60 p-5 shadow-xl backdrop-blur-xl"
                  data-testid="group-table-banner"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/15 border border-purple-500/40 text-purple-300 shadow-md">
                        <Users className="h-6 w-6" />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-white text-base">Group Dining Active</span>
                          <span className="rounded-full bg-purple-500/30 border border-purple-400/30 px-2 py-0.5 text-[10px] font-black uppercase text-purple-200">
                            Merged Table
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-purple-200/80">
                          <span className="font-bold text-white">Table {session.table_id}</span>
                          {session.linked_table_id ? (
                            <>
                              <span className="mx-1.5 text-purple-400">⇄</span>
                              <span className="font-bold text-purple-200">Table {session.linked_table_id}</span>
                            </>
                          ) : null}
                          {session.group_id ? (
                            <>
                              <span className="mx-1.5 text-white/30">•</span>
                              <span>Group <strong className="font-mono text-purple-200">#{session.group_id}</strong></span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGroupModalOpen(true)}
                        className="h-9 shrink-0 gap-1.5 rounded-xl border-purple-500/40 bg-purple-500/20 px-3 text-xs font-bold text-purple-200 hover:bg-purple-500/30 active:scale-95 transition-all"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Manage Group</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/bill")}
                        className="h-9 shrink-0 rounded-xl border-white/20 bg-white/[0.04] px-3 text-xs font-bold text-white hover:bg-white/[0.08]"
                      >
                        View Bill
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card mb-6 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <span className="text-base">👥</span>
                    <span>Dining with friends at another table? Merge your carts and bill in 1 click!</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupModalOpen(true)}
                    className="h-8 gap-1.5 rounded-xl border-purple-500/40 bg-purple-500/10 px-3 text-xs font-bold text-purple-300 hover:bg-purple-500/20 active:scale-95"
                  >
                    <span>🔗 Link Table / Group</span>
                  </Button>
                </div>
              )}

              {/* Host & Guest Seat Selector Toggle Bar */}
              {(() => {
                const isGroupActive = !!(session.group_id || session.linked_table_id);
                const seatsList = isGroupActive
                  ? [
                      { id: 1, table: session.table_id || "T-04", chair: 1, label: `T-${session.table_id || "04"} • Chair 1 (You)`, fullLabel: `Table ${session.table_id || "T-04"} • Chair 1 (You)`, isHost: true, isLinked: false },
                      { id: 2, table: session.table_id || "T-04", chair: 2, label: `T-${session.table_id || "04"} • Chair 2 (Guest)`, fullLabel: `Table ${session.table_id || "T-04"} • Chair 2 (Guest)`, isHost: false, isLinked: false },
                      { id: 3, table: session.linked_table_id || "T-05", chair: 1, label: `T-${session.linked_table_id || "05"} • Chair 1`, fullLabel: `Table ${session.linked_table_id || "T-05"} • Chair 1 (Friend)`, isHost: false, isLinked: true },
                      { id: 4, table: session.linked_table_id || "T-05", chair: 2, label: `T-${session.linked_table_id || "05"} • Chair 2`, fullLabel: `Table ${session.linked_table_id || "T-05"} • Chair 2 (Guest)`, isHost: false, isLinked: true },
                    ]
                  : Array.from({ length: session.seats_count || session.party_size || 3 }, (_, i) => ({
                      id: i + 1,
                      table: session.table_id || "T-04",
                      chair: i + 1,
                      label: i === 0 ? "Chair 1 (Me)" : `Chair ${i + 1} (Guest)`,
                      fullLabel: i === 0 ? "Chair 1 (Me - Host)" : `Chair ${i + 1} (Guest)`,
                      isHost: i === 0,
                      isLinked: false,
                    }));

                const activeSeatObj = seatsList.find((x) => x.id === lastSeat) || seatsList[0];

                return (
                  <div
                    className="glass-card mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-lg backdrop-blur-md"
                    data-testid="host-seat-selector-bar"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                          <Users className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Ordering Party Seats</span>
                            {isGroupActive && (
                              <span className="rounded bg-purple-500/30 border border-purple-400/30 px-1.5 py-0.2 text-[9px] font-black uppercase text-purple-200">
                                4 Seats Across 2 Tables
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            {isGroupActive
                              ? "Tap any chair across Table T-04 or T-05 to add food for that specific diner:"
                              : "Tap a chair below to order food for yourself or a guest:"}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 w-fit">
                        <span>Active:</span>
                        <span className="text-white">{activeSeatObj?.fullLabel}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {seatsList.map((st) => {
                        const isSelected = lastSeat === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setLastSeat(st.id);
                              toast.info(`Now adding dishes for: ${st.fullLabel}`);
                            }}
                            data-selected={isSelected}
                            data-testid={`seat-toggle-${st.id}`}
                            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                              isSelected
                                ? "border border-amber-500 bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                                : st.isLinked
                                ? "border border-purple-500/30 bg-purple-500/10 text-purple-200 hover:border-purple-500/50 hover:bg-purple-500/20"
                                : "border border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/25 hover:text-white"
                            }`}
                          >
                            <span className="text-sm">{st.isHost ? "👑" : "👤"}</span>
                            <span>{st.label}</span>
                            {isSelected && (
                              <span className="ml-1 rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-black">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Luxury Welcome Banner */}
              <div className="glass-card relative mb-6 overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 text-[11px] font-bold text-amber-400">
                        <Sparkles className="h-3 w-3" /> Table {session.table_id} Live Menu
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">• Trilingual Ordering</span>
                    </div>
                    <h1 className="mt-2 font-heading text-2xl font-black tracking-tight text-white sm:text-3xl">
                      Crafted for Exquisite Dining
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      Order per seat in English, हिन्दी, or मराठी. Track your live KOT kitchen prep in real-time.
                    </p>
                  </div>
                  {activeOrders > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => navigate("/track")}
                      className="h-10 shrink-0 gap-2 rounded-xl border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-400 hover:bg-amber-500/20"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                      </span>
                      <span>{activeOrders} Active KOT Cooking</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Search & Filters Controls */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-10 pr-9 text-sm focus-visible:border-amber-500/50"
                    data-testid="menu-search-input"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Badges */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVegOnly((v) => !v)}
                    data-selected={vegOnly}
                    data-testid="veg-filter-pill"
                    className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold transition-all data-[selected=true]:border-green-500 data-[selected=true]:bg-green-500/20 data-[selected=true]:text-green-300 hover:border-white/20"
                  >
                    <span>🟢</span>
                    <span>{t("vegOnly")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBestsellerOnly((b) => !b)}
                    data-selected={bestsellerOnly}
                    className="flex h-12 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold transition-all data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-500/20 data-[selected=true]:text-amber-300 hover:border-white/20"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Popular</span>
                  </button>
                </div>
              </div>

              {/* Category Pills Bar */}
              <div
                className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin [scrollbar-width:none]"
                data-testid="category-pills"
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    data-selected={category === c.id}
                    data-testid={`category-pill-${c.id}`}
                    className="flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold transition-all hover:bg-white/[0.06] data-[selected=true]:border-amber-500/60 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-amber-500 data-[selected=true]:to-amber-600 data-[selected=true]:text-black data-[selected=true]:shadow-md data-[selected=true]:shadow-amber-500/20"
                  >
                    <span>{c.icon}</span>
                    <span>{t(c.key)}</span>
                  </button>
                ))}
              </div>

              {/* Food Items Responsive Grid */}
              <div>
                {menuQuery.isPending ? (
                  <MenuListSkeleton />
                ) : menuQuery.isError ? (
                  <div className="glass-card rounded-3xl border border-white/10 p-12 text-center" data-testid="menu-error">
                    <p className="text-base text-muted-foreground">{t("menuError")}</p>
                    <Button
                      variant="outline"
                      className="mt-4 h-11 border-white/20 px-6 font-bold"
                      onClick={() => menuQuery.refetch()}
                      data-testid="menu-error-retry-button"
                    >
                      {t("retryScan")}
                    </Button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="glass-card rounded-3xl border border-white/10 p-12 text-center" data-testid="menu-no-results">
                    <Utensils className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-base font-bold text-foreground">No dishes found</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try clearing your search query or dietary filter.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 border-white/15"
                      onClick={() => {
                        setSearch("");
                        setVegOnly(false);
                        setBestsellerOnly(false);
                        setCategory("all");
                      }}
                    >
                      Reset All Filters
                    </Button>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    data-testid="menu-list"
                  >
                    {filtered.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        t={t}
                        qty={qtyOf(item.id)}
                        stockLeft={stockLeftOf(item)}
                        onQuickAdd={() => quickAdd(item)}
                        onRemoveOne={() => removeOne(item)}
                        onCustomize={() => {
                          setCustomizeItem(item);
                          setCustomizeOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Desktop Cart Panel (Desktop Only) */}
            <div className="hidden lg:col-span-4 lg:block xl:col-span-4">
              <DesktopCartPanel
                session={session}
                lang={lang}
                t={t}
                placing={placeOrder.isPending}
                onPlace={handlePlace}
                selectedSeat={lastSeat}
                onSelectSeat={setLastSeat}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Floating Cart Bar (Mobile Only) */}
      {session && cart.count > 0 && (
        <div
          className="glass-cartbar fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-amber-500/40 px-5 py-3.5 shadow-2xl lg:hidden"
          data-testid="cart-bar"
        >
          <div>
            <p className="text-sm font-bold text-foreground" data-testid="cart-bar-count">
              🛒 {cart.count} {t("items")}
            </p>
            <p className="text-xs font-semibold text-amber-400 tabular-nums" data-testid="cart-bar-subtotal">
              {rupees(cart.subtotal)}
            </p>
          </div>
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 font-extrabold text-black shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
            onClick={() => setCartOpen(true)}
            data-testid="cart-bar-open-button"
          >
            {t("viewCart")} →
          </Button>
        </div>
      )}

      {/* Floating Waiter Call FAB */}
      {session && <ServiceFab sessionId={session.id} lang={lang} t={t} raised={cart.count > 0} />}

      {/* Modals & Sheets */}
      <CustomizationSheet
        item={customizeItem}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        lang={lang}
        t={t}
        defaultSeat={lastSeat}
        onSubmit={(opts) => customizeItem && submitCustomize(customizeItem, opts)}
      />
      <CartSheet
        session={session}
        open={cartOpen}
        onOpenChange={setCartOpen}
        lang={lang}
        t={t}
        placing={placeOrder.isPending}
        onPlace={handlePlace}
      />
      <GroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        session={session}
        onSessionUpdated={(updated) => setSession(updated)}
      />
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
}

export { Menu };
