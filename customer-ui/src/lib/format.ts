// All money is paise (int) on the wire — display divides by 100 with Indian grouping.
export function rupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export function plural(n: number, en: string, hi: string, mr: string, lang: string): string {
  return lang === "hi" ? hi : lang === "mr" ? mr : en;
}
