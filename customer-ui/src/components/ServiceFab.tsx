import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, Clock } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNow } from "@/lib/useNow";
import type { StringKey, TFunc } from "@/lib/i18n";
import type { Lang, ServiceRequest, ServiceType } from "@/lib/types";

interface Props {
  sessionId: string;
  lang: Lang;
  t: TFunc;
  raised?: boolean;
}

const TYPES: { id: ServiceType; emoji: string; key: StringKey }[] = [
  { id: "water", emoji: "💧", key: "water" },
  { id: "napkin", emoji: "🧻", key: "napkin" },
  { id: "bowl", emoji: "🥣", key: "bowl" },
  { id: "spoon", emoji: "🥄", key: "spoon" },
  { id: "waiter", emoji: "🔔", key: "waiter" },
  { id: "highchair", emoji: "🪑", key: "highchair" },
  { id: "clean", emoji: "🧹", key: "clean" },
];

const SLA_SECONDS = 180;

export default function ServiceFab({ sessionId, lang, t, raised = false }: Props) {
  const [open, setOpen] = useState(false);
  const now = useNow(1000);
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["services", sessionId],
    queryFn: () => apiGet<ServiceRequest[]>(`/service-requests/${sessionId}`),
    refetchInterval: 2000,
  });
  const requests = servicesQuery.data ?? [];
  const openRequest = requests.find((r) => r.status !== "resolved");

  const createRequest = useMutation({
    mutationFn: (type: ServiceType) =>
      apiPost<ServiceRequest>("/service-request", { session_id: sessionId, type }),
    onSuccess: () => {
      toast.success(t("requestSent"));
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 429) {
        const detail = err.body as { retry_after?: number };
        toast.info(t("alreadyRequested", { t: detail?.retry_after ?? 180 }));
      } else {
        toast.error("Could not send request");
      }
    },
  });

  const remaining = openRequest
    ? Math.max(0, Math.ceil((new Date(openRequest.sla_deadline).getTime() - now) / 1000))
    : 0;
  const progress = openRequest ? 1 - remaining / SLA_SECONDS : 0;

  const statusText: Record<string, string> = {
    pending: t("waiterAlerted", { t: remaining }),
    acknowledged: t("waiterComing"),
    resolved: t("delivered"),
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="service-fab"
        aria-label={t("serviceTitle")}
        className={`fixed z-40 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black shadow-xl shadow-amber-500/35 transition-all duration-200 hover:scale-105 active:scale-95 ${
          raised ? "bottom-24 right-4" : "bottom-6 right-4 lg:bottom-8 lg:right-8"
        } h-14 w-14 lg:h-16 lg:w-16 ${openRequest ? "bell-shake ring-4 ring-amber-400/50" : "glow-pulse"}`}
      >
        <BellRing className="h-6 w-6 lg:h-7 lg:w-7" />
        {openRequest && (
          <span
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#090A0C] bg-red-500 text-[10px] font-black text-white"
            data-testid="service-fab-pending-dot"
          >
            !
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="glass-sheet mx-auto max-h-[92svh] max-w-2xl overflow-y-auto rounded-t-3xl border-white/10 p-0 sm:rounded-3xl sm:border sm:bottom-6 sm:top-auto"
          data-testid="service-sheet"
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />
          <SheetHeader className="px-6 pt-5">
            <SheetTitle className="font-heading text-lg font-bold text-white" data-testid="service-title">
              🔔 {t("serviceTitle")}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">{t("staffNote")}</SheetDescription>
          </SheetHeader>

          <div className="p-6 pb-8">
            {openRequest && (
              <div
                className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
                data-testid="service-active-call"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5 capitalize">
                    {TYPES.find((t) => t.id === openRequest.type)?.emoji} {openRequest.type} Request Dispatched
                  </span>
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="h-3 w-3" />
                    {remaining}s SLA
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {statusText[openRequest.status] ?? openRequest.status}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  disabled={createRequest.isPending || !!openRequest}
                  onClick={() => {
                    createRequest.mutate(type.id);
                    setOpen(false);
                  }}
                  data-testid={`service-type-${type.id}`}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition-all hover:scale-105 hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95 disabled:opacity-40"
                >
                  <span className="text-3xl">{type.emoji}</span>
                  <span className="mt-2 text-xs font-bold text-foreground">{t(type.key)}</span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              A staff member will arrive at your table within the 3-minute SLA guarantee.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { ServiceFab };
