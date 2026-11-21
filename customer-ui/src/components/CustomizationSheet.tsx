import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { VegMark } from "@/components/VegMark";
import { rupees } from "@/lib/format";
import type { StringKey, TFunc } from "@/lib/i18n";
import type { Lang, MenuItem, SpiceLevel } from "@/lib/types";

export interface CustomizeOpts {
  qty: number;
  spice: SpiceLevel | null;
  addon_ids: string[];
  notes: string | null;
  seat: number;
}

interface Props {
  item: MenuItem | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  lang: Lang;
  t: TFunc;
  defaultSeat: number;
  onSubmit(opts: CustomizeOpts): void;
}

const SPICES: { id: SpiceLevel; key: StringKey; emoji: string }[] = [
  { id: "mild", key: "mild", emoji: "🟢" },
  { id: "medium", key: "medium", emoji: "🟡" },
  { id: "hot", key: "hot", emoji: "🌶️" },
  { id: "extrahot", key: "extrahot", emoji: "🔥" },
];

// Glass bottom sheet — spice level, add-ons, seat assignment, special instructions.
export default function CustomizationSheet({ item, open, onOpenChange, lang, t, defaultSeat, onSubmit }: Props) {
  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState<SpiceLevel | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [seat, setSeat] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && item) {
      setQty(1);
      setSpice(item.spice_allowed ? "medium" : null);
      setAddonIds([]);
      setSeat(defaultSeat);
      setNotes("");
    }
  }, [open, item, defaultSeat]);

  if (!item) return <Sheet open={false} onOpenChange={onOpenChange}><SheetContent side="bottom" /></Sheet>;

  const addonTotal = item.addons.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = (item.price + addonTotal) * qty;

  const toggleAddon = (id: string) =>
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-sheet mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl border-white/10 p-0 sm:rounded-3xl sm:border sm:bottom-6 sm:top-auto sm:shadow-2xl"
        data-testid="customization-sheet"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
        <div className="space-y-5 p-4 pb-8">
          <SheetHeader className="p-0">
            <div className="flex gap-3">
              <img src={item.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0">
                <SheetTitle className="flex items-center gap-2 text-lg leading-tight" data-testid="customize-title">
                  <VegMark veg={item.veg} /> {item.name[lang]}
                </SheetTitle>
                <SheetDescription className="line-clamp-2 text-xs">{item.desc[lang]}</SheetDescription>
                <span className="text-base font-bold tabular-nums text-primary">{rupees(item.price)}</span>
              </div>
            </div>
          </SheetHeader>

          {item.spice_allowed && (
            <section>
              <h4 className="mb-2 text-sm font-bold">{t("spiceLevel")}</h4>
              <div className="grid grid-cols-4 gap-2">
                {SPICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpice(s.id)}
                    data-selected={spice === s.id}
                    data-testid={`spice-${s.id}`}
                    className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/15 data-[selected=true]:text-primary"
                  >
                    <span className="text-lg">{s.emoji}</span>
                    {t(s.key)}
                  </button>
                ))}
              </div>
            </section>
          )}

          {item.addons.length > 0 && (
            <section>
              <h4 className="mb-2 text-sm font-bold">{t("addons")}</h4>
              <div className="space-y-1">
                {item.addons.map((a) => (
                  <label
                    key={a.id}
                    className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-2 transition-colors hover:bg-white/5"
                    data-testid={`addon-row-${a.id}`}
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={addonIds.includes(a.id)}
                        onCheckedChange={() => toggleAddon(a.id)}
                        data-testid={`addon-${a.id}`}
                      />
                      {a.name[lang]}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-amber-400">+{rupees(a.price)}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-foreground">Who is this dish for?</h4>
              <span className="text-xs font-semibold text-amber-400">
                {seat === 1 ? "Seat 1 (Host - Me)" : `Seat ${seat} (Guest)`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeat(n)}
                  data-selected={seat === n}
                  data-testid={`seat-option-${n}`}
                  className="flex h-14 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold transition-all data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-black"
                >
                  <span className="text-xs">{n === 1 ? "Seat 1" : `Seat ${n}`}</span>
                  <span className="text-[9px] opacity-80">{n === 1 ? "Me (Host)" : "Guest"}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-bold">{t("notes")}</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPh")}
              rows={2}
              data-testid="notes-input"
            />
          </section>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" data-testid="customize-qty-stepper">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border-white/15"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                data-testid="customize-qty-minus"
                aria-label="decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-bold tabular-nums" data-testid="customize-qty-value">
                {qty}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border-white/15"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                data-testid="customize-qty-plus"
                aria-label="increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="h-12 flex-1 bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-amber-500/25 transition-transform duration-100 active:scale-[0.98]"
              onClick={() => onSubmit({ qty, spice, addon_ids: addonIds, notes: notes.trim() || null, seat })}
              data-testid="customize-add-button"
            >
              {t("addToOrder")} • {rupees(total)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { CustomizationSheet };
