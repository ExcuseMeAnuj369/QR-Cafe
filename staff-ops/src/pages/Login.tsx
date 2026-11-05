import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import type { Role } from '../types';
import { ChefHat, UtensilsCrossed, IndianRupee, ArrowRight, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

const roles: { id: Role; label: string; icon: typeof ChefHat }[] = [
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'waiter', label: 'Waiter', icon: UtensilsCrossed },
  { id: 'accountant', label: 'Accountant', icon: IndianRupee },
];

export function Login() {
  const { login } = useApp();
  const [role, setRole] = useState<Role>('kitchen');
  const [staffId, setStaffId] = useState('1001');
  const [pin, setPin] = useState('1001');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(staffId, pin, role);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="app-bg">
        <div className="grid-pattern" />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-black font-black text-lg">🔥</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            QR-Cafe <span className="text-accent">OPS</span>
          </span>
        </div>

        <div className="max-w-lg">
          <p className="text-muted text-sm font-medium tracking-widest uppercase mb-4">
            Restaurant Operations / 01
          </p>
          <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
            Keep the floor{' '}
            <span className="text-accent">in rhythm.</span>
          </h1>
          <p className="mt-6 text-muted text-lg leading-relaxed max-w-md">
            One calm workspace for the people who make every table feel effortless.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </span>
          <span>·</span>
          <span>Mumbai / {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-muted text-xs font-semibold tracking-widest uppercase mb-2">
              Staff Access
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Good to see you.</h2>
            <p className="text-muted mt-2 text-sm">
              Choose your role and enter your staff PIN to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role selector */}
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      if (r.id === 'kitchen') { setStaffId('1001'); setPin('1001'); }
                      if (r.id === 'waiter') { setStaffId('2002'); setPin('2002'); }
                      if (r.id === 'accountant') { setStaffId('3003'); setPin('3003'); }
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 py-4 rounded-xl border transition-all btn-press min-h-[44px]',
                      active
                        ? 'border-accent bg-accent/10 text-accent shadow-lg shadow-amber-500/10'
                        : 'border-line bg-surface2 text-muted hover:border-line-hover'
                    )}
                  >
                    <Icon size={22} />
                    <span className="text-sm font-semibold">{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Staff ID */}
            <div>
              <label className="block text-xs font-semibold text-muted tracking-wider uppercase mb-2">
                Staff ID
              </label>
              <input
                type="text"
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface2 border border-line text-ink font-medium tabular focus:border-accent focus:outline-none transition-colors"
                placeholder="Enter staff ID"
                autoComplete="username"
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-semibold text-muted tracking-wider uppercase mb-2">
                PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface2 border border-line text-ink font-medium tracking-widest focus:border-accent focus:outline-none transition-colors"
                placeholder="••••"
                maxLength={6}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-accent text-black font-bold text-base flex items-center justify-center gap-2 hover:brightness-110 transition-all btn-press disabled:opacity-60 shadow-lg shadow-amber-500/25"
            >
              {loading ? 'Entering…' : 'Enter workspace'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface2/60 border border-line text-xs text-muted">
              <Zap size={14} className="text-accent shrink-0" />
              <span>One-Click Quick Login by Employee:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => { setRole('kitchen'); setStaffId('1001'); setPin('1001'); login('1001', '1001', 'kitchen'); }}
                className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-left flex items-center gap-2 transition btn-press"
              >
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center text-[10px]">K</span>
                <div className="truncate">
                  <div className="font-bold text-ink truncate">Arjun Mehta</div>
                  <div className="text-[10px] text-muted">Kitchen · 1001</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setRole('waiter'); setStaffId('2002'); setPin('2002'); login('2002', '2002', 'waiter'); }}
                className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-left flex items-center gap-2 transition btn-press"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 font-bold flex items-center justify-center text-[10px]">W</span>
                <div className="truncate">
                  <div className="font-bold text-ink truncate">Priya Sharma</div>
                  <div className="text-[10px] text-muted">Waiter · 2002</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setRole('accountant'); setStaffId('3003'); setPin('3003'); login('3003', '3003', 'accountant'); }}
                className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-left flex items-center gap-2 transition btn-press"
              >
                <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 font-bold flex items-center justify-center text-[10px]">A</span>
                <div className="truncate">
                  <div className="font-bold text-ink truncate">Rahul Verma</div>
                  <div className="text-[10px] text-muted">Accountant · 3003</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setRole('waiter'); setStaffId('2004'); setPin('2004'); login('2004', '2004', 'waiter'); }}
                className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-left flex items-center gap-2 transition btn-press"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 font-bold flex items-center justify-center text-[10px]">W</span>
                <div className="truncate">
                  <div className="font-bold text-ink truncate">Sneha Patel</div>
                  <div className="text-[10px] text-muted">Waiter · 2004</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setRole('kitchen'); setStaffId('1005'); setPin('1005'); login('1005', '1005', 'kitchen'); }}
                className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-left flex items-center gap-2 transition btn-press"
              >
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center text-[10px]">K</span>
                <div className="truncate">
                  <div className="font-bold text-ink truncate">Vikram Singh</div>
                  <div className="text-[10px] text-muted">Kitchen · 1005</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setRole('waiter'); setStaffId('2006'); setPin('2006'); login('2006', '2006', 'waiter'); }}
                className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-left flex items-center gap-2 transition btn-press"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 font-bold flex items-center justify-center text-[10px]">W</span>
                <div className="truncate">
                  <div className="font-bold text-ink truncate">Rohan Gupta</div>
                  <div className="text-[10px] text-muted">Waiter · 2006</div>
                </div>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            Secure staff workspace · v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
