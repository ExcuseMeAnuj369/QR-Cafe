import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency, formatElapsed } from '../../utils/cn';
import { Users, Plus, Unlink, ArrowRightLeft, ShieldAlert, Check, X } from 'lucide-react';
import { STAFF } from '../../data/mock';

export function MyTables() {
  const {
    user, tables, orders, freeTable, groups, addOrderItem, menu,
    requestTableTransfer, transferRequests, respondTableTransfer
  } = useApp();

  const [addModal, setAddModal] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<string | null>(null);
  const [targetWaiterId, setTargetWaiterId] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [qty, setQty] = useState(1);
  const [seat, setSeat] = useState(1);

  if (!user) return null;

  const myTables = tables.filter(t =>
    (t.assigned_waiter_id && String(t.assigned_waiter_id) === String(user.id)) ||
    (t as any).waiter_id === user.id ||
    ((t as any).waiter && (t as any).waiter === user.name && t.status === 'occupied')
  );

  const otherWaiters = STAFF.filter(s => {
    const r = (s.role || '').toLowerCase();
    return (r.includes('waiter') || r.includes('server')) && String(s.id) !== String(user.id);
  });

  // Incoming transfer requests meant for this logged-in waiter
  const incomingTransfers = transferRequests.filter(tr => tr.to_waiter_id === user.id && tr.status === 'pending');

  const handleTransferSubmit = (tableId: string) => {
    if (!targetWaiterId) return;
    requestTableTransfer(tableId, targetWaiterId);
    setTransferModal(null);
    setTargetWaiterId('');
  };

  const handleFreeTableWithWarning = (tableId: string) => {
    const tableOrders = orders.filter(o => o.table_id === tableId && !['served', 'completed', 'cancelled'].includes(o.status));
    if (tableOrders.length > 0) {
      const confirmFree = window.confirm(`Table has ${tableOrders.length} active unserved order(s). Are you sure you want to free this table?`);
      if (!confirmFree) return;
    }
    freeTable(tableId);
  };

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Waiter Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">My Tables</h1>
          <p className="text-sm text-muted mt-1">Manage claimed tables, mid-order additions, table transfers, and table freeing.</p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold">
          <span className="text-muted">Claimed Tables: </span>
          <span className="font-extrabold text-accent">{myTables.length} / 8</span>
        </div>
      </div>

      {/* Incoming Transfer Requests Notification Banner */}
      {incomingTransfers.length > 0 && (
        <div className="mb-6 space-y-2">
          {incomingTransfers.map(tr => (
            <div key={tr.id} className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-amber-400 shrink-0" size={18} />
                <span>
                  <strong className="text-amber-400">{tr.from_waiter_name}</strong> wants to transfer <strong>{tr.table_number}</strong> to you.
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => respondTableTransfer(tr.id, false)}
                  className="px-3 py-1.5 rounded-lg border border-line bg-surface text-muted hover:text-ink text-xs font-bold"
                >
                  Reject
                </button>
                <button
                  onClick={() => respondTableTransfer(tr.id, true)}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-extrabold btn-press"
                >
                  Accept Transfer ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Cards Grid */}
      {myTables.length === 0 ? (
        <div className="text-center py-16 text-muted card border-dashed">
          <p className="text-4xl mb-3">🪑</p>
          <p className="font-medium text-lg">No Tables Claimed Yet</p>
          <p className="text-sm mt-1">Go to "Available Tables" tab to claim tables for service.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {myTables.map(table => {
            const tableOrders = orders.filter(o => o.table_id === table.id && !['served', 'completed', 'cancelled'].includes(o.status));
            const group = groups.find(g => g.id === table.group_id);

            return (
              <div key={table.id} className="card p-4 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-2xl font-extrabold text-accent">{table.table_number}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                        TOKEN #{table.current_token}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-[11px] font-bold uppercase">
                      {table.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted mb-3">
                    <span>{table.max_seats} seats</span>
                    <span>·</span>
                    <span>Zone {table.zone}</span>
                    {tableOrders.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-accent font-semibold">{tableOrders.length} active order(s)</span>
                      </>
                    )}
                  </div>

                  {group && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-bold">
                        <Users size={12} />
                        {group.group_code} · LINKED GROUP
                      </span>
                    </div>
                  )}

                  {/* Active Orders List */}
                  {tableOrders.map(o => (
                    <div key={o.id} className="rounded-xl bg-surface2 border border-line p-2.5 mb-2 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-xs text-muted">{o.id}</span>
                        <span className="text-xs font-bold capitalize text-amber-400">{o.status}</span>
                      </div>
                      {o.items.map(i => (
                        <div key={i.id} className="text-xs text-muted">{i.name} × {i.qty}</div>
                      ))}
                      <div className="text-right text-xs font-bold tabular mt-1 text-accent">{formatCurrency(o.total)}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-line">
                  <button
                    onClick={() => setAddModal(table.id)}
                    className="flex-1 h-10 rounded-xl bg-accent text-black text-xs font-bold btn-press flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                  <button
                    onClick={() => setTransferModal(table.id)}
                    className="h-10 px-3 rounded-xl border border-line bg-surface2 text-xs font-semibold text-muted hover:text-ink btn-press flex items-center gap-1"
                  >
                    <ArrowRightLeft size={14} /> Transfer
                  </button>
                  <button
                    onClick={() => handleFreeTableWithWarning(table.id)}
                    className="h-10 px-3 rounded-xl border border-line text-xs font-semibold text-muted hover:text-red-400 btn-press"
                  >
                    Free
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Mid-Order Item Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Add Mid-Order Item</h3>
            <p className="text-sm text-muted mb-4">Pushes a new ticket to kitchen under the active session.</p>

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

            <div className="flex gap-2 mt-5">
              <button onClick={() => setAddModal(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                Cancel
              </button>
              <button
                onClick={() => {
                  const m = menu.find(x => x.id === selectedMenu);
                  if (!m || !addModal) return;
                  addOrderItem(addModal, { menu_id: m.id, name: m.name, qty, price: m.price, seat_no: seat, station: m.station });
                  setAddModal(null);
                  setSelectedMenu('');
                }}
                disabled={!selectedMenu}
                className="flex-1 h-11 rounded-xl bg-accent text-black text-sm font-bold btn-press disabled:opacity-50"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTransferModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Transfer Table Ownership</h3>
            <p className="text-sm text-muted mb-4">Receiver waiter must accept the transfer request.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Select Destination Waiter</label>
                <select
                  value={targetWaiterId}
                  onChange={e => setTargetWaiterId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Select waiter…</option>
                  {otherWaiters.map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Zone {w.zone || 'A'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setTransferModal(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                Cancel
              </button>
              <button
                disabled={!targetWaiterId}
                onClick={() => handleTransferSubmit(transferModal)}
                className="flex-1 h-11 rounded-xl bg-accent text-black text-sm font-bold btn-press disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
