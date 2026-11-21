import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { makeT } from "@/lib/i18n";
import { getLanguage } from "@/lib/local";

// Shown when the customer panel has no temporary session yet.
export default function NoSessionCard() {
  const navigate = useNavigate();
  const t = makeT(getLanguage());

  return (
    <div className="glass-card w-full rounded-3xl p-6 text-center" data-testid="no-session-card">
      <p className="text-lg font-bold">{t("noSession")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("scanSub")}</p>
      <Button
        className="mt-4 h-12 w-full bg-primary font-bold text-primary-foreground transition-transform duration-100 active:scale-[0.98]"
        onClick={() => navigate("/t/T-04?token=tok-t04-demo")}
        data-testid="start-demo-session-button"
      >
        {t("startDemo")}
      </Button>
    </div>
  );
}

export { NoSessionCard };
