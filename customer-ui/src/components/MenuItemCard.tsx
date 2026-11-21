import { Minus, Plus, Sparkles, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VegMark } from "@/components/VegMark";
import { rupees } from "@/lib/format";
import type { TFunc } from "@/lib/i18n";
import type { Lang, MenuItem } from "@/lib/types";

interface Props {
  item: MenuItem;
  lang: Lang;
  t: TFunc;
  qty: number;
  stockLeft: number | null;
  onQuickAdd(): void;
  onRemoveOne(): void;
  onCustomize(): void;
}

export default function MenuItemCard({
  item,
  lang,
  t,
  qty,
  stockLeft,
  onQuickAdd,
  onRemoveOne,
  onCustomize,
}: Props) {
  const soldOut = item.sold_out || stockLeft === 0;
  const lowStock = !soldOut && stockLeft !== null && stockLeft <= 5;

  return (
    <article
      data-testid={`menu-item-${item.id}`}
      onClick={() => !soldOut && onCustomize()}
      className={`glass-card glass-card-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        soldOut
          ? "pointer-events-auto opacity-50 grayscale"
          : "hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10"
      }`}
    >
      <div>
        {/* Image & Badges Banner */}
        <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-xl bg-muted/40">
          <img
            src={item.image}
            alt={item.name[lang]}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            data-testid={`menu-image-${item.id}`}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Top Floating Badges */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <div className="rounded-lg bg-black/60 p-1 backdrop-blur-md">
              <VegMark veg={item.veg} />
            </div>
            {item.tags.includes("bestseller") && (
              <Badge
                variant="secondary"
                className="h-6 gap-1 rounded-lg border border-amber-500/30 bg-amber-500/90 px-2 text-[10px] font-black uppercase tracking-wider text-black shadow-md backdrop-blur-md"
                data-testid={`tag-bestseller-${item.id}`}
              >
                <Sparkles className="h-3 w-3" />
                {t("bestseller")}
              </Badge>
            )}
            {item.category === "kids" && (
              <Badge
                variant="secondary"
                className="h-6 rounded-lg border border-sky-400/30 bg-sky-500/90 px-2 text-[10px] font-black uppercase tracking-wider text-black backdrop-blur-md"
                data-testid={`tag-kids-${item.id}`}
              >
                KIDS
              </Badge>
            )}
          </div>

          {/* Low Stock Indicator */}
          {lowStock && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="rounded-md border border-orange-500/40 bg-orange-950/80 px-2 py-0.5 text-[10px] font-bold text-orange-300 backdrop-blur-md">
                ⚡ {t("onlyNLeft", { n: stockLeft })}
              </span>
            </div>
          )}

          {/* Sold Out Banner Overlay */}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs">
              <span
                className="rotate-6 rounded-xl border-2 border-red-500 bg-red-950/90 px-3.5 py-1 text-xs font-black tracking-widest text-red-400 shadow-xl"
                data-testid={`sold-out-stamp-${item.id}`}
              >
                {t("soldOut")}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-amber-300"
              data-testid={`menu-name-${item.id}`}
            >
              {item.name[lang]}
            </h3>
          </div>
          <p
            className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
            data-testid={`menu-desc-${item.id}`}
          >
            {item.desc[lang]}
          </p>

          {/* Customization Options Cue */}
          {(item.spice_allowed || item.addons?.length > 0) && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-400/80">
              <SlidersHorizontal className="h-3 w-3" />
              <span>{t("customize")} (Spice, Add-ons)</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pricing & Action Bar */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div>
          <span className="text-xs text-muted-foreground block -mb-0.5">Price</span>
          <span className="font-heading text-lg font-black text-amber-400 tabular-nums" data-testid={`menu-price-${item.id}`}>
            {rupees(item.price)}
          </span>
        </div>

        {soldOut ? (
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("soldOut")}</span>
        ) : qty > 0 ? (
          <div
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-amber-300 hover:bg-amber-500/20"
              onClick={onRemoveOne}
              data-testid={`item-qty-minus-${item.id}`}
              aria-label="remove one"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center text-sm font-black text-amber-300 tabular-nums" data-testid={`item-qty-${item.id}`}>
              {qty}
            </span>
            <Button
              size="icon"
              className="h-8 w-8 rounded-lg bg-primary text-black hover:bg-primary/90"
              onClick={onQuickAdd}
              data-testid={`item-qty-plus-${item.id}`}
              aria-label="add one"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 font-bold text-black shadow-md shadow-amber-500/20 transition-all duration-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-lg active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            data-testid={`item-add-button-${item.id}`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("add")}</span>
          </Button>
        )}
      </div>
    </article>
  );
}

export { MenuItemCard };
