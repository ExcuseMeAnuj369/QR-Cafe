import { useApp } from '../hooks/useApp';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'border-green-500/40 bg-green-500/10 text-green-400',
  error: 'border-red-500/40 bg-red-500/10 text-red-400',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
};

export function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'toast-enter flex items-center gap-3 px-4 py-3 rounded-xl border glass-strong shadow-lg',
              colors[t.type]
            )}
          >
            <Icon size={18} className="shrink-0" />
            <span className="text-sm font-medium text-ink flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
