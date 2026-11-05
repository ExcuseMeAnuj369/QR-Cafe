import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { Package, AlertTriangle, Plus, Trash2, Send } from 'lucide-react';
import type { WastageRecord } from '../../types';

export function KitchenStock() {
  const { menu, updateStock, toggleSoldOut, logWastage, addToast, pushNotification } = useApp();
  const [showWastageModal, setShowWastageModal] = useState<string | null>(null);
  const [wastageQty, setWastageQty] = useState(1);
  const [wastageReason, setWastageReason] = useState<WastageRecord['reason']>('spilled');

  const handleRestockRequest = (menuId: string, name: string) => {
    pushNotification('restock_request', { menuId, name }, 'manager');
    addToast('info', `Restock request sent for ${name}`);
  };

  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showWastageModal || wastageQty <= 0) return;
    logWastage(showWastageModal, wastageQty, wastageReason);
    setShowWastageModal(null);
    setWastageQty(1);
  };

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Title */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Kitchen Desk</p>
        <h1 className="text-2xl font-bold tracking-tight">Kitchen Stock & Prep Capacity</h1>
        <p className="text-sm text-muted mt-1">Manage physical stock quantities, toggle instant sold-out status, and log kitchen wastage.</p>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {menu.map(item => (
          <div key={item.id} className={cn('card p-4 relative overflow-hidden flex flex-col justify-between', item.sold_out && 'opacity-70 border-red-500/30')}>
            {item.sold_out && (
              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center z-10 backdrop-blur-[1px]">
                <span className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg">
                  Sold Out
                </span>
              </div>
            )}

            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center">
                  <Package size={20} className="text-muted" />
                </div>
                {item.stock <= item.low_stock_threshold && !item.sold_out && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
                    LOW STOCK
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-base mb-0.5">{item.name}</h3>
              <p className="text-xs text-muted mb-2">{item.category} · {item.station}</p>
              <p className="text-lg font-bold text-accent tabular mb-3">{formatCurrency(item.price)}</p>

              {/* Stock Quantity Input */}
              <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-surface2 border border-line">
                <label className="text-xs text-muted font-medium">Stock</label>
                <input
                  type="number"
                  value={item.stock}
                  onChange={e => updateStock(item.id, parseInt(e.target.value) || 0)}
                  className="w-16 h-8 px-1.5 rounded-lg bg-surface border border-line text-sm font-bold tabular text-center focus:border-accent focus:outline-none"
                  min={0}
                />
                <span className="text-xs text-muted font-medium">→ {item.stock} plates possible</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowWastageModal(item.id)}
                  className="h-9 px-2 rounded-xl border border-line bg-surface2 text-xs font-semibold text-muted hover:text-red-400 btn-press flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Log Waste
                </button>
                <button
                  onClick={() => handleRestockRequest(item.id, item.name)}
                  className="h-9 px-2 rounded-xl border border-line bg-surface2 text-xs font-semibold text-muted hover:text-ink btn-press flex items-center justify-center gap-1"
                >
                  <Send size={12} /> Request Restock
                </button>
              </div>

              <button
                onClick={() => toggleSoldOut(item.id)}
                className={cn(
                  'w-full h-10 rounded-xl text-xs font-extrabold transition-all btn-press',
                  item.sold_out
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                )}
              >
                {item.sold_out ? 'Mark Available ✓' : 'Mark Sold Out'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Wastage Log Modal */}
      {showWastageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWastageModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Log Kitchen Wastage</h3>
            <p className="text-sm text-muted mb-4">Record spoiled/burnt quantity to automatically adjust stock.</p>

            <form onSubmit={handleWastageSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Wastage Quantity (plates)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={wastageQty}
                  onChange={e => setWastageQty(parseInt(e.target.value) || 1)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Reason for Wastage</label>
                <select
                  value={wastageReason}
                  onChange={e => setWastageReason(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                >
                  <option value="burnt">Burnt while cooking</option>
                  <option value="spilled">Spilled / Dropped</option>
                  <option value="expired">Expired ingredient</option>
                  <option value="customer-return">Customer return (Quality issue)</option>
                  <option value="quality-reject">Chef quality rejection</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(null)}
                  className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white font-bold text-sm btn-press"
                >
                  Log Wastage & Deduct
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
