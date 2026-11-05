import { useState } from 'react';
import { useApp, API_BASE } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { Wallet, Plus, Trash2, Lock, ShieldCheck } from 'lucide-react';
import type { PettyCash as PettyCashType } from '../../types';

export function PettyCash() {
  const { pettyCash, setPettyCash, user, addToast, pushNotification } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState<number>(500);
  const [category, setCategory] = useState<string>('Ingredients');
  const [managerPin, setManagerPin] = useState('');
  const [pinRequired, setPinRequired] = useState(false);

  const categories = ['Ingredients', 'Maintenance', 'Utilities', 'Transport', 'Misc'];

  const totalSpent = pettyCash.reduce((sum, p) => sum + p.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || !paidTo.trim() || amount <= 0) {
      addToast('error', 'Please fill all fields properly');
      return;
    }
    if (amount > 5000) {
      addToast('error', 'Max limit per petty cash entry is ₹5,000');
      return;
    }
    if (amount > 2000 && !pinRequired) {
      setPinRequired(true);
      return;
    }
    if (pinRequired && managerPin !== '9999' && managerPin !== '1234') {
      addToast('error', 'Invalid Manager PIN');
      return;
    }

    const newRecord: PettyCashType = {
      id: `pc-${Date.now()}`,
      purpose,
      paid_to: paidTo,
      amount,
      category,
      created_at: new Date().toISOString(),
      created_by: user?.id || '3003',
    };

    setPettyCash(prev => [newRecord, ...prev]);
    addToast('success', `Petty cash logged: ${formatCurrency(amount)}`);
    pushNotification('petty_cash_logged', { amount, purpose, category }, 'manager');
    try {
      fetch(`${API_BASE}/petty-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      }).catch(err => console.warn('Petty cash sync error:', err));
    } catch (e) {}

    setShowModal(false);
    setPinRequired(false);
    setManagerPin('');
    setPurpose('');
    setPaidTo('');
    setAmount(500);
  };

  const handleDelete = (id: string) => {
    setPettyCash(prev => prev.filter(p => p.id !== id));
    addToast('info', 'Petty cash entry removed');
    try {
      fetch(`${API_BASE}/petty-cash/${id}`, { method: 'DELETE' }).catch(err => console.warn('Petty cash delete error:', err));
    } catch (e) {}
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Accountant Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">Petty Cash Expenses</h1>
          <p className="text-sm text-muted mt-1">Log daily emergency cash payments. Max ₹5,000 per entry. Manager PIN for ₹2,000+.</p>
        </div>

        <button
          onClick={() => { setShowModal(true); setPinRequired(false); }}
          className="h-11 px-4 rounded-xl bg-accent text-black text-sm font-bold flex items-center gap-2 btn-press"
        >
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-muted font-semibold uppercase">Total Petty Cash Spent Today</p>
            <p className="text-2xl font-extrabold text-amber-400 tabular">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        <div className="text-right text-xs text-muted">
          <p>{pettyCash.length} expenses logged</p>
          <p className="mt-0.5">Deducted from day net earnings</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase text-muted font-semibold border-b border-line">
            <tr>
              <th className="p-3.5">Purpose / Item</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Paid To</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Logged At</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pettyCash.map(pc => (
              <tr key={pc.id} className="hover:bg-surface2/50 transition-colors">
                <td className="p-3.5 font-medium">{pc.purpose}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded bg-surface2 border border-line text-xs font-semibold">
                    {pc.category}
                  </span>
                </td>
                <td className="p-3.5 text-muted">{pc.paid_to}</td>
                <td className="p-3.5 font-bold text-accent tabular">{formatCurrency(pc.amount)}</td>
                <td className="p-3.5 text-muted text-xs">{new Date(pc.created_at).toLocaleTimeString()}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDelete(pc.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pettyCash.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-sm font-medium">No petty cash expenses logged today</p>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Log Petty Cash Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Expense Purpose</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Emergency Milk / Gas Cylinder"
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Paid To</label>
                <input
                  type="text"
                  required
                  value={paidTo}
                  onChange={e => setPaidTo(e.target.value)}
                  placeholder="e.g. Local Dairy Vendor"
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    required
                    value={amount}
                    onChange={e => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none font-bold"
                  />
                </div>
              </div>

              {pinRequired && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <Lock size={14} /> Amount exceeds ₹2,000! Manager PIN Required:
                  </p>
                  <input
                    type="password"
                    maxLength={4}
                    value={managerPin}
                    onChange={e => setManagerPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (default 9999)"
                    className="w-full h-10 px-3 rounded-lg bg-surface border border-line text-sm text-center font-mono focus:border-accent focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-accent text-black font-bold text-sm btn-press"
                >
                  {pinRequired ? 'Authorize & Save' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
