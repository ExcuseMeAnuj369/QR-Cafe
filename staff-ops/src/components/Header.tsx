import { useApp } from '../hooks/useApp';
import { Bell, Moon, Sun, Volume2, VolumeX, LogOut, Monitor } from 'lucide-react';
import type { Theme } from '../types';

interface HeaderProps {
  onOpenProfile?: () => void;
}

export function Header({ onOpenProfile }: HeaderProps) {
  const { user, theme, setTheme, soundEnabled, toggleSound, logout } = useApp();
  if (!user) return null;

  const themes: { id: Theme; icon: typeof Moon }[] = [
    { id: 'dark', icon: Moon },
    { id: 'night', icon: Monitor },
    { id: 'light', icon: Sun },
  ];

  const nextTheme = () => {
    const idx = themes.findIndex(t => t.id === theme);
    setTheme(themes[(idx + 1) % themes.length].id);
  };

  const ThemeIcon = themes.find(t => t.id === theme)?.icon || Moon;

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-line h-14 flex items-center px-4 gap-4">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-md shadow-amber-500/20">
          <span className="text-sm">🔥</span>
        </div>
        <span className="font-bold text-sm tracking-tight hidden sm:block">
          QR-Cafe <span className="text-accent">OPS</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Service is live
        </span>
        <span className="text-line">|</span>
        <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span className="text-line">|</span>
        <span>
          Shift ends in <span className="text-accent font-semibold tabular">04:12:36</span>
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={toggleSound}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface2 transition-colors btn-press"
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          onClick={nextTheme}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface2 transition-colors btn-press"
          aria-label="Toggle theme"
        >
          <ThemeIcon size={18} />
        </button>

        <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface2 transition-colors btn-press">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent text-black text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        <div className="w-px h-6 bg-line mx-1" />

        <div className="flex items-center gap-2 pl-1">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-surface2 transition-colors text-left btn-press"
            title="Click to view your Staff Profile & KYC"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold border border-accent/30">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight flex items-center gap-1">
                {user.name}
                <span className="text-[10px] text-accent">▾</span>
              </p>
              <p className="text-[11px] text-muted capitalize">{user.role === 'kitchen' ? 'Kitchen Chef' : user.role}</p>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors btn-press ml-1"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
