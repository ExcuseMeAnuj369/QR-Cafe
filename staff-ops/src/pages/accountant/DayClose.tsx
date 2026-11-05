import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { FileText, Printer, Download, Lock, CheckCircle2, DollarSign, Wallet } from 'lucide-react';
import type { DayCloseRecord } from '../../types';

export function DayClose() {
  const { bills, pettyCash, user, addToast, pushNotification, dayCloseRecords, setDayCloseRecords } = useApp();
  const [actualCash, setActualCash] = useState<string>('');
  const [closed, setClosed] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const paidBills = bills.filter(b => b.status === 'paid');

  const totalSales = paidBills.reduce((sum, b) => sum + b.total, 0);
  const cashSales = paidBills.filter(b => b.method === 'cash').reduce((sum, b) => sum + b.total, 0);
  const upiSales = paidBills.filter(b => b.method === 'upi').reduce((sum, b) => sum + b.total, 0);
  const cardSales = paidBills.filter(b => b.method === 'card').reduce((sum, b) => sum + b.total, 0);

  const pettyCashTotal = pettyCash.reduce((sum, p) => sum + p.amount, 0);
  const refundsTotal = bills.filter(b => b.status === 'void').reduce((sum, b) => sum + b.total, 0);

  const netEarnings = totalSales - pettyCashTotal - refundsTotal;
  const expectedCashInDrawer = cashSales - pettyCashTotal;

  const actualCashNum = parseFloat(actualCash) || 0;
  const variance = actualCashNum - expectedCashInDrawer;

  const handleConfirmClose = () => {
    if (!user) return;
    if (!actualCash) {
      addToast('error', 'Please enter actual cash counted in drawer');
      return;
    }

    const record: DayCloseRecord = {
      id: `zc-${Date.now()}`,
      date: todayStr,
      total_sales: totalSales,
      cash_sales: cashSales,
      upi_sales: upiSales,
      card_sales: cardSales,
      tips: 0,
      petty_cash_spent: pettyCashTotal,
      refunds: refundsTotal,
      net_earnings: netEarnings,
      bill_count: paidBills.length,
      avg_bill_value: paidBills.length > 0 ? Math.round(totalSales / paidBills.length) : 0,
      expected_cash: expectedCashInDrawer,
      actual_cash: actualCashNum,
      cash_variance: variance,
      closed_by: user.name,
      closed_at: new Date().toISOString(),
      top_waiter: 'Priya Sharma',
    };

    setDayCloseRecords(prev => [...prev, record]);
    setClosed(true);
    addToast('success', 'Day closed successfully. Z-Report stored & locked.');
    pushNotification('day_closed', { recordId: record.id, netEarnings, variance }, 'manager');
  };

  const handleExportCSV = () => {
    const csvContent = `Date,Total Sales,Cash,UPI,Card,Petty Cash,Net Earnings\n${todayStr},${totalSales},${cashSales},${upiSales},${cardSales},${pettyCashTotal},${netEarnings}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Z-Report-${todayStr}.csv`;
    a.click();
    addToast('info', 'Z-Report CSV exported');
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Accountant Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">Day Close / Z-Report</h1>
          <p className="text-sm text-muted mt-1">Reconcile daily earnings, petty cash, cash drawer, and lock the business day.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="h-11 px-4 rounded-xl bg-surface2 border border-line text-sm font-semibold text-ink hover:bg-surface btn-press flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="h-11 px-4 rounded-xl bg-surface2 border border-line text-sm font-semibold text-ink hover:bg-surface btn-press flex items-center gap-2"
          >
            <Printer size={16} /> Print Z-Report
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-muted font-semibold uppercase">Total Sales</p>
          <p className="text-2xl font-extrabold text-accent tabular mt-1">{formatCurrency(totalSales)}</p>
          <p className="text-[11px] text-muted mt-1">{paidBills.length} bills settled</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-semibold uppercase">Petty Cash Spent</p>
          <p className="text-2xl font-extrabold text-amber-400 tabular mt-1">{formatCurrency(pettyCashTotal)}</p>
          <p className="text-[11px] text-muted mt-1">{pettyCash.length} entries</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-semibold uppercase">Refunds / Voids</p>
          <p className="text-2xl font-extrabold text-red-400 tabular mt-1">{formatCurrency(refundsTotal)}</p>
          <p className="text-[11px] text-muted mt-1">0 active disputes</p>
        </div>

        <div className="card p-4 border border-green-500/30 bg-green-500/5">
          <p className="text-xs text-green-400 font-bold uppercase">Net Earnings</p>
          <p className="text-2xl font-extrabold text-green-400 tabular mt-1">{formatCurrency(netEarnings)}</p>
          <p className="text-[11px] text-green-400/80 mt-1">Immutable on close</p>
        </div>
      </div>

      {/* Payment Method Split */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-bold uppercase text-muted tracking-wider mb-4">Payment Breakdown by Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface2 border border-line">
            <p className="text-xs text-muted">Cash Revenue</p>
            <p className="text-xl font-bold text-ink tabular">{formatCurrency(cashSales)}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface2 border border-line">
            <p className="text-xs text-muted">UPI Revenue</p>
            <p className="text-xl font-bold text-ink tabular">{formatCurrency(upiSales)}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface2 border border-line">
            <p className="text-xs text-muted">Card Revenue</p>
            <p className="text-xl font-bold text-ink tabular">{formatCurrency(cardSales)}</p>
          </div>
        </div>
      </div>

      {/* Cash Drawer Reconciliation */}
      <div className="card p-6 mb-8 border border-accent/30">
        <h3 className="text-base font-bold text-ink mb-1">Cash Drawer Reconciliation</h3>
        <p className="text-xs text-muted mb-4">Compare expected cash in drawer (Cash Sales − Petty Cash) against physical count.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-surface2 border border-line">
            <p className="text-xs text-muted">Expected Cash in Drawer</p>
            <p className="text-2xl font-bold text-accent tabular">{formatCurrency(expectedCashInDrawer)}</p>
          </div>

          <div>
            <label className="text-xs text-muted font-semibold uppercase mb-1 block">Actual Physical Cash Counted (₹)</label>
            <input
              type="number"
              disabled={closed}
              value={actualCash}
              onChange={e => setActualCash(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full h-12 px-3 rounded-xl bg-surface2 border border-line text-lg font-bold tabular text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div className={cn(
            'p-4 rounded-xl border',
            variance === 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            variance < 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-amber-500/10 border-amber-500/30 text-amber-400'
          )}>
            <p className="text-xs opacity-75 font-semibold">Cash Variance (Short / Excess)</p>
            <p className="text-2xl font-extrabold tabular">{formatCurrency(variance)}</p>
            <p className="text-[11px] mt-0.5">
              {variance === 0 ? 'Exact match ✓' : variance < 0 ? 'Cash shortage detected!' : 'Excess cash counted'}
            </p>
          </div>
        </div>

        {!closed ? (
          <button
            onClick={handleConfirmClose}
            className="w-full h-12 rounded-xl bg-accent text-black font-extrabold text-base btn-press flex items-center justify-center gap-2"
          >
            <Lock size={18} /> Confirm & Perform Day Close (Lock Bills)
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-center font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={20} /> Day Successfully Closed & Locked by {user?.name}
          </div>
        )}
      </div>

      {/* History Ledger */}
      {dayCloseRecords.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm uppercase text-muted tracking-wider mb-3">Past Z-Report Ledger</h3>
          <div className="space-y-2">
            {dayCloseRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-surface2 text-xs">
                <div>
                  <span className="font-bold text-ink">{r.date}</span>
                  <span className="text-muted ml-2">Closed by {r.closed_by}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted">{r.bill_count} bills</span>
                  <span className="font-bold text-accent tabular">{formatCurrency(r.net_earnings)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
