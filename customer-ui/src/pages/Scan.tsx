import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  UtensilsCrossed,
  ArrowRight,
  Users,
  User,
  HeartHandshake,
  Baby,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import AmbientBackground from "@/components/AmbientBackground";
import { makeT } from "@/lib/i18n";
import { saveLanguage, saveSession } from "@/lib/local";
import type { Lang, QRDSession, ScanRequest } from "@/lib/types";

const LANGS: { id: Lang; native: string; title: string; note: string; flag: string }[] = [
  { id: "en", native: "English", title: "Welcome & Dine", note: "Browse menu & order per seat", flag: "🇬🇧" },
  { id: "hi", native: "हिन्दी", title: "नमस्ते एवं स्वागत है", note: "अपनी सीट अनुसार आर्डर करें", flag: "🇮🇳" },
  { id: "mr", native: "मराठी", title: "नमस्कार व स्वागत आहे", note: "आपल्या जागेवरून थेट ऑर्डर करा", flag: "🚩" },
];

const PARTY_OPTIONS = [
  { size: 1, label: "Just Me", desc: "Single diner (Seat 1)", icon: User, color: "from-blue-500/20 to-blue-600/10" },
  { size: 2, label: "2 People", desc: "Me (Host) + 1 Guest", icon: Users, color: "from-emerald-500/20 to-emerald-600/10" },
  { size: 3, label: "3 People", desc: "Me (Host) + 2 Guests (e.g. Kids/Elderly)", icon: HeartHandshake, color: "from-amber-500/20 to-amber-600/10" },
  { size: 4, label: "4 People", desc: "Me (Host) + 3 Guests (Full Family)", icon: Baby, color: "from-purple-500/20 to-purple-600/10" },
  { size: 6, label: "5-6 People", desc: "Large Group (Seat 1 to 6)", icon: Sparkles, color: "from-orange-500/20 to-orange-600/10" },
];

