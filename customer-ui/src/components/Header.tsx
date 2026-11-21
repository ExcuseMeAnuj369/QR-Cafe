import { Bell, BellRing, ChefHat, Receipt, UtensilsCrossed, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/types";
import type { TFunc } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { rupees } from "@/lib/format";

const LANG_LABEL: Record<Lang, { short: string; label: string }> = {
  en: { short: "EN", label: "English" },
  hi: { short: "हिं", label: "हिन्दी" },
  mr: { short: "मरा", label: "मराठी" },
};

interface Props {
  tableId: string;
  sessionCode: string | null;
  activeOrders: number;
  lang: Lang;
  t: TFunc;
  groupId?: string | null;
  linkedTableId?: string | null;
  onLangCycle(): void;
  onOpenCart?(): void;
  onOpenGroup?(): void;
}

export default function Header({
  tableId,
  sessionCode,
  activeOrders,
  lang,
  t,
  groupId,
  linkedTableId,
  onLangCycle,
  onOpenCart,
  onOpenGroup,
}: Props) {
  const location = useLocation();
  const cart = useCart();

  const isMenu = location.pathname === "/menu";
  const isTrack = location.pathname === "/track";
  const isBill = location.pathname === "/bill";

  return (
    <header className="glass-header sticky top-0 z-40 transition-all" data-testid="glass-header">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity + Table Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/menu" className="group flex items-center gap-2.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/20 transition-transform duration-200 group-hover:scale-105">
              <UtensilsCrossed className="h-5 w-5" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-green-500" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-lg font-black tracking-tight text-white">QR CAFE</span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                  Luxury
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">Smart Table Ordering</p>
            </div>
          </Link>

          {/* Table Badge */}
          <div className="flex items-center gap-2">
            <Badge
              className="h-9 gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20"
              data-testid="header-table-badge"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span>Table {tableId}</span>
            </Badge>

            {groupId ? (
              <button
                type="button"
                onClick={onOpenGroup}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 text-xs font-bold text-purple-200 hover:bg-purple-500/25 transition-all active:scale-95 shadow-sm shadow-purple-500/10"
                data-testid="header-group-badge"
              >
                <span className="text-purple-400">🔗</span>
                <span className="font-extrabold text-white">Table {tableId}</span>
                {linkedTableId && (
                  <>
                    <span className="text-purple-400 font-normal">⇄</span>
                    <span className="font-extrabold text-purple-200">Table {linkedTableId}</span>
                  </>
                )}
                <span className="hidden sm:inline-block ml-1 rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-200">
                  #{groupId}
                </span>
              </button>
            ) : onOpenGroup ? (
              <button
                type="button"
                onClick={onOpenGroup}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-3 text-xs font-bold text-muted-foreground hover:border-purple-500/40 hover:text-purple-300 transition-all active:scale-95"
              >
                <span>🔗 Link Table</span>
              </button>
            ) : null}

            {sessionCode && (
              <span
                className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-muted-foreground md:inline-flex"
                data-testid="header-session-code"
              >
                {t("sessionLabel")} <span className="ml-1 font-mono text-white/90">{sessionCode}</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/menu"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              isMenu
                ? "bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>{t("browseMenu")}</span>
          </Link>

          <Link
            to="/track"
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              isTrack
                ? "bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            {activeOrders > 0 ? (
              <BellRing className="h-4 w-4 text-amber-400 animate-bounce" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            <span>{t("liveOrders")}</span>
            {activeOrders > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-black">
                {activeOrders}
              </span>
            )}
          </Link>

          <Link
            to="/bill"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              isBill
                ? "bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>{t("bill")}</span>
          </Link>
        </nav>

        {/* Right: Controls & Cart Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Active Orders Shortcut */}
          <Link to="/track" aria-label={t("liveOrders")} className="relative md:hidden">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-white/10 bg-white/[0.03]"
              data-testid="header-orders-button"
            >
              {activeOrders > 0 ? (
                <BellRing className="h-4 w-4 text-amber-400" />
              ) : (
                <Bell className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            {activeOrders > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black shadow-md shadow-amber-500/30"
                data-testid="header-orders-badge"
              >
                {activeOrders}
              </span>
            )}
          </Link>

          {/* Language Switcher */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-white/15 bg-white/[0.03] px-3 font-bold transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
            onClick={onLangCycle}
            data-testid="language-toggle"
            aria-label="change language"
          >
            <span className="text-xs text-muted-foreground mr-1.5">🌐</span>
            <span>{LANG_LABEL[lang].short}</span>
          </Button>

          {/* Mobile Cart Trigger Button */}
          {onOpenCart && cart.count > 0 && (
            <Button
              onClick={onOpenCart}
              className="h-10 gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 text-xs font-bold text-black shadow-lg shadow-amber-500/25 transition-transform active:scale-95 lg:hidden"
            >
              <span>🛒 {cart.count}</span>
              <span className="hidden xs:inline">• {rupees(cart.subtotal)}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export { Header };
