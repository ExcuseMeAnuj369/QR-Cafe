import { BellRing, CheckCircle2, ChefHat, ReceiptText } from "lucide-react";
import { useNow } from "@/lib/useNow";
import type { StringKey, TFunc } from "@/lib/i18n";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS: { status: OrderStatus; titleKey: StringKey; descKey: StringKey; icon: typeof ReceiptText }[] = [
  { status: "placed", titleKey: "stepPlaced", descKey: "stepPlacedDesc", icon: ReceiptText },
  { status: "preparing", titleKey: "stepKitchen", descKey: "stepKitchenDesc", icon: ChefHat },
  { status: "ready", titleKey: "stepReady", descKey: "stepReadyDesc", icon: BellRing },
  { status: "served", titleKey: "stepServed", descKey: "stepServedDesc", icon: CheckCircle2 },
];

// Vertical live-tracking stepper — current node pulses with a saffron glow.
export default function OrderStepper({ order, t }: { order: Order; t: TFunc }) {
  const now = useNow(1000);
  const currentIdx = STEPS.findIndex((s) => s.status === order.status);
  const elapsedMs = now - new Date(order.created_at).getTime();
  const remainingMs = order.prep_seconds * 1000 - elapsedMs;
  const etaMin = Math.max(1, Math.ceil(remainingMs / 60000));

  return (
    <div className="py-1" data-testid={`track-stepper-${order.id}`}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const current = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                data-testid={`track-step-${step.status}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : current
                      ? "glow-pulse border-primary bg-primary/15 text-primary"
                      : "border-white/15 bg-white/[0.03] text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              {i < STEPS.length - 1 && (
                <span className={`my-0.5 w-0.5 flex-1 rounded ${done ? "bg-primary" : "bg-white/10"}`} style={{ minHeight: 22 }} />
              )}
            </div>
            <div className={`pb-4 ${current ? "" : "opacity-70"}`}>
              <p className={`text-sm font-bold ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {t(step.titleKey)}
                {current && (order.status === "placed" || order.status === "preparing") && remainingMs > 0 && (
                  <span className="ml-2 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary" data-testid={`track-eta-${order.id}`}>
                    {t("readyIn", { n: etaMin })}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{t(step.descKey)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { OrderStepper };
