import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn } from '../../utils/cn';
import type { LeaveType } from '../../types';

export function Leave() {
  const { user, leaveRequests, submitLeave } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [type, setType] = useState<LeaveType>('casual');
  const [reason, setReason] = useState('');
  const [halfDay, setHalfDay] = useState(false);

  if (!user) return null;

  const myLeaves = leaveRequests.filter(l => l.staff_id === user.id);

  const balances = [
    { label: 'Casual', remaining: 8, total: 12, color: 'text-blue-400' },
    { label: 'Sick', remaining: 5, total: 6, color: 'text-green-400' },
    { label: 'Paid', remaining: 3, total: 5, color: 'text-accent' },
  ];

  const handleSubmit = () => {
    if (!fromDate || !toDate || reason.length < 10) return;
    submitLeave({ from_date: fromDate, to_date: toDate, type, reason, half_day: halfDay });
    setShowModal(false);
    setFromDate('');
    setToDate('');
    setReason('');
    setHalfDay(false);
  };

  const statusBadge = (s: string) => {
    if (s === 'pending') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (s === 'approved') return 'bg-green-500/15 text-green-400 border-green-500/30';
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  };

  return (
    <div className="p-5 max-w-[900px] mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Leave</p>
          <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-sm text-muted mt-1">Submit requests · Approval via Manager panel (future)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 h-11 rounded-xl bg-accent text-black font-bold text-sm btn-press"
        >
          + Request Leave
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {balances.map(b => (
          <div key={b.label} className="card p-4">
            <p className="text-xs text-muted mb-1">{b.label} Leave</p>
            <p className={cn('text-3xl font-bold tabular', b.color)}>{b.remaining}</p>
            <p className="text-[11px] text-muted">of {b.total} remaining</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-line">
          <h2 className="text-sm font-semibold">Request History</h2>
        </div>
        {myLeaves.length === 0 ? (
          <div className="p-10 text-center text-muted">
            <p className="text-3xl mb-2">🌴</p>
            <p className="font-medium">Koi leave request nahi hai</p>
            <p className="text-sm mt-1">Submit your first request above</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {myLeaves.map(l => (
              <div key={l.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm capitalize">{l.type} Leave</p>
                  <p className="text-xs text-muted mt-0.5">
                    {l.from_date} → {l.to_date} {l.half_day && '· Half day'}
                  </p>
                  <p className="text-xs text-muted mt-1 max-w-md truncate">{l.reason}</p>
                </div>
                <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border', statusBadge(l.status))}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Request Leave</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">From</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">To</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Type</label>
                <select value={type} onChange={e => setType(e.target.value as LeaveType)}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none">
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Reason (min 10 chars)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none resize-none"
                  placeholder="Why do you need leave?" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={halfDay} onChange={e => setHalfDay(e.target.checked)} className="rounded" />
                Half-day leave
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">Cancel</button>
              <button onClick={handleSubmit} disabled={reason.length < 10 || !fromDate || !toDate}
                className="flex-1 h-11 rounded-xl bg-accent text-black text-sm font-bold btn-press disabled:opacity-50">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
