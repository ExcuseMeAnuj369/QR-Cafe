import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency, formatElapsed } from '../../utils/cn';
import { Search, CheckCircle2, Clock, Plus, Users, UtensilsCrossed, XCircle, AlertTriangle } from 'lucide-react';

export function MyOrders() {
  const { orders, tables, user, updateOrderStatus, addOrderItem, cancelOrderItem, menu } = useApp();
  const [filter, setFilter] = useState<'active' | 'served' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState<{ tableId: string; orderId: string } | null>(null);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [qty, setQty] = useState(1);
  const [seat, setSeat] = useState(1);

  // Void modal state for cooked/ready items
  const [voidModal, setVoidModal] = useState<{ orderId: string; itemId: string; itemName: string; amount: number } | null>(null);
  const [voidReason, setVoidReason] = useState('Customer cancelled / left due to rush');

  if (!user) return null;

  const myOrders = orders.filter(o => {
    if (o.waiter_id && String(o.waiter_id) === String(user.id)) return true;
    const table = tables.find(t => t.id === o.table_id || t.table_number === o.table_number);
    if (table && (String(table.assigned_waiter_id) === String(user.id) || (table as any).waiter === user.name)) return true;
    return false;
  });

  const filtered = myOrders
    .filter(o => {
      if (filter === 'active') return ['new', 'preparing', 'ready'].includes(o.status);
      if (filter === 'served') return ['served', 'completed'].includes(o.status);
      return true;
    })
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.table_number.toLowerCase().includes(q) ||
        String(o.token).includes(q) ||
        o.id.toLowerCase().includes(q);
    });

  const activeCount = myOrders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length;
  const readyCount = myOrders.filter(o => o.status === 'ready').length;

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Waiter Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-sm text-muted mt-1">Track preparation, deliver ready items, and handle mid-order additions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-surface2 border border-line text-xs">
            <span className="text-muted">Active: </span>
            <span className="font-bold text-accent">{activeCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-xs">
            <span className="text-green-400 font-semibold">Ready to Serve: </span>
            <span className="font-extrabold text-green-400">{readyCount}</span>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface2 border border-line">
          {[
            { id: 'active', label: 'Active Orders' },
            { id: 'served', label: 'Served / History' },
            { id: 'all', label: 'All Orders' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all min-h-[36px]',
                filter === f.id ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Token, Table, Order ID"
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface2 border border-line text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(order => {
          const isReady = order.status === 'ready';
          const isPreparing = order.status === 'preparing';

          return (
            <div
              key={order.id}
              className={cn(
                'card p-4 border transition-all',
                isReady ? 'border-green-500/40 bg-green-500/5' :
                isPreparing ? 'border-amber-500/30' : 'border-line'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-accent">{order.table_number}</span>
                  <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                    TOKEN #{order.token}
                  </span>
                </div>
                <span className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold uppercase border',
                  isReady ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  isPreparing ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-surface2 text-muted border-line'
                )}>
                  {order.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted mb-3">
                <span className="font-mono">{order.id}</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatElapsed(order.created_at)}
                </span>
              </div>

              {order.group_id && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-medium">
                    <Users size={12} />
                    Linked Group
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 mb-4 bg-surface2/50 rounded-xl p-3 border border-line/50">
                {order.items.map(item => {
                  const isCancelled = item.status === 'cancelled';
                  const isVoidReq = item.status === 'void_requested';
                  const isVoided = item.status === 'voided';
                  const canCancel = !isCancelled && !isVoidReq && !isVoided && order.status !== 'served' && order.status !== 'completed';
                  const isUntouched = (item.status === 'new' || (!item.status && order.status === 'new'));

                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-line/20 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          isCancelled ? 'bg-red-400' :
                          isVoidReq ? 'bg-amber-400 animate-pulse' :
                          isVoided ? 'bg-purple-400' :
                          item.status === 'ready' ? 'bg-green-400' :
                          item.status === 'preparing' ? 'bg-amber-400' : 'bg-muted'
                        )} />
                        <span className={cn(
                          'font-medium',
                          (isCancelled || isVoided) && 'line-through text-muted'
                        )}>
                          {item.name} × {item.qty}
                        </span>

                        {isCancelled && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                            Cancelled
                          </span>
                        )}
                        {isVoidReq && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 animate-pulse">
                            Void Pending
                          </span>
                        )}
                        {isVoided && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                            Void Approved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={cn('text-xs tabular', isCancelled ? 'text-muted line-through' : 'text-muted')}>
                          {formatCurrency(item.price * item.qty)}
                        </span>

                        {canCancel && (
                          <button
                            onClick={() => {
                              if (isUntouched) {
                                if (confirm(`Cancel ${item.name}? Kitchen has not started preparing yet. Running bill will decrease by ₹${item.price * item.qty}.`)) {
                                  cancelOrderItem(order.id, item.id);
                                }
                              } else {
                                // Food is cooking or ready: requires void reason modal
                                setVoidModal({
                                  orderId: order.id,
                                  itemId: item.id,
                                  itemName: item.name,
                                  amount: item.price * item.qty
                                });
                              }
                            }}
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-semibold transition',
                              isUntouched
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20'
                            )}
                            title={isUntouched ? 'Cancel item (Not cooked yet)' : 'Food is cooking/ready - Request Supervisor Void'}
                          >
                            {isUntouched ? '✕ Cancel' : '⚠️ Void Req'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-bold">
                  <span>Running Total</span>
                  <span className="text-accent text-sm tabular">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isReady && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'served')}
                    className="flex-1 h-11 rounded-xl bg-green-500 text-black font-extrabold text-sm btn-press flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Pick Up & Serve
                  </button>
                )}

                {order.status !== 'served' && order.status !== 'completed' && (
                  <button
                    onClick={() => setAddModal({ tableId: order.table_id, orderId: order.id })}
                    className="h-11 px-3.5 rounded-xl bg-surface2 border border-line text-sm font-semibold text-muted hover:text-ink btn-press flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Item
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted card">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">Koi order nahi mila</p>
          <p className="text-sm mt-1">Orders will appear here as customers or waiters place them</p>
        </div>
      )}

      {/* Add Mid-Order Item Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Add Item Mid-Order</h3>
            <p className="text-sm text-muted mb-4">Creates a new ticket under the same session. Table total automatically updates.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Menu Item</label>
                <select
                  value={selectedMenu}
                  onChange={e => setSelectedMenu(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Select item…</option>
                  {menu.filter(m => m.available && !m.sold_out).map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {formatCurrency(m.price)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={e => setQty(parseInt(e.target.value) || 1)}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Seat No (0-6)</label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={seat}
                    onChange={e => setSeat(parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setAddModal(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                Cancel
              </button>
              <button
                onClick={() => {
                  const m = menu.find(x => x.id === selectedMenu);
                  if (!m || !addModal) return;
                  addOrderItem(addModal.tableId, {
                    menu_id: m.id,
                    name: m.name,
                    qty,
                    price: m.price,
                    seat_no: seat,
                    station: m.station,
                  });
                  setAddModal(null);
                  setSelectedMenu('');
                }}
                disabled={!selectedMenu}
                className="flex-1 h-11 rounded-xl bg-accent text-black text-sm font-bold btn-press disabled:opacity-50"
              >
                Submit New Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Void Request Modal (For food in prep/ready) */}
      {voidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setVoidModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-bold text-ink">Request Item Void (Kitchen Wastage)</h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Since <strong>{voidModal.itemName}</strong> is already cooking or prepared, ingredients have been consumed. Cancelling requires Manager/Owner Void Approval to write off kitchen wastage and deduct ₹{voidModal.amount} from the bill.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Reason for Void</label>
                <select
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                >
                  <option value="Customer cancelled / left due to rush">Customer cancelled / left due to rush</option>
                  <option value="Customer changed mind / ordered wrong item">Customer changed mind / ordered wrong item</option>
                  <option value="Kitchen delay beyond acceptable SLA">Kitchen delay beyond acceptable SLA</option>
                  <option value="Quality defect / burnt / cold">Quality defect / burnt / cold</option>
                  <option value="Allergy / dietary issue spotted late">Allergy / dietary issue spotted late</option>
                  <option value="Manager complimentary / spill replace">Manager complimentary / spill replace</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Custom Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Table 4 customer had to catch train urgently"
                  className="w-full h-10 px-3 rounded-xl bg-surface2 border border-line text-xs focus:border-accent focus:outline-none"
                  id="customVoidNote"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setVoidModal(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                Dismiss
              </button>
              <button
                onClick={() => {
                  const customNote = (document.getElementById('customVoidNote') as HTMLInputElement)?.value;
                  const finalReason = customNote ? `${voidReason} - ${customNote}` : voidReason;
                  cancelOrderItem(voidModal.orderId, voidModal.itemId, finalReason);
                  setVoidModal(null);
                }}
                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold btn-press"
              >
                Send Void Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
