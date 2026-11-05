import { useState } from 'react';
import { useApp, API_BASE } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { IndianRupee, QrCode, CreditCard, Lock, Percent, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Bill } from '../../types';

export function Bills() {
  const { bills, setBills, payBill, addToast, pushNotification } = useApp();
  const [collectId, setCollectId] = useState<string | null>(null);
  const [method, setMethod] = useState<'cash' | 'upi' | 'card' | 'split'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [phone, setPhone] = useState('');

  // Discount modal state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [discountPin, setDiscountPin] = useState('');

  // Void modal state
  const [showVoidModal, setShowVoidModal] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidPin, setVoidPin] = useState('');

  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);

  const pending = bills.filter(b => b.status === 'pending');
  const paid = bills.filter(b => b.status === 'paid');
  const bill = bills.find(b => b.id === collectId);

  const subtotal = bill ? bill.subtotal : 0;
  const discountAmt = bill ? bill.discount : 0;
  const taxable = Math.max(0, subtotal - discountAmt);
  const cgst = Number((taxable * 0.025).toFixed(2));
  const sgst = Number((taxable * 0.025).toFixed(2));
  const total = bill ? Math.round(taxable + cgst + sgst) : 0;

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const cashChange = cashReceivedNum - total;

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;
    if (discountPin !== '9999' && discountPin !== '1234') {
      addToast('error', 'Invalid Manager PIN for discount');
      return;
    }
    if (discountPercent > 30) {
      addToast('error', 'Max allowed discount is 30%');
      return;
    }

    const calcDiscount = Math.round((subtotal * discountPercent) / 100);
    const newTaxable = subtotal - calcDiscount;
    const newCgst = Number((newTaxable * 0.025).toFixed(2));
    const newSgst = Number((newTaxable * 0.025).toFixed(2));
    const newTotal = Math.round(newTaxable + newCgst + newSgst);

    setBills(prev => prev.map(b => b.id === bill.id ? {
      ...b,
      discount: calcDiscount,
      cgst: newCgst,
      sgst: newSgst,
      total: newTotal,
    } : b));

    addToast('success', `${discountPercent}% discount applied successfully`);
    pushNotification('discount_applied', { billId: bill.id, discountPercent, calcDiscount }, 'manager');
    try {
      fetch(`${API_BASE}/bills/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: bill.id, discountPercent, discountAmount: calcDiscount, requestor: 'Accountant Desk' })
      }).catch(err => console.warn('Discount sync error:', err));
    } catch (e) {}
    setShowDiscountModal(false);
    setDiscountPin('');
  };

  const handleVoidRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVoidModal) return;
    if (voidPin !== '9999' && voidPin !== '1234') {
      addToast('error', 'Invalid Manager PIN for Void/Refund');
      return;
    }
    if (!voidReason.trim()) {
      addToast('error', 'Reason is required for void/refund');
      return;
    }

    setBills(prev => prev.map(b => b.id === showVoidModal ? { ...b, status: 'void' as const } : b));
    addToast('warning', 'Bill voided/refunded successfully');
    pushNotification('bill_voided', { billId: showVoidModal, reason: voidReason }, 'manager');
    try {
      fetch(`${API_BASE}/bills/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: showVoidModal, reason: voidReason, requestor: 'Accountant Desk' })
      }).catch(err => console.warn('Void sync error:', err));
    } catch (e) {}
    setShowVoidModal(null);
    setVoidReason('');
    setVoidPin('');
  };

  const handleConfirmCollect = () => {
    if (!collectId || !bill) return;

    if (method === 'split') {
      const splitTotal = splitCash + splitUpi + splitCard;
      if (Math.abs(splitTotal - bill.total) > 1) {
        addToast('error', `Split payment amounts must sum to ${formatCurrency(bill.total)} (Current sum: ${formatCurrency(splitTotal)})`);
        return;
      }
    }

    payBill(collectId, method, phone || undefined);
    setCollectId(null);
    setPhone('');
    setCashReceived('');
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Accountant Desk</p>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Payment Collection</h1>
        <p className="text-sm text-muted mt-1">Collect pending bills, split payments, apply discounts with Manager PIN, and issue GST receipts.</p>
      </div>

      {/* Pending Bills */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Pending Bills ({pending.length})</h2>
        <div className="space-y-3">
          {pending.map(b => (
            <div key={b.id} className="card p-4 flex flex-wrap items-center justify-between gap-4 border border-accent/20 bg-accent/5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-extrabold text-accent">{b.table_number}</span>
                  <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                    TOKEN #{b.token}
                  </span>
                  {b.group_id && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-xs font-bold">
                      Linked Table
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Subtotal {formatCurrency(b.subtotal)} · CGST {formatCurrency(b.cgst)} · SGST {formatCurrency(b.sgst)}
                  {b.discount > 0 && <span className="text-green-400 ml-1">(-{formatCurrency(b.discount)} disc)</span>}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-2xl font-extrabold tabular text-accent">{formatCurrency(b.total)}</p>
                <button
                  onClick={() => {
                    setCollectId(b.id);
                    setCashReceived(String(b.total));
                    setSplitCash(b.total);
                  }}
                  className="px-5 h-11 rounded-xl bg-accent text-black font-extrabold text-sm btn-press shadow-lg"
                >
                  Collect Payment →
                </button>
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <div className="text-center py-12 text-muted card border-dashed">
              <p className="text-3xl mb-2">💳</p>
              <p className="font-medium">No pending bills</p>
              <p className="text-xs mt-1">Pending bills auto-appear here when waiters mark orders served.</p>
            </div>
          )}
        </div>
      </div>

      {/* Paid Bills List */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Paid & Settled Bills ({paid.length})</h2>
        <div className="space-y-2">
          {paid.map(b => (
            <div key={b.id} className="card p-3.5 flex items-center justify-between opacity-85">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-ink">{b.table_number}</span>
                <span className="text-xs font-mono text-muted">{b.receipt_code}</span>
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">
                  {b.method}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular text-ink">{formatCurrency(b.total)}</span>
                <button
                  onClick={() => setShowVoidModal(b.id)}
                  className="px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 btn-press"
                >
                  Void / Refund
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Collect Modal */}
      {collectId && bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCollectId(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold">Collect Payment</h3>
                <p className="text-xs text-muted">{bill.table_number} · Token #{bill.token}</p>
              </div>
              <button
                onClick={() => setShowDiscountModal(true)}
                className="px-3 py-1.5 rounded-xl border border-accent/30 bg-accent/15 text-accent text-xs font-bold btn-press flex items-center gap-1"
              >
                <Percent size={14} /> Discount
              </button>
            </div>

            {/* Total Breakdown Display */}
            <div className="text-center py-4 my-4 rounded-xl bg-surface2 border border-line">
              <p className="text-4xl font-extrabold tabular text-accent">{formatCurrency(bill.total)}</p>
              <p className="text-xs text-muted mt-1">
                Subtotal {formatCurrency(bill.subtotal)} + CGST 2.5% ({formatCurrency(bill.cgst)}) + SGST 2.5% ({formatCurrency(bill.sgst)})
              </p>
            </div>

            {/* Method Select Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['cash', 'upi', 'card', 'split'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'h-11 rounded-xl text-xs font-bold uppercase border transition-all btn-press',
                    method === m ? 'bg-accent text-black border-accent' : 'border-line text-muted hover:text-ink bg-surface2'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Cash Method Input */}
            {method === 'cash' && (
              <div className="mb-4 space-y-2">
                <label className="text-xs text-muted font-semibold uppercase block">Cash Received (₹)</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl bg-surface2 border border-line text-lg font-bold tabular text-ink focus:border-accent focus:outline-none"
                />
                {cashReceived && (
                  <p className={cn('text-xs font-bold mt-1', cashChange >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {cashChange >= 0 ? `Return Change: ${formatCurrency(cashChange)}` : `Customer Owes: ${formatCurrency(Math.abs(cashChange))}`}
                  </p>
                )}
              </div>
            )}

            {/* Dynamic UPI QR Code */}
            {method === 'upi' && (
              <div className="mb-4 p-4 rounded-xl bg-surface2 border border-line text-center">
                <div className="w-36 h-36 mx-auto bg-white rounded-xl p-2 flex items-center justify-center border shadow-inner mb-2">
                  {/* Dynamic QR SVG mock */}
                  <svg className="w-full h-full text-black" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="#fff" />
                    <rect x="10" y="10" width="30" height="30" fill="#000" />
                    <rect x="15" y="15" width="20" height="20" fill="#fff" />
                    <rect x="20" y="20" width="10" height="10" fill="#000" />
                    <rect x="60" y="10" width="30" height="30" fill="#000" />
                    <rect x="65" y="15" width="20" height="20" fill="#fff" />
                    <rect x="70" y="20" width="10" height="10" fill="#000" />
                    <rect x="10" y="60" width="30" height="30" fill="#000" />
                    <rect x="45" y="45" width="20" height="20" fill="#000" />
                  </svg>
                </div>
                <p className="text-xs text-muted font-medium">Scan with GPay / PhonePe / Paytm</p>
                <p className="text-sm font-bold text-accent mt-0.5">UPI Amount: {formatCurrency(bill.total)}</p>
              </div>
            )}

            {/* Split Payment Inputs */}
            {method === 'split' && (
              <div className="mb-4 space-y-2 p-3 rounded-xl bg-surface2 border border-line text-xs">
                <div className="flex items-center justify-between">
                  <label>Cash Part (₹):</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={e => setSplitCash(parseFloat(e.target.value) || 0)}
                    className="w-28 h-9 px-2 rounded-lg bg-surface border border-line font-bold tabular"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>UPI Part (₹):</label>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={e => setSplitUpi(parseFloat(e.target.value) || 0)}
                    className="w-28 h-9 px-2 rounded-lg bg-surface border border-line font-bold tabular"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>Card Part (₹):</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={e => setSplitCard(parseFloat(e.target.value) || 0)}
                    className="w-28 h-9 px-2 rounded-lg bg-surface border border-line font-bold tabular"
                  />
                </div>
              </div>
            )}

            {/* Optional Customer Phone for WhatsApp Receipt */}
            <div className="mb-5">
              <label className="text-xs text-muted font-semibold uppercase mb-1 block">Customer Phone for WhatsApp Receipt (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCollectId(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                Cancel
              </button>
              <button
                onClick={handleConfirmCollect}
                className="flex-1 h-11 rounded-xl bg-accent text-black text-sm font-bold btn-press shadow-lg"
              >
                Confirm Payment ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Discount Modal */}
      {showDiscountModal && bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDiscountModal(false)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Apply Discount</h3>
            <p className="text-sm text-muted mb-4">Requires Manager PIN. Maximum 30% discount allowed.</p>

            <form onSubmit={handleApplyDiscount} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Discount Percentage (%)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={discountPercent}
                  onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm font-bold tabular focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block flex items-center gap-1">
                  <Lock size={12} /> Manager PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={discountPin}
                  onChange={e => setDiscountPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (default 9999)"
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm text-center font-mono focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowDiscountModal(false)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                  Cancel
                </button>
                <button type="submit" className="flex-1 h-11 rounded-xl bg-accent text-black font-bold text-sm btn-press">
                  Apply Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void / Refund Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVoidModal(null)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-red-400 mb-1">Void / Refund Bill</h3>
            <p className="text-sm text-muted mb-4">Requires Manager PIN and mandatory reason. Action is logged in audit trail.</p>

            <form onSubmit={handleVoidRefund} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Reason for Void / Refund</label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  placeholder="e.g. Wrong bill / Customer complaint"
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block flex items-center gap-1">
                  <Lock size={12} /> Manager PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={voidPin}
                  onChange={e => setVoidPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (default 9999)"
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm text-center font-mono focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowVoidModal(null)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                  Cancel
                </button>
                <button type="submit" className="flex-1 h-11 rounded-xl bg-red-500 text-white font-bold text-sm btn-press">
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
