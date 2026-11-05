import { useApp } from '../../hooks/useApp';
import { cn } from '../../utils/cn';
import { Users, CheckCircle, Sparkles } from 'lucide-react';

export function AvailableTables() {
  const { tables, claimTable, user } = useApp();

  // Any table that is not yet claimed/assigned to a waiter is available for claiming
  const available = tables.filter(t => !t.assigned_waiter_id || t.status === 'free');

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Waiter Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">Available Tables</h1>
          <p className="text-sm text-muted mt-1">
            Free and unassigned floor tables. Once accepted, the table is exclusively assigned to you until freed.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold">
          <span className="text-muted">Available to Claim: </span>
          <span className="font-extrabold text-green-400">{available.length} Tables</span>
        </div>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-16 text-muted card border-dashed rounded-2xl">
          <p className="text-4xl mb-3">🪑</p>
          <p className="font-bold text-lg text-ink">All Tables Currently Claimed</p>
          <p className="text-sm mt-1">There are no unassigned tables right now. Check "My Tables" for your active tables.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {available.map(t => (
            <div key={t.id} className="card p-4 border border-line hover:border-accent/40 transition-all rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-accent">{t.table_number || t.id}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-[11px] font-bold uppercase tracking-wider">
                    {t.status === 'free' ? 'Ready · Free' : 'Unassigned'}
                  </span>
                </div>
                <div className="text-xs text-muted space-y-1.5 mb-5 bg-surface2/60 p-3 rounded-xl border border-line/40">
                  <p className="flex items-center gap-1.5">
                    <Users size={14} className="text-muted" />
                    <span>{t.max_seats || 4} Guests Capacity</span>
                    <span>·</span>
                    <span className="font-semibold text-ink">Zone {t.zone || 'A'}</span>
                  </p>
                  <p className="text-[11px]">Next Order Token: <strong className="text-accent font-mono">#{t.current_token || 1}</strong></p>
                </div>
              </div>

              <button
                onClick={() => claimTable(t.id)}
                className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-black font-extrabold text-sm btn-press flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle size={16} /> Accept & Claim Table
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
