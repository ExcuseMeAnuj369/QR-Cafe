import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  UtensilsCrossed,
  Wifi,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChefHat,
  Receipt,
  Users,
  Bell,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AmbientBackground from "@/components/AmbientBackground";
import { makeT } from "@/lib/i18n";
import { getLanguage, getSession } from "@/lib/local";

// Deterministic decorative QR art
const PATTERN: boolean[] = Array.from({ length: 64 }, (_, i) => (i * 13 + 5) % 7 < 3);
const TABLES = ["T-01", "T-02", "T-04", "T-06", "T-08", "T-12"];

export default function Home() {
  const navigate = useNavigate();
  const lang = getLanguage();
  const t = useMemo(() => makeT(lang), [lang]);
  const session = getSession();
  const [selectedTable, setSelectedTable] = useState("T-04");

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AmbientBackground />

      {/* Top Navbar */}
      <header className="glass-header sticky top-0 z-40 border-b border-white/[0.08]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/25">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading text-xl font-black tracking-tight text-white">QR CAFE</span>
              <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                PRO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-400 hover:bg-amber-500/20"
                onClick={() => navigate("/menu")}
              >
                <span>Resume Table {session.table_id}</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="hidden sm:inline">Kitchen Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        {/* Hero Section */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Hero Content */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Dine-In Intelligence</span>
            </div>

            <h1 className="font-heading text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Scan. Order. Savor. <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Per-Seat Luxury Dining
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
              No paper menus or waiting for waiters. Scan your table QR code, browse rich multi-lingual culinary dishes in English, हिन्दी, or मराठी, customize per seat, and track your food live from the kitchen in real-time.
            </p>

            {/* Table Selector Box */}
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md lg:mx-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">Select Demo Dining Table:</span>
                <span className="text-amber-400 font-bold">{selectedTable}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {TABLES.map((tId) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setSelectedTable(tId)}
                    className={`h-9 rounded-xl text-xs font-black transition-all ${
                      selectedTable === tId
                        ? "bg-primary text-black shadow-md shadow-amber-500/30 scale-105"
                        : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tId}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="h-14 gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-8 text-base font-black text-black shadow-xl shadow-amber-500/30 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate(`/t/${selectedTable}?token=tok-${selectedTable.toLowerCase()}-demo`)}
                data-testid="simulate-scan-button"
              >
                <ScanLine className="h-5 w-5" />
                <span>Simulate QR Scan (Table {selectedTable})</span>
              </Button>

              {session && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-2xl border-white/15 px-6 font-bold text-foreground hover:bg-white/[0.05]"
                  onClick={() => navigate("/menu")}
                  data-testid="resume-session-button"
                >
                  <span>{t("resume")} — {session.table_id}</span>
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground lg:justify-start">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400" /> 100% Touchless
              </span>
              <span className="flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-green-400" /> Instant Cloud Sync
              </span>
              <span className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-sky-400" /> UPI Split Bill
              </span>
            </div>
          </div>

          {/* Right Interactive Animated QR Scanner Graphic */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Outer decorative glow aura */}
              <div className="animate-aura-pulse absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 blur-2xl" />

              <div className="glass-card relative overflow-hidden rounded-3xl border border-white/15 p-7 shadow-2xl">
                {/* Scanner Target Header */}
                <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-bold text-foreground">Interactive Table QR</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/15 text-green-400 text-[10px] font-bold">
                    ONLINE
                  </Badge>
                </div>

                {/* Animated QR Canvas Box with Laser Scan Beam */}
                <div className="relative mx-auto my-6 flex h-60 w-60 items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/40 bg-black/50 p-4 shadow-inner">
                  {/* Moving Laser Beam Graphic */}
                  <div className="animate-scan-beam absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_3px_rgba(245,158,11,0.8)]" />

                  {/* Corner Target Brackets */}
                  <div className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-amber-400" />
                  <div className="absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-amber-400" />
                  <div className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-amber-400" />

                  {/* Pixel Art QR Grid */}
                  <div className="grid h-48 w-48 grid-cols-8 gap-1 p-2" data-testid="home-qr-art">
                    {PATTERN.map((on, i) => (
                      <span
                        key={i}
                        className={`rounded-[3px] transition-colors duration-500 ${
                          on ? "bg-amber-400/90 shadow-xs" : "bg-white/[0.04]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">Point Camera or Click Scan</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Assigned to Table {selectedTable} • Dynamic Token Ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Desktop Responsive) */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Engineered for Seamless Table Service
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything guest and staff need in one frictionless experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="glass-card glass-card-hover rounded-2xl border border-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Seat-by-Seat Ordering</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Assign dishes to specific seats (S1, S2, S3). Eliminates confusion when the runner arrives at your table.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card glass-card-hover rounded-2xl border border-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400 mb-4">
                <ChefHat className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Live Kitchen Display (KOT)</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Watch your orders move from <span className="text-sky-300">Placed</span> to <span className="text-amber-300">Cooking</span> and <span className="text-green-300">Ready</span> in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card glass-card-hover rounded-2xl border border-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-4">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Instant Waiter Bell</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                One-tap request for drinking water, extra napkins, soup spoons, or table cleanup with live SLA timers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card glass-card-hover rounded-2xl border border-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Smart Bill Splitting</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Split bill equally or pay strictly for what your seat ordered. Instant UPI QR and digital WhatsApp receipts.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export { Home };
