import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency, formatElapsed, elapsedMinutes } from '../../utils/cn';
import { Search, Flame, CheckCircle2, Clock, Users, Zap, CheckCheck } from 'lucide-react';
import type { OrderStatus } from '../../types';

const statusFilters: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'served', label: 'Served' },
];

const stationTabs = ['All', 'Grill', 'Tandoor', 'Fry', 'Bar', 'Dessert'];

export function LiveOrders() {
  const { orders, updateOrderStatus, updateItemStatus, toggleRush, cannotMake, soundEnabled, toggleSound } = useApp();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedStation, setSelectedStation] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cannotMakeModal, setCannotMakeModal] = useState<{ orderId: string; itemId: string } | null>(null);
  const [reason, setReason] = useState('spoiled-ingredient');

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (selectedStation === 'All') return true;
      return o.items.some(i => i.station.toLowerCase() === selectedStation.toLowerCase());
    })
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.table_number.toLowerCase().includes(q) ||
        String(o.token).includes(q) ||
        o.id.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // Priority 1: Rush orders first
      if (a.is_rush && !b.is_rush) return -1;
      if (!a.is_rush && b.is_rush) return 1;
      // Priority 2: VIP orders next
      if (a.is_vip && !b.is_vip) return -1;
      if (!a.is_vip && b.is_vip) return 1;
      // Priority 3: FIFO oldest first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const stats = {
    active: orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length,
    rush: orders.filter(o => o.is_rush && o.status !== 'served').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  const handleBulkMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const statusColor = (s: OrderStatus) => {
    if (s === 'new') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (s === 'preparing') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (s === 'ready') return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-surface2 text-muted border-line';
  };

  const cardBorder = (s: OrderStatus, rush: boolean) => {
    if (rush) return 'border-red-500/50 bg-red-500/5 pulse-new';
    if (s === 'preparing') return 'border-amber-500/30';
    if (s === 'ready') return 'border-green-500/30';
    if (s === 'new') return 'border-blue-500/30';
    return 'border-line';
  };

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Kitchen Desk / Today</p>
          <h1 className="text-2xl font-bold tracking-tight">Live Orders</h1>
          <p className="text-sm text-muted mt-1">FIFO ticket pipeline sorted by Rush & VIP priority. No order cancellation allowed in Kitchen.</p>
        </div>
        <button
          onClick={toggleSound}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors min-h-[44px]',
            soundEnabled ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted'
          )}
        >
          <span className="text-base">{soundEnabled ? '🔔' : '🔕'}</span>
          Sound {soundEnabled ? 'On' : 'Off'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active tickets', value: String(stats.active).padStart(2, '0'), sub: 'In pipeline', icon: '🎫', color: 'text-ink' },
          { label: 'Rush orders', value: String(stats.rush).padStart(2, '0'), sub: 'High priority', icon: '🔥', color: 'text-red-400' },
          { label: 'Ready to serve', value: String(stats.ready).padStart(2, '0'), sub: 'Waiter notified', icon: '✓', color: 'text-green-400' },
          { label: 'Avg. prep time', value: '11m', sub: '-2m target', icon: '⏱', color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center text-lg">{s.icon}</div>
            <div>
              <p className="text-xs text-muted">{s.label}</p>
              <p className={cn('text-2xl font-bold tabular', s.color)}>{s.value}</p>
              <p className="text-[11px] text-muted">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Station Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4">
        <span className="text-xs text-muted font-bold uppercase shrink-0 mr-1">Station:</span>
        {stationTabs.map(st => (
          <button
            key={st}
            onClick={() => setSelectedStation(st)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px]',
              selectedStation === st ? 'bg-accent text-black font-extrabold' : 'bg-surface2 text-muted hover:text-ink'
            )}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface2 border border-line">
          {statusFilters.map(f => {
            const count = f.id === 'all' ? orders.length : orders.filter(o => o.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all min-h-[36px]',
                  filter === f.id ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink'
                )}
              >
                {f.label}
                {f.id === 'new' && count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-black text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search token, table, order ID"
            className="h-10 pl-9 pr-4 rounded-xl bg-surface2 border border-line text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none w-64"
          />
        </div>
      </div>

      <p className="text-xs text-muted mb-4">{filtered.length} tickets showing</p>

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(order => {
          const mins = elapsedMinutes(order.created_at);
          const timerColor = mins > 20 ? 'text-red-400 font-bold' : mins > 10 ? 'text-amber-400 font-semibold' : 'text-muted';

          return (
            <div
              key={order.id}
              className={cn('card p-4 border transition-all', cardBorder(order.status, order.is_rush))}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-accent">
                    {order.table_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                    TOKEN #{order.token}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {order.is_rush && (
                    <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
                      <Flame size={10} /> RUSH
                    </span>
                  )}
                  <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border', statusColor(order.status))}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted mb-3">
                <span className="font-mono">{order.id}</span>
                <span className={cn('flex items-center gap-1 tabular', timerColor)}>
                  <Clock size={12} />
                  {formatElapsed(order.created_at)}
                </span>
              </div>

              {order.group_id && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-medium">
                    <Users size={12} />
                    Linked Table Group
                  </span>
                </div>
              )}

              {/* Items List with Per-Item Status */}
              <div className="space-y-2 mb-4 bg-surface2/60 rounded-xl p-3 border border-line">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => {
                          if (item.status === 'new') updateItemStatus(order.id, item.id, 'preparing');
                          else if (item.status === 'preparing') updateItemStatus(order.id, item.id, 'ready');
                        }}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          item.status === 'ready' ? 'border-green-500 bg-green-500/20 text-green-400' :
                          item.status === 'preparing' ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-line'
                        )}
                      >
                        {item.status === 'ready' && <CheckCircle2 size={12} />}
                      </button>
                      <span className={cn('flex-1 font-medium', item.status === 'ready' && 'text-green-400 line-through opacity-75')}>
                        {item.name} × {item.qty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {item.cannot_make && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                          Cannot Make
                        </span>
                      )}
                      <span className="text-muted font-mono bg-surface p-1 rounded border border-line/50">{item.station}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleRush(order.id)}
                  className={cn(
                    'h-10 px-3 rounded-xl border text-xs font-bold transition-all btn-press flex items-center gap-1',
                    order.is_rush ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-line text-muted hover:text-ink'
                  )}
                >
                  <Flame size={14} /> Rush
                </button>

                {order.status === 'new' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 h-10 rounded-xl bg-accent text-black text-sm font-bold btn-press"
                  >
                    Start Preparing →
                  </button>
                )}

                {order.status === 'preparing' && (
                  <>
                    <button
                      onClick={() => setCannotMakeModal({ orderId: order.id, itemId: order.items[0]?.id })}
                      className="px-3 h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 btn-press"
                    >
                      Cannot Make
                    </button>
                    <button
                      onClick={() => handleBulkMarkReady(order.id)}
                      className="flex-1 h-10 rounded-xl bg-accent text-black text-sm font-bold btn-press flex items-center justify-center gap-1"
                    >
                      <CheckCheck size={16} /> Mark Ready
                    </button>
                  </>
                )}

                {order.status === 'ready' && (
                  <button className="flex-1 h-10 rounded-xl bg-green-500 text-black text-sm font-bold cursor-default flex items-center justify-center gap-1">
                    Ready for Pickup ✓
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted card border-dashed">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">No active tickets for selected filters</p>
        </div>
      )}

      {/* Cannot Make Modal */}
      {cannotMakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCannotMakeModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Cannot Make Item</h3>
            <p className="text-sm text-muted mb-4">Rare exception (equipment fail / spoiled item). Reason mandatory and recorded in audit log.</p>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm mb-4 focus:border-accent focus:outline-none"
            >
              <option value="spoiled-ingredient">Spoiled ingredient</option>
              <option value="equipment-failure">Equipment failure</option>
              <option value="other">Other emergency</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setCannotMakeModal(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                Cancel
              </button>
              <button
                onClick={() => {
                  cannotMake(cannotMakeModal.orderId, cannotMakeModal.itemId, reason);
                  setCannotMakeModal(null);
                }}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-bold btn-press"
              >
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
