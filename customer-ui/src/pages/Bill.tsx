import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  Loader2,
  MessageCircle,
  ShieldCheck,
  XCircle,
  QrCode,
  Receipt,
  Users,
  CreditCard,
  ChefHat,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Smartphone,
  Copy,
  Check,
  Tag,
  Bell,
  Wallet,
  Clock,
  Heart,
  Store,
  DollarSign
} from "lucide-react";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Confetti from "@/components/Confetti";
import GroupModal from "@/components/GroupModal";
import AmbientBackground from "@/components/AmbientBackground";
import NoSessionCard from "@/components/NoSessionCard";
import { getLanguage, getSession } from "@/lib/local";
import { makeT } from "@/lib/i18n";
import { rupees } from "@/lib/format";
import type { Bill, PaymentResult, SplitPaymentCreate, VerifyResult } from "@/lib/types";

interface PayTarget {
  label: string;
  amount: number;
  payload: SplitPaymentCreate;
}

interface SplitParticipant {
  id: string;
  table_id: string;
  chair_id: number;
  label: string;
  amount: number; // in paise
  isLocked: boolean;
  paid: boolean;
}

export default function BillPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session] = useState(() => getSession());
  const lang = getLanguage();
  const t = useMemo(() => makeT(lang), [lang]);

  const [mode, setMode] = useState<"custom" | "equal" | "by_seat">("custom");
  const [splitScope, setSplitScope] = useState<"table" | "group">("table");
  const [shares, setShares] = useState(2);
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [tipPaise, setTipPaise] = useState<number>(0);
  const [selectedPayMethod, setSelectedPayMethod] = useState<"upi_apps" | "upi_qr" | "cards">("upi_apps");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("gpay");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(299);

  const [verifyCode, setVerifyCode] = useState("");
  const [verifyState, setVerifyState] = useState<{ ok: boolean; result?: VerifyResult } | null>(null);
  const [showGroupLines, setShowGroupLines] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Dynamic Custom Split Participants with Auto-Rebalancing
  const [participants, setParticipants] = useState<SplitParticipant[]>([]);

  const billQuery = useQuery({
    queryKey: ["bill", session?.id],
    queryFn: () => apiGet<Bill>(`/bill/${session!.id}`),
    enabled: !!session,
    refetchInterval: 3000,
  });
  const bill = billQuery.data;

  const isGrouped = !!(bill?.group_id || session?.group_id);
  const currentTableId = bill?.table_id || session?.table_id || "T-04";
  const linkedTableId = bill?.linked_table_id || session?.linked_table_id || "T-05";

  // Target amount to split based on scope (incorporates Cashier discount)
  const targetTotalPaise = useMemo(() => {
    if (!bill) return 0;
    if (splitScope === "group" && isGrouped) {
      return bill.group_total || bill.grand_total + 52000;
    }
    return bill.balance;
  }, [bill, splitScope, isGrouped]);

  // Build default active participants across group or table
  const defaultParticipantsList = useMemo<SplitParticipant[]>(() => {
    if (!bill) return [];

    if (splitScope === "group" && isGrouped) {
      // 4 Chairs across both merged tables
      return [
        {
          id: `${currentTableId}-1`,
          table_id: currentTableId,
          chair_id: 1,
          label: `Table ${currentTableId} · Chair 1 (You - Host)`,
          amount: 0,
          isLocked: false,
          paid: false,
        },
        {
          id: `${currentTableId}-2`,
          table_id: currentTableId,
          chair_id: 2,
          label: `Table ${currentTableId} · Chair 2 (Guest)`,
          amount: 0,
          isLocked: false,
          paid: false,
        },
        {
          id: `${linkedTableId}-1`,
          table_id: linkedTableId,
          chair_id: 1,
          label: `Table ${linkedTableId} · Chair 1 (Friend)`,
          amount: 0,
          isLocked: false,
          paid: false,
        },
        {
          id: `${linkedTableId}-2`,
          table_id: linkedTableId,
          chair_id: 2,
          label: `Table ${linkedTableId} · Chair 2 (Friend Guest)`,
          amount: 0,
          isLocked: false,
          paid: false,
        },
      ];
    } else {
      // Table-specific chairs
      const claimedChairs = session?.claimed_chairs || [1, 2];
      return claimedChairs.map((c) => ({
        id: `${currentTableId}-${c}`,
        table_id: currentTableId,
        chair_id: c,
        label: c === 1 ? `Table ${currentTableId} · Chair 1 (You - Host)` : `Table ${currentTableId} · Chair ${c} (Guest)`,
        amount: 0,
        isLocked: false,
        paid: false,
      }));
    }
  }, [bill, splitScope, isGrouped, currentTableId, linkedTableId, session?.claimed_chairs]);

  // Initialize or re-divide participants when target total or scope changes
  useEffect(() => {
    if (!targetTotalPaise || defaultParticipantsList.length === 0) {
      setParticipants([]);
      return;
    }

    const count = defaultParticipantsList.length;
    const baseAmount = Math.floor(targetTotalPaise / (count * 100)) * 100;
    const initialParticipants = defaultParticipantsList.map((p, idx) => {
      const share = idx === count - 1 ? targetTotalPaise - baseAmount * (count - 1) : baseAmount;
      return {
        ...p,
        amount: Math.max(0, share),
        isLocked: false,
      };
    });

    setParticipants(initialParticipants);
    setShares(count);
  }, [targetTotalPaise, defaultParticipantsList]);

  // QR countdown timer effect
  useEffect(() => {
    if (!payTarget) return;
    setQrSecondsLeft(299);
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [payTarget]);

  // Core Smart Auto-Rebalancing Algorithm
  const updateParticipantAmount = (targetId: string, newAmountPaise: number) => {
    if (participants.length <= 1) return;
    const totalPaise = targetTotalPaise;
    const clampedNew = Math.max(0, Math.min(totalPaise, Math.round(newAmountPaise / 100) * 100));

    const currentP = participants.find((p) => p.id === targetId);
    if (!currentP) return;

    const delta = clampedNew - currentP.amount;
    if (delta === 0) return;

    const otherUnlocked = participants.filter((p) => p.id !== targetId && !p.isLocked);
    if (otherUnlocked.length === 0) {
      toast.info("Unlock at least one other participant to rebalance the total!", {
        description: "Click the 🔒 icon on another seat to allow dynamic balancing.",
      });
      return;
    }

    let remainingToDistribute = -delta;
    const updated = participants.map((p) => ({ ...p }));
    const target = updated.find((p) => p.id === targetId)!;
    target.amount = clampedNew;

    let activeOthers = updated.filter((p) => p.id !== targetId && !p.isLocked);

    while (Math.abs(remainingToDistribute) >= 100 && activeOthers.length > 0) {
      const sharePerPerson = Math.trunc(remainingToDistribute / activeOthers.length / 100) * 100;

      if (sharePerPerson === 0) {
        const step = remainingToDistribute > 0 ? 100 : -100;
        for (const p of activeOthers) {
          if (remainingToDistribute === 0) break;
          if (p.amount + step >= 0) {
            p.amount += step;
            remainingToDistribute -= step;
          }
        }
        break;
      }

      const nextActive: typeof activeOthers = [];
      for (const p of activeOthers) {
        const potential = p.amount + sharePerPerson;
        if (potential < 0) {
          remainingToDistribute += p.amount;
          p.amount = 0;
        } else {
          p.amount = potential;
          remainingToDistribute -= sharePerPerson;
          nextActive.push(p);
        }
      }

      if (nextActive.length === activeOthers.length) {
        break;
      }
      activeOthers = nextActive;
    }

    // Checksum guarantee: sum strictly equals targetTotalPaise
    const currentSum = updated.reduce((s, p) => s + p.amount, 0);
    const checksumDiff = totalPaise - currentSum;
    if (checksumDiff !== 0) {
      const receiver =
        updated.find((p) => p.id !== targetId && !p.isLocked && p.amount + checksumDiff >= 0) ||
        updated.find((p) => p.id !== targetId && !p.isLocked);
      if (receiver) {
        receiver.amount = Math.max(0, receiver.amount + checksumDiff);
      }
    }

    setParticipants(updated);
  };

  const adjustByStep = (id: string, deltaPaise: number) => {
    const p = participants.find((item) => item.id === id);
    if (p) {
      updateParticipantAmount(id, p.amount + deltaPaise);
    }
  };

  const toggleLock = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isLocked: !p.isLocked } : p))
    );
  };

  const resetToEqual = () => {
    if (!targetTotalPaise || participants.length === 0) return;
    const count = participants.length;
    const base = Math.floor(targetTotalPaise / (count * 100)) * 100;
    setParticipants((prev) =>
      prev.map((p, idx) => ({
        ...p,
        amount: idx === count - 1 ? targetTotalPaise - base * (count - 1) : base,
        isLocked: false,
      }))
    );
    toast.success("Split reset to equal shares!");
  };

  const currentSplitSum = useMemo(
    () => participants.reduce((acc, p) => acc + p.amount, 0),
    [participants]
  );
  const isSplitBalanced = Math.abs(currentSplitSum - targetTotalPaise) < 100;

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: async (p: SplitPaymentCreate) => {
      await new Promise((r) => setTimeout(r, 1000));
      return apiPost<PaymentResult>("/split-payment", p);
    },
    onSuccess: (res) => {
      setPayTarget(null);
      setTipPaise(0);
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      if (res.complete) {
        setCelebrate(true);
        toast.success(t("tablePaid"));
      } else {
        toast.success(t("paymentSuccess"));
      }
    },
    onError: (e) => {
      setPayTarget(null);
      if (e instanceof ApiError) {
        const detail = (e.body as { detail?: string } | null)?.detail;
        toast.error(typeof detail === "string" ? detail : "Payment failed");
      } else toast.error("Payment failed");
    },
  });

  // Enable/Lock Counter Pay by Cashier Counter
  const enableCheckoutMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiPost<Bill>(`/bill/${session!.id}/enable-checkout`, { enabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["bill", session?.id], updated);
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      if (updated.checkout_enabled) {
        toast.success("Counter payment unlocked! Counter QR & Cash settlement enabled.");
      } else {
        toast.info("Counter settlement reset. Online Phone UPI remains active.");
      }
    },
  });

  // Cashier Discount mutation
  const cashierDiscountMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      apiPost<Bill>(`/bill/${session!.id}/cashier-discount`, { amount, reason }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["bill", session?.id], updated);
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      if ((updated.discount_amount ?? 0) > 0) {
        toast.success(`Cashier applied ₹${(updated.discount_amount! / 100).toFixed(0)} discount! (Manager PIN #4812 Approved)`);
      } else {
        toast.info("Cashier discount removed.");
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) => apiGet<VerifyResult>(`/verify/${encodeURIComponent(code)}`),
    onSuccess: (r) => setVerifyState({ ok: true, result: r }),
    onError: () => setVerifyState({ ok: false }),
  });

  const grand = bill?.grand_total ?? 0;
  const baseEqualShare = bill ? Math.floor(grand / shares) : 0;
  const equalShareAmount = (i: number) =>
    i === shares - 1 ? grand - baseEqualShare * (shares - 1) : baseEqualShare;
  const paidShares = bill?.equal?.shares_paid ?? 0;
  const paidSeats = bill?.seats.filter((s) => s.paid).length ?? 0;

  const openPay = (label: string, amount: number, payload: SplitPaymentCreate) => {
    setTipPaise(0);
    setPayTarget({ label, amount, payload });
  };

  const copyUpiId = () => {
    navigator.clipboard?.writeText("qrcafe.pay@icici");
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const isCounterPayEnabled = bill?.checkout_enabled ?? false;
  const hasCashierDiscount = (bill?.discount_amount ?? 0) > 0;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AmbientBackground />

      {/* Header */}
      <header className="glass-header sticky top-0 z-40 border-b border-white/[0.08]">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-white/10 bg-white/[0.03]"
              onClick={() => navigate("/menu")}
              data-testid="bill-back-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-base sm:text-xl font-black tracking-tight text-white">
                {t("bill")} & Checkout
              </h1>
              {bill && (
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Table {bill.table_id} • {bill.lines.length} {t("items")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 sm:h-10 gap-1.5 rounded-xl border-white/15 bg-white/[0.03] px-3 sm:px-4 text-xs font-bold hover:bg-white/[0.07]"
              onClick={() => navigate("/menu")}
              data-testid="bill-menu-button"
            >
              <ChefHat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t("browseMenu")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* STAFF & CASHIER TERMINAL SIMULATOR BAR */}
      <div className="border-b border-amber-500/20 bg-amber-500/[0.04] py-2 px-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-black text-amber-300 uppercase tracking-wider text-[10px]">
              Cashier & POS Authority Simulator:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Cashier Discount Toggle */}
            <button
              type="button"
              onClick={() => {
                if (hasCashierDiscount) {
                  cashierDiscountMutation.mutate({ amount: 0, reason: "" });
                } else {
                  cashierDiscountMutation.mutate({
                    amount: 10000, // ₹100
                    reason: "Manager Courtesy Discount (PIN #4812 Approved)",
                  });
                }
              }}
              disabled={cashierDiscountMutation.isPending}
              className={`rounded-lg border px-2.5 py-1 font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                hasCashierDiscount
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                  : "border-white/15 bg-white/[0.04] text-muted-foreground hover:text-white"
              }`}
            >
              <Tag className="h-3 w-3" />
              <span>
                {hasCashierDiscount
                  ? "🏷️ Cashier Discount: -₹100 (Click to Remove)"
                  : "🏷️ Cashier: Apply ₹100 Discount (Manager PIN)"}
              </span>
            </button>

            {/* Counter QR & Cash Toggle */}
            <button
              type="button"
              onClick={() => enableCheckoutMutation.mutate(!isCounterPayEnabled)}
              disabled={enableCheckoutMutation.isPending}
              className={`rounded-lg border px-2.5 py-1 font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                isCounterPayEnabled
                  ? "border-green-500/50 bg-green-500/20 text-green-300"
                  : "border-white/15 bg-white/[0.04] text-muted-foreground hover:text-white"
              }`}
            >
              <QrCode className="h-3 w-3" />
              <span>
                {isCounterPayEnabled
                  ? "✓ Counter QR & Cash: Active (Click to Lock)"
                  : "🔒 Counter QR & Cash: Off (Click to Enable)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!session ? (
          <div className="mx-auto max-w-md pt-8">
            <NoSessionCard />
          </div>
        ) : billQuery.isPending ? (
          <div className="shimmer h-96 rounded-3xl bg-card" data-testid="bill-skeleton" />
        ) : billQuery.isError || !bill ? (
          <div className="glass-card rounded-3xl border border-white/10 p-8 text-center" data-testid="bill-error">
            <p className="text-sm text-muted-foreground">{t("menuError")}</p>
          </div>
        ) : bill.lines.length === 0 && !bill.receipt ? (
          <div className="glass-card rounded-3xl border border-white/10 p-8 sm:p-12 text-center" data-testid="bill-empty">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-base sm:text-lg font-bold text-white">{t("noOrders")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Order dishes first to generate an itemized table bill.</p>
            <Button
              className="mt-6 h-11 sm:h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 font-bold text-black"
              onClick={() => navigate("/menu")}
              data-testid="bill-browse-menu-button"
            >
              {t("browseMenu")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Table Merging Banner */}
            {(bill.group_id || session.group_id) && (
              <div
                className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-900/30 via-purple-950/20 to-black/60 p-4 sm:p-5 text-xs shadow-2xl backdrop-blur-xl"
                data-testid="bill-group-banner"
              >
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/15 border border-purple-500/40 text-purple-300 shadow-md">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-black" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h2 className="font-heading text-sm sm:text-base font-black text-white">Group Dining Active</h2>
                      <span className="rounded-full bg-purple-500/30 border border-purple-400/30 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-200">
                        Merged Table
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-purple-200/80 leading-relaxed">
                      Your table <span className="font-bold text-white">Table {bill.table_id}</span>
                      {bill.linked_table_id ? (
                        <> is linked with <span className="font-bold text-purple-200">Table {bill.linked_table_id}</span></>
                      ) : null}
                      {bill.group_id || session.group_id ? (
                        <> (Group ID: <span className="font-mono text-purple-200 font-bold">#{bill.group_id || session.group_id}</span>)</>
                      ) : null}
                      . All chairs are synchronized for split billing.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupModalOpen(true)}
                    className="h-8 sm:h-9 gap-1.5 rounded-xl border-purple-500/50 bg-purple-500/20 text-xs font-bold text-purple-200 hover:bg-purple-500/30 active:scale-95 transition-all"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Manage Group</span>
                  </Button>
                  <Badge variant="outline" className="border-purple-500/50 bg-purple-500/20 text-[11px] font-bold text-purple-200 px-2.5 py-1">
                    ● Linked
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12">
              {/* Left Column: Itemized KOT Bill & Tax Receipt */}
              <div className="space-y-6 lg:col-span-7">
                {/* Itemized Bill Card */}
                <section className="glass-card rounded-3xl border border-white/10 p-4 sm:p-7 shadow-xl" data-testid="bill-lines-card">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div>
                      <h2 className="font-heading text-base sm:text-lg font-bold text-white">Itemized Table Receipt</h2>
                      <p className="text-xs text-muted-foreground">Kitchen Order Tickets (KOT) breakdown</p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 text-xs">
                      Table {bill.table_id}
                    </Badge>
                  </div>

                  {/* Lines grouped by KOT */}
                  <div className="mt-5 space-y-4 sm:space-y-5">
                    {Object.entries(
                      bill.lines.reduce<Record<string, typeof bill.lines>>((acc, l) => {
                        (acc[l.kot_number] ??= []).push(l);
                        return acc;
                      }, {})
                    ).map(([kot, lines]) => (
                      <div key={kot} className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-3.5 sm:p-4" data-testid={`bill-kot-${kot}`}>
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2.5">
                          <span className="font-heading text-xs font-black uppercase tracking-wider text-amber-400">
                            {kot}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{lines.length} items</span>
                        </div>

                        <div className="space-y-2.5">
                          {lines.map((l, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 text-xs sm:text-sm" data-testid={`bill-line-${kot}-${i}`}>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">
                                  <span className="text-amber-400 tabular-nums">{l.qty}x</span> {l.name[lang]}
                                  <span className="ml-2 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                    {t("seatN", { n: l.seat })}
                                  </span>
                                </p>
                                {(l.spice || l.addons.length > 0 || l.notes) && (
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {[l.spice ? `🌶️ ${l.spice}` : null, ...l.addons, l.notes].filter(Boolean).join(" • ")}
                                  </p>
                                )}
                              </div>
                              <span className="font-bold tabular-nums text-foreground">
                                {rupees(l.line_total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tax Breakdown & Totals */}
                  <div className="mt-6 space-y-2.5 border-t border-white/[0.08] pt-4 text-xs sm:text-sm" data-testid="bill-totals">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("subtotal")}</span>
                      <span className="font-medium text-foreground tabular-nums">{rupees(bill.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("cgst")} (2.5%)</span>
                      <span className="font-medium text-foreground tabular-nums">{rupees(bill.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("sgst")} (2.5%)</span>
                      <span className="font-medium text-foreground tabular-nums">{rupees(bill.sgst)}</span>
                    </div>

                    {/* CASHIER APPLIED DISCOUNT */}
                    {(bill.discount_amount ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs sm:text-sm animate-in fade-in">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>
                            Cashier Special Discount ({bill.discount_reason || "Manager Approved"})
                          </span>
                        </span>
                        <span className="tabular-nums font-black text-emerald-300">
                          - {rupees(bill.discount_amount!)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-white/[0.08] pt-2 text-sm sm:text-base font-bold text-white">
                      <span>{t("grandTotal")}</span>
                      <span className="font-heading text-base sm:text-lg font-black text-amber-400 tabular-nums" data-testid="bill-grand-total">
                        {rupees(bill.grand_total)}
                      </span>
                    </div>

                    {/* Advance Deposit Deducted (20% Advance Dine & Dash) */}
                    {bill.advance_deducted > 0 && (
                      <div className="flex justify-between text-green-400 font-semibold text-xs sm:text-sm" data-testid="bill-advance-deducted">
                        <span className="flex items-center gap-1.5">
                          <BadgeCheck className="h-4 w-4" /> 20% Advance Deposit Credited
                        </span>
                        <span className="tabular-nums font-bold">- {rupees(bill.advance_deducted)}</span>
                      </div>
                    )}

                    {/* Previous Seat Payments Credited */}
                    {bill.paid_amount > bill.advance_deducted && (
                      <div className="flex justify-between text-green-400/90 text-xs font-medium">
                        <span>Seat Payments Already Settled</span>
                        <span className="tabular-nums">- {rupees(bill.paid_amount - bill.advance_deducted)}</span>
                      </div>
                    )}

                    {/* Net Balance Payable */}
                    <div className="flex justify-between border-t border-white/[0.12] pt-3 text-base sm:text-lg font-black text-white">
                      <span>Net Balance Payable</span>
                      <span className="font-heading text-xl sm:text-2xl font-black text-amber-400 tabular-nums" data-testid="bill-net-balance">
                        {rupees(bill.balance)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Table Merging: Linked Table Info Accordion */}
                {bill.linked_table_id && (
                  <section className="glass-card rounded-3xl border border-purple-500/30 bg-purple-500/[0.04] p-4 sm:p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm">
                            Linked Table {bill.linked_table_id} (Group Orders)
                          </h3>
                          <p className="text-[11px] text-purple-300/80">Group #{bill.group_id} • Server Merged</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGroupLines((v) => !v)}
                        className="h-8 rounded-xl border-purple-500/40 bg-purple-500/10 text-xs font-bold text-purple-300 hover:bg-purple-500/20"
                      >
                        {showGroupLines ? "Hide Items" : "View Items"}
                      </Button>
                    </div>

                    {showGroupLines && bill.group_lines && (
                      <div className="mt-3.5 space-y-2 border-t border-purple-500/20 pt-3 text-xs">
                        {bill.group_lines
                          .filter((l) => l.table_id === bill.linked_table_id)
                          .map((l, i) => (
                            <div key={i} className="flex items-center justify-between text-purple-200">
                              <span>
                                <span className="font-bold text-white">{l.qty}x</span> {l.name[lang]} (Seat {l.seat})
                              </span>
                              <span className="font-mono font-bold">{rupees(l.line_total)}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Digital Paid Receipt */}
                {bill.receipt && (
                  <section className="glass-card relative overflow-hidden rounded-3xl border border-green-500/30 p-6 sm:p-8 text-center shadow-2xl" data-testid="receipt-card">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-500/10 blur-2xl pointer-events-none" />
                    <BadgeCheck className="mx-auto h-12 w-12 sm:h-14 sm:w-14 text-green-400 animate-pulse" />
                    <h3 className="mt-3 font-heading text-lg sm:text-xl font-black text-green-400">{t("tablePaid")}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Official GST Digital Tax Invoice</p>

                    <div className="my-5 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("verifyCode")}</p>
                      <p className="mt-1 font-mono text-2xl sm:text-3xl font-black tracking-[0.25em] text-amber-400" data-testid="receipt-code">
                        {bill.receipt.code}
                      </p>
                      <p className="mt-2 text-xl sm:text-2xl font-bold tabular-nums text-white">{rupees(bill.receipt.amount)}</p>
                    </div>

                    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground" data-testid="whatsapp-receipt-note">
                      <MessageCircle className="h-4 w-4 text-green-400 shrink-0" /> {t("whatsapp")} — {bill.receipt.whatsapp_number}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{t("verifyHint")}</p>

                    <Button
                      variant="outline"
                      className="mt-6 h-11 sm:h-12 w-full gap-2 rounded-2xl border-white/20 font-bold hover:bg-white/[0.06]"
                      onClick={() => window.print()}
                      data-testid="download-receipt-button"
                    >
                      <Download className="h-4 w-4" />
                      <span>{t("download")} Official Receipt</span>
                    </Button>
                  </section>
                )}
              </div>

              {/* Right Column: Split Payment Hub (Always Available Online) */}
              <div className="space-y-6 lg:col-span-5">
                {!bill.receipt && (
                  <section className="glass-card rounded-3xl border border-white/10 p-4 sm:p-6 shadow-xl space-y-4" data-testid="split-card">
                    {/* Counter QR & Cash Settlement Status Pill */}
                    {isCounterPayEnabled ? (
                      <div className="flex items-center justify-between rounded-xl border border-green-500/40 bg-green-500/10 p-2.5 text-xs text-green-300">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                          </span>
                          <span className="font-bold text-[11px]">
                            ✓ Counter QR & Cash Active at Cashier Desk
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => enableCheckoutMutation.mutate(false)}
                          className="text-[10px] text-muted-foreground hover:text-white underline shrink-0"
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-400 shrink-0" />
                          <span className="text-[11px]">
                            <strong className="text-white">Online Phone Pay</strong> is active! Paying at counter?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => enableCheckoutMutation.mutate(true)}
                          className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 shrink-0"
                        >
                          📍 Enable Counter QR / Cash
                        </button>
                      </div>
                    )}

                    {/* Primary Billing Choice: Two Big Buttons (Always active for online pay) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="font-heading text-sm sm:text-base font-bold text-white">Choose How To Settle</h2>
                        <span className="text-xs font-bold text-amber-400">Instant UPI</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" data-testid="primary-billing-choices">
                        {/* Big Button 1: Pay My Table / My Share */}
                        <button
                          type="button"
                          disabled={bill.balance === 0 || payMutation.isPending}
                          onClick={() =>
                            openPay(`Pay Table ${bill.table_id} Share`, bill.balance, {
                              session_id: session.id,
                              mode: "my_table",
                              seat: null,
                              shares: null,
                              share_index: null,
                              amount: bill.balance,
                            })
                          }
                          className="group relative flex flex-col justify-between rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-3.5 sm:p-4 text-left transition-all hover:border-amber-400 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 shadow-lg"
                          data-testid="pay-my-share-button"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400">
                                Option 1
                              </span>
                              <CreditCard className="h-4 w-4 text-amber-400" />
                            </div>
                            <h3 className="mt-2 text-xs sm:text-sm font-black text-white">Pay My Table Share</h3>
                            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground">
                              Table {bill.table_id} items ({bill.lines.length} dishes)
                            </p>
                          </div>
                          <div className="mt-3">
                            <span className="font-heading text-lg sm:text-xl font-black text-amber-400 tabular-nums">
                              {rupees(bill.balance)}
                            </span>
                            {bill.advance_deducted > 0 && (
                              <span className="block text-[10px] font-semibold text-green-400">
                                ✓ 20% advance credited
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Big Button 2: Pay Group Total */}
                        <button
                          type="button"
                          disabled={bill.balance === 0 || payMutation.isPending}
                          onClick={() => {
                            const gTotal = bill.group_total || bill.grand_total + 52000;
                            openPay(
                              `Pay Group Combined Total (T-04 + ${bill.linked_table_id || "T-05"})`,
                              gTotal,
                              {
                                session_id: session.id,
                                mode: "group_total",
                                seat: null,
                                shares: null,
                                share_index: null,
                                amount: gTotal,
                              }
                            );
                          }}
                          className="group relative flex flex-col justify-between rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent p-3.5 sm:p-4 text-left transition-all hover:border-purple-400 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 shadow-lg"
                          data-testid="pay-group-total-button"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                                Option 2 • Group
                              </span>
                              <Users className="h-4 w-4 text-purple-400" />
                            </div>
                            <h3 className="mt-2 text-xs sm:text-sm font-black text-white">Pay Group Total</h3>
                            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground">
                              T-04 + {bill.linked_table_id || "T-05"} combined
                            </p>
                          </div>
                          <div className="mt-3">
                            <span className="font-heading text-lg sm:text-xl font-black text-purple-300 tabular-nums">
                              {rupees(bill.group_total || bill.grand_total + 52000)}
                            </span>
                            <span className="block text-[10px] font-semibold text-purple-300/80">
                              Combined table bill
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="my-3 border-t border-white/[0.08]" />

                    {/* Split Modes Tabs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span>Split Options</span>
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                            Custom dynamic balancing, equal, or seat-wise
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-400" data-testid="split-progress">
                          {mode === "equal"
                            ? t("progressN", { a: paidShares, b: bill.equal?.shares ?? shares })
                            : mode === "by_seat"
                            ? t("progressN", { a: paidSeats, b: bill.seats.length })
                            : `${participants.length} Active Chairs`}
                        </span>
                      </div>

                      <Tabs value={mode} onValueChange={(v) => setMode(v as "custom" | "equal" | "by_seat")}>
                        <TabsList className="grid h-11 w-full grid-cols-3 rounded-2xl bg-white/[0.04] p-1">
                          <TabsTrigger value="custom" className="rounded-xl text-[11px] sm:text-xs font-bold">
                            Smart Split ⚡
                          </TabsTrigger>
                          <TabsTrigger value="equal" className="rounded-xl text-[11px] sm:text-xs font-bold" data-testid="split-mode-equal">
                            {t("equal")}
                          </TabsTrigger>
                          <TabsTrigger value="by_seat" className="rounded-xl text-[11px] sm:text-xs font-bold" data-testid="split-mode-by-seat">
                            By Seat
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* TAB 1: SMART CUSTOM SPLIT (DYNAMIC AUTO-REBALANCING) */}
                    {mode === "custom" && (
                      <div className="mt-4 space-y-3.5">
                        {/* Scope Toggle (When Grouped) */}
                        {isGrouped && (
                          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="font-bold text-purple-200">Split Total Scope:</span>
                              <span className="text-[10px] text-purple-300">
                                {splitScope === "table" ? "Table T-04 Only" : "All 4 Chairs (T-04 + T-05)"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSplitScope("table")}
                                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                                  splitScope === "table"
                                    ? "bg-amber-500 text-black shadow"
                                    : "bg-white/[0.04] text-muted-foreground hover:text-white"
                                }`}
                              >
                                Table Share ({rupees(bill.balance)})
                              </button>
                              <button
                                type="button"
                                onClick={() => setSplitScope("group")}
                                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                                  splitScope === "group"
                                    ? "bg-purple-600 text-white shadow"
                                    : "bg-white/[0.04] text-muted-foreground hover:text-white"
                                }`}
                              >
                                Group Total ({rupees(bill.group_total || bill.grand_total + 52000)})
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Auto-Rebalancing Status Banner */}
                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isSplitBalanced ? "bg-green-400 animate-pulse" : "bg-amber-400"
                              }`}
                            />
                            <span className="font-semibold text-white text-[11px] sm:text-xs">
                              {isSplitBalanced ? "100% Balanced Total:" : "Adjusting Total:"}{" "}
                              <span className="font-bold text-amber-400">{rupees(targetTotalPaise)}</span>
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetToEqual}
                            className="h-7 gap-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-muted-foreground hover:text-white"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Equalize</span>
                          </Button>
                        </div>

                        {/* Interactive Participant Cards */}
                        <div className="space-y-2.5">
                          {participants.map((p) => {
                            const isPaid = p.paid;
                            const amountInRupees = Math.round(p.amount / 100);

                            return (
                              <div
                                key={p.id}
                                className={`rounded-2xl border p-3 transition-all ${
                                  p.isLocked
                                    ? "border-amber-500/40 bg-amber-500/[0.05]"
                                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm">
                                      {p.chair_id === 1 ? "👑" : "👤"}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-bold text-white text-xs truncate">
                                        {p.label}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => toggleLock(p.id)}
                                          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black transition-all ${
                                            p.isLocked
                                              ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                              : "bg-white/[0.06] text-muted-foreground hover:text-white"
                                          }`}
                                        >
                                          {p.isLocked ? (
                                            <>
                                              <Lock className="h-2.5 w-2.5" /> Locked
                                            </>
                                          ) : (
                                            <>
                                              <Unlock className="h-2.5 w-2.5" /> Auto-balance
                                            </>
                                          )}
                                        </button>
                                        <span className="text-[10px] text-muted-foreground">
                                          {p.isLocked ? "(immune to changes)" : "(rebalances automatically)"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Adjustment & Input Controls */}
                                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <button
                                      type="button"
                                      disabled={p.amount <= 0 || p.isLocked}
                                      onClick={() => adjustByStep(p.id, -5000)}
                                      className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold text-white hover:bg-white/[0.08] active:scale-90 disabled:opacity-30"
                                      title="-₹50"
                                    >
                                      -
                                    </button>

                                    <div className="relative">
                                      <span className="absolute left-2 top-1.5 text-xs font-bold text-amber-400">₹</span>
                                      <input
                                        type="number"
                                        disabled={p.isLocked}
                                        value={amountInRupees}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          updateParticipantAmount(p.id, val * 100);
                                        }}
                                        className="h-7 w-20 rounded-lg border border-white/15 bg-black/60 pl-5 pr-1.5 text-xs font-black text-white outline-none focus:border-amber-400 disabled:opacity-60"
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      disabled={p.isLocked}
                                      onClick={() => adjustByStep(p.id, 5000)}
                                      className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold text-white hover:bg-white/[0.08] active:scale-90 disabled:opacity-30"
                                      title="+₹50"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Pay Button for This Seat */}
                                <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
                                  <span className="text-[11px] text-muted-foreground">
                                    Share: <span className="font-bold text-amber-400">{rupees(p.amount)}</span>
                                  </span>

                                  <Button
                                    size="sm"
                                    disabled={p.amount <= 0 || isPaid || payMutation.isPending}
                                    onClick={() =>
                                      openPay(`Pay ${p.label}`, p.amount, {
                                        session_id: session.id,
                                        mode: "custom",
                                        seat: p.chair_id,
                                        shares: participants.length,
                                        share_index: p.chair_id,
                                        amount: p.amount,
                                      })
                                    }
                                    className="h-7 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-3 text-[10px] sm:text-[11px] font-black text-black shadow hover:from-amber-300 hover:to-amber-400 active:scale-95"
                                  >
                                    Pay Share ({rupees(p.amount)}) →
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          💡 <span className="font-bold text-amber-300">Smart Balancing:</span> If anyone reduces their share, the difference auto-redistributes among unlocked diners!
                        </p>
                      </div>
                    )}

                    {/* TAB 2: EQUAL SPLIT */}
                    {mode === "equal" && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {t("splitBetween")}
                        </p>
                        <div className="flex gap-1.5 sm:gap-2">
                          {[2, 3, 4, 5, 6].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setShares(n)}
                              data-selected={shares === n}
                              data-testid={`share-count-${n}`}
                              className="h-10 sm:h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.03] text-xs sm:text-sm font-bold transition-all data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-500 data-[selected=true]:text-black"
                            >
                              {n}
                            </button>
                          ))}
                        </div>

                        {/* Share Cards Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {Array.from({ length: shares }, (_, i) => {
                            const paid = i < paidShares;
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={paid || payMutation.isPending}
                                onClick={() =>
                                  openPay(t("share", { n: i + 1 }), equalShareAmount(i), {
                                    session_id: session.id,
                                    mode: "equal",
                                    shares,
                                    share_index: i,
                                    seat: null,
                                    amount: equalShareAmount(i),
                                  })
                                }
                                data-testid={`share-button-${i}`}
                                className={`flex h-20 flex-col items-center justify-center rounded-2xl border p-2 text-sm font-bold transition-all active:scale-[0.98] ${
                                  paid
                                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                                    : "border-white/10 bg-white/[0.03] hover:border-amber-500/50 hover:bg-amber-500/[0.06]"
                                }`}
                              >
                                {paid ? (
                                  <>
                                    <BadgeCheck className="h-5 w-5 text-green-400" />
                                    <span className="text-[11px] font-bold mt-1 text-green-300">{t("paid")}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                      {t("share", { n: i + 1 })}
                                    </span>
                                    <span className="font-heading text-sm font-black text-amber-400 tabular-nums">
                                      {rupees(equalShareAmount(i))}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/80 mt-0.5">Pay UPI</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: SPLIT BY SEAT */}
                    {mode === "by_seat" && (
                      <div className="mt-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Individual Seat Orders</span>
                          <span>Track paid vs pending</span>
                        </div>

                        {bill.seats.map((s) => {
                          const isPaid = s.paid || s.pending_amount === 0;
                          return (
                            <div
                              key={s.seat}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border p-3.5 transition-all ${
                                isPaid
                                  ? "border-green-500/30 bg-green-500/[0.04]"
                                  : "border-white/[0.08] bg-white/[0.02]"
                              }`}
                              data-testid={`seat-row-${s.seat}`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-white text-xs sm:text-sm">
                                    {s.label || (s.seat === 1 ? "Seat 1 (Host - Me)" : `Seat ${s.seat} (Guest)`)}
                                  </p>
                                  {isPaid && (
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/20 px-2 py-0.5 text-[10px] font-black text-green-300"
                                      data-testid={`seat-paid-${s.seat}`}
                                    >
                                      <BadgeCheck className="h-3 w-3 text-green-400" />
                                      <span>PAID ✓</span>
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                                  <span>Subtotal {rupees(s.subtotal)} + GST</span>
                                  <span className="text-white font-medium">Total: {rupees(s.total)}</span>
                                  {s.paid_amount > 0 && (
                                    <span className="text-green-400 font-medium">
                                      Credited: {rupees(s.paid_amount)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isPaid ? (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                                  <BadgeCheck className="h-4 w-4" />
                                  <span>Fully Settled</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-8 sm:h-9 shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 text-xs font-bold text-black shadow hover:from-amber-300 hover:to-amber-400 active:scale-95"
                                  disabled={payMutation.isPending}
                                  onClick={() =>
                                    openPay(
                                      `Pay ${s.label || `Seat ${s.seat}`}`,
                                      s.pending_amount,
                                      {
                                        session_id: session.id,
                                        mode: "by_seat",
                                        seat: s.seat,
                                        shares: null,
                                        share_index: null,
                                        amount: s.pending_amount,
                                      }
                                    )
                                  }
                                  data-testid={`pay-seat-${s.seat}`}
                                >
                                  <span>Pay Seat {s.seat} ({rupees(s.pending_amount)})</span>
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <p>{t("payNote")}</p>
                    </div>
                  </section>
                )}

                {/* Anti-fraud Live Receipt Verification Tool */}
                <section className="glass-card rounded-3xl border border-white/10 p-4 sm:p-6 shadow-xl" data-testid="verify-card">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-amber-400" />
                    <h3 className="font-heading text-sm sm:text-base font-bold text-white">{t("verifyTitle")}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verify authenticity of any digital receipt generated at this cafe.
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Input
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                      placeholder={t("verifyPh")}
                      className="h-11 sm:h-12 rounded-2xl border-white/10 bg-white/[0.04] font-mono tracking-widest uppercase text-xs sm:text-sm"
                      data-testid="verify-input"
                    />
                    <Button
                      variant="outline"
                      className="h-11 sm:h-12 rounded-2xl border-white/20 px-4 sm:px-5 text-xs font-bold hover:bg-white/[0.08]"
                      disabled={verifyCode.trim().length < 4 || verifyMutation.isPending}
                      onClick={() => verifyMutation.mutate(verifyCode.trim())}
                      data-testid="verify-button"
                    >
                      {t("verifyBtn")}
                    </Button>
                  </div>

                  {verifyState && (
                    <div
                      className={`mt-4 flex items-center gap-3 rounded-2xl p-3.5 text-xs font-semibold ${
                        verifyState.ok ? "border border-green-500/30 bg-green-500/10 text-green-300" : "border border-red-500/30 bg-red-500/10 text-red-300"
                      }`}
                      data-testid={verifyState.ok ? "verify-result-valid" : "verify-result-invalid"}
                    >
                      {verifyState.ok ? <BadgeCheck className="h-5 w-5 text-green-400 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                      {verifyState.ok ? (
                        <span>
                          {t("verifyValid")} — Table {verifyState.result?.table_id} • {rupees(verifyState.result?.amount ?? 0)} • {verifyState.result?.items_count} {t("items")}
                        </span>
                      ) : (
                        <span>{t("verifyInvalid")}</span>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* STATE-OF-THE-ART RESPONSIVE PAYMENT PORTAL MODAL */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent
          className="glass-sheet max-h-[90vh] w-[95vw] sm:max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950/95 p-4 sm:p-6 text-foreground shadow-2xl backdrop-blur-2xl"
          data-testid="payment-modal"
        >
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-36 w-36 rounded-full bg-amber-500/20 blur-3xl animate-aura-pulse" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-purple-600/15 blur-3xl" />

          <DialogHeader className="relative pb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-base sm:text-lg font-black text-white" data-testid="payment-modal-title">
                    {payTarget?.label}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-[11px] text-muted-foreground">
                    Instant Bank & UPI Settlement
                  </DialogDescription>
                </div>
              </div>
              <Badge className="border-green-500/40 bg-green-500/20 text-green-300 text-[10px] font-black">
                256-bit SSL
              </Badge>
            </div>
          </DialogHeader>

          {/* Amount Breakdown Summary Card */}
          <div className="relative mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Base Amount:</span>
              <span className="font-mono font-bold text-white">{payTarget ? rupees(payTarget.amount) : "₹0"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">GST & Restaurant Taxes:</span>
              <span className="font-semibold text-green-400">Included (5%)</span>
            </div>
            {hasCashierDiscount && (
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span className="flex items-center gap-1 font-semibold">
                  <Tag className="h-3 w-3" /> Cashier Discount Applied:
                </span>
                <span className="font-mono font-black text-emerald-300">Credited ✓</span>
              </div>
            )}
            {tipPaise > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-amber-300 text-amber-300" /> Chef & Staff Tip:
                </span>
                <span className="font-mono font-bold text-amber-300">+{rupees(tipPaise)}</span>
              </div>
            )}
            <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between">
              <span className="font-heading text-xs font-black uppercase tracking-wider text-muted-foreground">
                Total Payable:
              </span>
              <span className="font-heading text-2xl font-black text-amber-400 tabular-nums" data-testid="payment-modal-amount">
                {payTarget ? rupees(payTarget.amount + tipPaise) : ""}
              </span>
            </div>
          </div>

          {/* Optional Tip Selector */}
          <div className="mt-2.5 space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-3 w-3 text-amber-400" /> Add a Tip for the Team (Optional)
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "No Tip", value: 0 },
                { label: "₹20", value: 2000 },
                { label: "₹50", value: 5000 },
                { label: "₹100", value: 10000 },
              ].map((tip) => (
                <button
                  key={tip.label}
                  type="button"
                  onClick={() => setTipPaise(tip.value)}
                  className={`h-8 rounded-xl border text-[11px] font-bold transition-all ${
                    tipPaise === tip.value
                      ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm"
                      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:text-white"
                  }`}
                >
                  {tip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="mt-3.5 space-y-3">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedPayMethod("upi_apps")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  selectedPayMethod === "upi_apps"
                    ? "bg-amber-500 text-black shadow"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>UPI Apps (Online)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayMethod("upi_qr")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  selectedPayMethod === "upi_qr"
                    ? "bg-amber-500 text-black shadow"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Counter QR</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayMethod("cards")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  selectedPayMethod === "cards"
                    ? "bg-amber-500 text-black shadow"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Cash / Desk</span>
              </button>
            </div>

            {/* TAB CONTENT 1: UPI APPS (ALWAYS ACTIVE FOR PHONE ONLINE PAYMENT) */}
            {selectedPayMethod === "upi_apps" && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <span className="text-[10px] text-muted-foreground font-semibold">
                  ⚡ Pay directly from your phone (Active anytime at table):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "gpay", name: "Google Pay", icon: "🟢" },
                    { id: "phonepe", name: "PhonePe", icon: "🟣" },
                    { id: "paytm", name: "Paytm UPI", icon: "🔵" },
                    { id: "cred", name: "CRED / BHIM", icon: "🟡" },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition-all ${
                        selectedUpiApp === app.id
                          ? "border-amber-400 bg-amber-500/20 text-white shadow-md scale-[1.02]"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:text-white"
                      }`}
                    >
                      <span className="text-base">{app.icon}</span>
                      <span className="truncate">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: COUNTER QR (LOCKED UNTIL USER REACHES COUNTER OR REQUESTS BILL) */}
            {selectedPayMethod === "upi_qr" && (
              <div className="space-y-2.5 text-center animate-in fade-in duration-150">
                {!isCounterPayEnabled ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-2.5">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        Counter QR Inactive (Desk Only)
                      </h4>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        This physical QR is displayed at the Cashier Counter terminal. It activates once you reach the desk or request counter settlement.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => enableCheckoutMutation.mutate(true)}
                      disabled={enableCheckoutMutation.isPending}
                      className="h-9 w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-xs font-black text-black shadow-md active:scale-95"
                    >
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      <span>📍 I'm at the Counter • Enable Counter QR</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-300 font-semibold">
                      📍 Official Cashier Counter Terminal QR (Table {bill?.table_id || "T-04"} Synchronized)
                    </div>

                    {/* Animated QR Graphic */}
                    <div className="relative mx-auto flex h-38 w-38 items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/40 bg-black/70 p-3 shadow-inner">
                      <div className="animate-scan-beam absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_2px_rgba(245,158,11,0.8)]" />
                      <QrCode className="h-26 w-26 text-amber-400/90" />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">qrcafe.pay@icici</span>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-amber-400 hover:bg-white/10"
                      >
                        {copiedUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>
                        QR expires in:{" "}
                        <span className="font-mono font-bold text-amber-300">
                          {Math.floor(qrSecondsLeft / 60)
                            .toString()
                            .padStart(2, "0")}
                          :{(qrSecondsLeft % 60).toString().padStart(2, "0")}
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: CARDS & CASH AT COUNTER (LOCKED UNTIL USER REACHES COUNTER) */}
            {selectedPayMethod === "cards" && (
              <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-xs animate-in fade-in duration-150">
                {!isCounterPayEnabled ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-center space-y-2.5">
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        Cash at Counter Inactive
                      </h4>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        Cash settlements must be recorded at the Cashier Desk. Tap below when you reach the counter to notify the cashier.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => enableCheckoutMutation.mutate(true)}
                      disabled={enableCheckoutMutation.isPending}
                      className="h-9 w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-xs font-black text-black shadow-md active:scale-95"
                    >
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      <span>📍 I'm at the Counter • Enable Cash Pay</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Accepted Cards:</span>
                      <span className="font-bold text-white">Visa • Mastercard • RuPay</span>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Handing over cash to the Cashier at the desk?
                      </p>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (payTarget) {
                            toast.success("Cash payment request sent to Cashier Counter! Please pay at the desk.", {
                              description: "Double payment locked: Online payment is held until cashier settles cash.",
                            });
                            payMutation.mutate({
                              ...payTarget.payload,
                              amount: payTarget.amount + tipPaise,
                            });
                          }
                        }}
                        disabled={payMutation.isPending}
                        className="h-9 w-full rounded-xl border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        <span>Signal Cashier: Paying Cash ({rupees(payTarget ? payTarget.amount + tipPaise : 0)})</span>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Button: Pay Now */}
          {selectedPayMethod === "upi_apps" || isCounterPayEnabled ? (
            <Button
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 font-heading text-xs sm:text-sm font-black text-black shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
              disabled={payMutation.isPending}
              onClick={() => {
                if (payTarget) {
                  payMutation.mutate({
                    ...payTarget.payload,
                    amount: payTarget.amount + tipPaise,
                  });
                }
              }}
              data-testid="pay-confirm-button"
            >
              {payMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Authorizing with Bank...
                </span>
              ) : (
                `Pay ${rupees(payTarget ? payTarget.amount + tipPaise : 0)} via ${
                  selectedPayMethod === "upi_apps" ? "Instant UPI" : "Counter Settlement"
                } →`
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setSelectedPayMethod("upi_apps")}
              className="mt-4 h-12 w-full rounded-2xl border-white/20 font-heading text-xs sm:text-sm font-bold text-white hover:bg-white/[0.06]"
            >
              <Smartphone className="h-4 w-4 mr-1.5 text-green-400" />
              <span>Switch to Instant UPI Apps (Pay Online Now)</span>
            </Button>
          )}

          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            🔒 Protected by Razorpay 256-bit encryption • Double-payment lock active
          </p>
        </DialogContent>
      </Dialog>

      <GroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        session={session}
        onSessionUpdated={() => queryClient.invalidateQueries({ queryKey: ["bill"] })}
      />

      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
}

export { BillPage, BillPage as Bill };
