import { useState } from "react";
import {
  ShieldCheck,
  QrCode,
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { rupees } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  cartTotal: number; // paise
  itemCount: number;
  onSuccess(paymentId: string, advancePaid: number): void;
  onCancel(): void;
}

export default function AdvancePaymentModal({
  open,
  onOpenChange,
  cartTotal,
  itemCount,
  onSuccess,
  onCancel,
}: Props) {
  const [method, setMethod] = useState<"upi" | "qr" | "card">("upi");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "failed">("idle");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");

  // Cart total in paise including 5% GST
  const grandCartTotal = Math.round(cartTotal * 1.05);
  // 20% advance required
  const advanceAmount = Math.round(grandCartTotal * 0.20);
  const remainingAmount = grandCartTotal - advanceAmount;

  const handleSimulatePayment = (willSucceed = true) => {
    setLoading(true);
    setStatus("idle");

    setTimeout(() => {
      setLoading(false);
      if (willSucceed) {
        setStatus("success");
        setTimeout(() => {
          const paymentId = `pay_rzp_${Date.now().toString(36)}`;
          onSuccess(paymentId, advanceAmount);
          setStatus("idle");
        }, 1200);
      } else {
        setStatus("failed");
      }
    }, 1500);
  };

  const handleClose = () => {
    if (loading) return;
    setStatus("idle");
    onCancel();
    onOpenChange(false);
  };

  const upiApps = [
    { id: "gpay", name: "Google Pay", icon: "🌐", color: "from-blue-500/20 to-blue-600/10" },
    { id: "phonepe", name: "PhonePe", icon: "🟣", color: "from-purple-500/20 to-purple-600/10" },
    { id: "paytm", name: "Paytm UPI", icon: "🔷", color: "from-sky-500/20 to-sky-600/10" },
    { id: "bhim", name: "BHIM / Any UPI", icon: "🇮🇳", color: "from-orange-500/20 to-green-600/10" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="glass-sheet mx-auto max-w-lg rounded-3xl border border-white/15 p-6 shadow-2xl sm:p-7"
        data-testid="advance-payment-modal"
      >
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-bold text-amber-400">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Dine & Dash Protection Policy</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
              <Lock className="h-3 w-3 text-green-400" />
              <span>Razorpay 256-bit Secure</span>
            </div>
          </div>

          <DialogTitle className="mt-3 font-heading text-xl font-black text-white sm:text-2xl">
            20% Advance Kitchen Deposit
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            A 20% advance deposit is required to start cooking your {itemCount} dishes fresh. The remaining 80% balance is payable when you finish dining.
          </DialogDescription>
        </DialogHeader>

        {/* Amount Summary Cards */}
        <div className="my-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/[0.02] p-2.5">
              <span className="block text-[10px] uppercase font-bold text-muted-foreground">Cart Total</span>
              <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                {rupees(grandCartTotal)}
              </span>
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 p-2.5">
              <span className="block text-[10px] uppercase font-bold text-amber-300">20% Advance Now</span>
              <span className="font-heading text-base font-black text-amber-400 tabular-nums">
                {rupees(advanceAmount)}
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-2.5">
              <span className="block text-[10px] uppercase font-bold text-muted-foreground">Due After Meal</span>
              <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                {rupees(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Razorpay Gateway Simulation Body */}
        {status === "success" ? (
          <div className="my-6 rounded-2xl border border-green-500/40 bg-green-500/10 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400 animate-bounce" />
            <h4 className="mt-3 font-heading text-lg font-bold text-green-400">
              Payment Successful!
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Advance of {rupees(advanceAmount)} received. Routing your order to the kitchen now...
            </p>
          </div>
        ) : status === "failed" ? (
          <div className="my-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-400" />
            <h4 className="mt-2 text-sm font-bold text-red-400">
              Payment Cancelled / Declined
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Order was <strong className="text-white">NOT</strong> sent to the kitchen. Your cart is preserved.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-9 border-white/20 text-xs font-bold"
              onClick={() => setStatus("idle")}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div>
            <Tabs value={method} onValueChange={(v) => setMethod(v as any)} className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-white/[0.04] p-1">
                <TabsTrigger value="upi" className="rounded-lg text-xs font-bold gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>UPI Apps</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="rounded-lg text-xs font-bold gap-1.5">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan QR</span>
                </TabsTrigger>
                <TabsTrigger value="card" className="rounded-lg text-xs font-bold gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Card / Net</span>
                </TabsTrigger>
              </TabsList>

              {/* UPI Tab */}
              <TabsContent value="upi" className="mt-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {upiApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                        selectedUpiApp === app.id
                          ? "border-amber-500 bg-amber-500/15 text-white"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      <span className="text-xl">{app.icon}</span>
                      <span className="text-xs font-bold">{app.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* QR Code Tab */}
              <TabsContent value="qr" className="mt-4 text-center">
                <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/40 bg-black/60 p-3 shadow-inner">
                  <div className="animate-scan-beam absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_2px_rgba(245,158,11,0.8)]" />
                  <QrCode className="h-28 w-28 text-amber-400/90" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Scan using GPay, PhonePe, Paytm or any BHIM UPI app
                </p>
              </TabsContent>

              {/* Card Tab */}
              <TabsContent value="card" className="mt-4 space-y-2 text-xs text-muted-foreground text-center p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <CreditCard className="mx-auto h-8 w-8 text-amber-400/70" />
                <p className="font-semibold text-foreground">Razorpay Sandbox Test Mode</p>
                <p>Supports Visa, Mastercard, RuPay and NetBanking with automated simulated OTP.</p>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <Button
                className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 font-extrabold text-black shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
                onClick={() => handleSimulatePayment(true)}
                data-testid="advance-pay-button"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Authorizing with Razorpay...
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Pay {rupees(advanceAmount)} & Send to Kitchen</span>
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-white/15 text-xs font-semibold hover:bg-white/[0.06]"
                  disabled={loading}
                  onClick={handleClose}
                >
                  Cancel & Review
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  disabled={loading}
                  onClick={() => handleSimulatePayment(false)}
                >
                  Simulate Failure
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>If payment fails or is cancelled, food is NOT prepared (zero food waste).</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AdvancePaymentModal };