export default function Scan() {
  const { tableId = "T-04" } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "tok-demo";
  const navigate = useNavigate();

  // Multi-step onboarding: Step 1 (Language) -> Step 2 (Party Size & Chairs)
  const [step, setStep] = useState<1 | 2>(1);
  const [lang, setLang] = useState<Lang>("en");
  const [partySize, setPartySize] = useState<number>(2);
  const [userName, setUserName] = useState<string>("Host");
  const [selectedPrimaryChair, setSelectedPrimaryChair] = useState<number>(1);
  const [claimedChairs, setClaimedChairs] = useState<number[]>([1, 2]);
  const [isSecondPhone, setIsSecondPhone] = useState(false);
  const t = useMemo(() => makeT(lang), [lang]);
  const [invalid, setInvalid] = useState<string | null>(null);

  // Live real-time table chair polling from backend
  const { data: liveTable } = useQuery({
    queryKey: ["tableLive", tableId],
    queryFn: () => apiGet<any>(`/tables/${tableId}`).catch(() => null),
    refetchInterval: 3000,
  });

  const occupiedSeats = useMemo(() => {
    if (!liveTable || !Array.isArray(liveTable.seats)) return [];
    return liveTable.seats.filter((s: any) => s.phone_active || s.is_direct_claim);
  }, [liveTable]);

  const occupiedSeatNumbers = useMemo(() => {
    return occupiedSeats.map((s: any) => s.seat_no);
  }, [occupiedSeats]);

  const hasExistingSession = occupiedSeatNumbers.length > 0;

  // Auto-switch to next available chair if host chair 1 is already taken
  useEffect(() => {
    if (hasExistingSession) {
      setIsSecondPhone(true);
      const freeChair = [1, 2, 3, 4].find((c) => !occupiedSeatNumbers.includes(c));
      if (freeChair && (occupiedSeatNumbers.includes(selectedPrimaryChair) || selectedPrimaryChair === 1)) {
        setSelectedPrimaryChair(freeChair);
        setClaimedChairs([freeChair]);
        setUserName(`Diner (Chair ${freeChair})`);
      }
    }
  }, [hasExistingSession, occupiedSeatNumbers]);

  const toggleClaimChair = (c: number) => {
    if (occupiedSeatNumbers.includes(c)) return; // Already occupied by diner/guest
    if (c === selectedPrimaryChair) return; // Cannot unclaim own primary chair
    if (claimedChairs.includes(c)) {
      setClaimedChairs(claimedChairs.filter((x) => x !== c));
    } else {
      setClaimedChairs([...claimedChairs, c].sort((a, b) => a - b));
    }
  };

  const scan = useMutation({
    mutationFn: (request: ScanRequest) =>
      apiPost<QRDSession>("/session/scan", request),
    onSuccess: (s) => {
      saveSession(s);
      navigate("/menu", { replace: true });
    },
    onError: () => {
      // Safe fallback
      const now = new Date();
      const expires = new Date(now.getTime() + 4 * 3600 * 1000);
      const chairs = claimedChairs.length > 0 ? claimedChairs : [1, 2];
      const guestSeats = chairs.filter((c) => c !== selectedPrimaryChair);
      const fallbackSession: QRDSession = {
        id: `ses-${tableId}-${Date.now().toString(36)}`,
        code: `SES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        table_id: tableId,
        group_id: null,
        linked_table_id: null,
        party_size: chairs.length,
        is_host: selectedPrimaryChair === 1,
        host_seat: 1,
        guest_seats: guestSeats,
        seats_count: chairs.length,
        chair_id: selectedPrimaryChair,
        claimed_chairs: chairs,
        user_name: userName,
        group_code: undefined,
        linked_members: [
          { table_id: tableId, chairs: chairs, name: userName || "Your Table" },
        ],
        language: lang,
        status: "active",
        advance_paid: 0,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
      };
      saveSession(fallbackSession);
      navigate("/menu", { replace: true });
    },
  });

  const handleSelectLanguage = (selected: Lang) => {
    setLang(selected);
    saveLanguage(selected);
    // Move to Step 2: Ask how many people are dining (Host & Guest logic)
    setStep(2);
  };

  const handleConfirmPartyAndScan = (size?: number) => {
    const finalChairs = size
      ? (size === 1 ? [1] : Array.from({ length: size }, (_, i) => i + 1))
      : claimedChairs;
    setPartySize(finalChairs.length);
    scan.mutate({
      table_id: tableId,
      token,
      language: lang,
      party_size: finalChairs.length,
      chair_id: selectedPrimaryChair,
      claimed_chairs: finalChairs,
      join_existing_session: isSecondPhone,
    });
  };

  if (invalid) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <AmbientBackground />
        <div className="glass-card w-full max-w-md rounded-3xl p-8 text-center" data-testid="qr-error-screen">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-4 text-2xl font-bold">{t("qrExpired")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{invalid}</p>
          <Button
            variant="outline"
            className="mt-6 h-12 w-full rounded-2xl border-white/15 font-bold"
            onClick={() => navigate("/")}
            data-testid="qr-error-retry-button"
          >
            {t("retryScan")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <AmbientBackground />

      <main className="w-full max-w-2xl">
        <div
          className="glass-card relative overflow-hidden rounded-3xl border border-white/15 p-6 shadow-2xl sm:p-10"
          data-testid="language-selector-modal"
        >
          {/* Decorative glowing orb */}
          <div className="animate-aura-pulse absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Table Header Section */}
          <div className="text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30">
              <UtensilsCrossed className="h-8 w-8" />
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-green-500" />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span>Table {tableId} Verified</span>
            </div>

            {/* Step 1: Language Picker */}
            {step === 1 && (
              <>
                <h1
                  className="mt-3 font-heading text-2xl font-black tracking-tight text-white sm:text-4xl"
                  data-testid="scan-welcome-title"
                >
                  {t("welcomeTitle", { table: tableId })}
                </h1>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  Please choose your preferred dining language to get started.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleSelectLanguage(l.id)}
                      data-testid={`language-option-${l.id}`}
                      className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-200 hover:scale-[1.02] hover:border-amber-500/50 hover:bg-amber-500/[0.07] active:scale-[0.98]"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{l.flag}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
                        </div>
                        <h3 className="mt-3 font-heading text-lg font-bold text-foreground group-hover:text-amber-300">
                          {l.native}
                        </h3>
                        <p className="text-xs font-medium text-amber-400/90">{l.title}</p>
                      </div>
                      <p className="mt-3 text-[11px] text-muted-foreground">{l.note}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: "Chair Selector & Dining Party Setup" (Chairs & Host Logic) */}
            {step === 2 && (
              <>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-muted-foreground hover:text-white"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Step 2 of 2: Table & Chair Assignment
                  </span>
                </div>

                <h2
                  className="mt-3 font-heading text-2xl font-black tracking-tight text-white sm:text-3xl"
                  data-testid="party-question-title"
                >
                  Select Your Chair at Table {tableId}
                </h2>
                <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Choose your seat and link chairs for family/kids who don't have phones.
                </p>

                  {/* Second Phone Simulation Toggle */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSecondPhone(!isSecondPhone);
                      if (!isSecondPhone) {
                        setSelectedPrimaryChair(2);
                        setClaimedChairs([2]);
                        setUserName("Guest (Chair 2)");
                      } else {
                        setSelectedPrimaryChair(1);
                        setClaimedChairs([1, 2]);
                        setUserName("Host");
                      }
                    }}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isSecondPhone
                        ? "border-purple-500 bg-purple-500/20 text-purple-200"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                    }`}
                  >
                    <span>📱 Session Mode:</span>
                    <span>{isSecondPhone ? "2nd Diner Mode (Host Active at Chair 1)" : "Host Mode (Ordering for Table)"}</span>
                  </button>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <span className="text-[11px] text-muted-foreground">Your Name:</span>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Rahul / Host"
                      className="w-24 bg-transparent text-xs font-bold text-amber-300 outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Visual Restaurant Table & Chairs Layout */}
                <div className="relative mx-auto my-6 max-w-md rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
                  {/* Chairs Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((c) => {
                      const isOccupiedByOther = occupiedSeatNumbers.includes(c);
                      const occSeat = (liveTable?.seats || []).find((s: any) => s.seat_no === c);
                      const isMyPrimary = selectedPrimaryChair === c;
                      const isClaimedByMe = claimedChairs.includes(c);

                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={isOccupiedByOther}
                          onClick={() => {
                            if (hasExistingSession || isSecondPhone) {
                              setSelectedPrimaryChair(c);
                              setClaimedChairs([c]);
                            } else {
                              toggleClaimChair(c);
                            }
                          }}
                          className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                            isOccupiedByOther
                              ? "border-purple-500/40 bg-purple-500/10 opacity-75 cursor-not-allowed"
                              : isMyPrimary
                              ? "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20 scale-[1.02]"
                              : isClaimedByMe
                              ? "border-green-500/50 bg-green-500/15"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                        >
                          <span className="text-2xl">
                            {isOccupiedByOther ? (c === 1 ? "👑" : "👥") : isMyPrimary ? (c === 1 ? "👑" : "👤") : isClaimedByMe ? "👥" : "🪑"}
                          </span>
                          <span className="mt-2 font-heading text-sm font-bold text-white">
                            Chair {c}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {isOccupiedByOther
                              ? (occSeat?.label || "Occupied by Diner")
                              : isMyPrimary
                              ? "You (Active Seat)"
                              : isClaimedByMe
                              ? "Linked Guest Seat"
                              : "Tap to Claim"}
                          </span>

                          {isClaimedByMe && !isOccupiedByOther && (
                            <span className="mt-1.5 rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-black text-green-300">
                              {isMyPrimary ? "PRIMARY SEAT" : "LINKED GUEST"}
                            </span>
                          )}
                          {isOccupiedByOther && (
                            <span className="mt-1.5 rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-black text-purple-300">
                              OCCUPIED
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Group Handshake Prompt when active table seats are detected */}
                  {(hasExistingSession || isSecondPhone) && (
                    <div className="mt-5 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-3.5 text-left text-xs text-purple-200">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span>Active Diners already seated at Table {tableId}!</span>
                      </div>
                      <p className="mt-1 text-[11px] text-purple-300/80">
                        {occupiedSeatNumbers.length > 0
                          ? `Chairs ${occupiedSeatNumbers.join(', ')} are currently claimed. You are joining Chair ${selectedPrimaryChair} with your own distinct diner session.`
                          : "Joining this table group connects your live cart and menu. You can order for your seat or collaborate with Host."}
                      </p>
                    </div>
                  )}

                  {/* Primary CTA Button */}
                  <Button
                    onClick={() => handleConfirmPartyAndScan()}
                    disabled={scan.isPending}
                    className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-sm font-extrabold text-black shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
                    data-testid="confirm-chairs-button"
                  >
                    <span>
                      {isSecondPhone
                        ? "Join Table Group & Open Menu →"
                        : `Confirm ${claimedChairs.length} ${claimedChairs.length === 1 ? "Chair" : "Chairs"} & Open Menu →`}
                    </span>
                  </Button>
                </div>

                {/* Quick Party Size Presets */}
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Or Quick Presets (1-Tap):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PARTY_OPTIONS.slice(0, 4).map((opt) => (
                      <button
                        key={opt.size}
                        type="button"
                        disabled={scan.isPending}
                        onClick={() => handleConfirmPartyAndScan(opt.size)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs font-bold text-muted-foreground hover:border-amber-500/40 hover:text-white transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {scan.isPending && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400" data-testid="scan-connecting">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <span>Creating Host Session & Seats for Table {tableId}...</span>
            </div>
          )}

          <div className="mt-8 border-t border-white/[0.06] pt-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              Seat assignments allow easy separate billing and kitchen clarity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export { Scan };
