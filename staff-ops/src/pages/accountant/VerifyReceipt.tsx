import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { Search, ShieldCheck, ShieldAlert, ShieldX, QrCode, Printer, Send, AlertOctagon } from 'lucide-react';
import type { ReceiptVerificationResult } from '../../types';

export function VerifyReceipt() {
  const { bills, addToast, pushNotification } = useApp();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ReceiptVerificationResult | null>(null);
  const [recentScans, setRecentScans] = useState<ReceiptVerificationResult[]>([]);

  const handleVerify = (searchCode: string) => {
    const q = searchCode.trim().toUpperCase();
    if (!q) return;

    // Search bill by receipt_code or verify_code
    const bill = bills.find(b =>
      (b.receipt_code && b.receipt_code.toUpperCase() === q) ||
      (b.verify_code && b.verify_code.toUpperCase() === q)
    );

    let res: ReceiptVerificationResult;

    if (!bill) {
      res = {
        receipt_code: q,
        status: 'invalid',
        scan_count: 0,
        fraud_flag: false,
        reason: 'Receipt code not found in backend database.',
        timestamp: new Date().toISOString(),
      };
    } else if (bill.status !== 'paid') {
      res = {
        receipt_code: bill.receipt_code || q,
        status: 'tampered',
        bill,
        scan_count: bill.scan_count + 1,
        fraud_flag: true,
        reason: 'Bill is not marked as PAID in database.',
        timestamp: new Date().toISOString(),
      };
    } else {
      const newScanCount = bill.scan_count + 1;
      bill.scan_count = newScanCount; // increment scan count
      const isFraud = newScanCount > 3;

      res = {
        receipt_code: bill.receipt_code || q,
        status: 'valid',
        bill,
        scan_count: newScanCount,
        fraud_flag: isFraud,
        reason: isFraud ? `Receipt scanned ${newScanCount} times! High fraud alert.` : undefined,
        timestamp: new Date().toISOString(),
      };

      if (isFraud) {
        pushNotification('fraud_alert', { receiptCode: bill.receipt_code, scanCount: newScanCount }, 'manager');
      }
    }

    setResult(res);
    setRecentScans(prev => [res, ...prev.slice(0, 11)]);
  };

  const handleResendWhatsApp = () => {
    if (!result?.bill) return;
    addToast('success', `WhatsApp receipt resent to ${result.bill.customer_phone || 'customer'}`);
    pushNotification('whatsapp_resent', { receiptCode: result.receipt_code }, 'manager');
  };

  const handleReportFraud = () => {
    if (!result) return;
    pushNotification('fraud_reported', { receiptCode: result.receipt_code, reason: result.reason }, 'manager');
    addToast('warning', 'Fraud report filed and sent to Manager Queue');
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Accountant Desk</p>
        <h1 className="text-2xl font-bold tracking-tight">Verify Receipt & Fraud Guard</h1>
        <p className="text-sm text-muted mt-1">Sub-tab inside Accountant Panel. Validate receipts, check verification codes, and detect tamper or double-claims.</p>
      </div>

      {/* Input Box */}
      <div className="card p-5 mb-6 space-y-4">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
          Scan QR Code or Enter Receipt ID / Verification Code:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify(query)}
              placeholder="e.g. RCP-20260514-0042 or XK7M2P9Q"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface2 border border-line text-sm text-ink font-mono uppercase focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleVerify(query)}
            className="px-6 h-12 rounded-xl bg-accent text-black font-bold text-sm btn-press shrink-0 flex items-center gap-2"
          >
            <ShieldCheck size={18} /> Verify Receipt
          </button>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-2 pt-1 text-xs text-muted">
          <span>Quick Test Samples:</span>
          {bills.filter(b => b.receipt_code).slice(0, 3).map(b => (
            <button
              key={b.id}
              onClick={() => { setQuery(b.receipt_code || ''); handleVerify(b.receipt_code || ''); }}
              className="px-2.5 py-1 rounded bg-surface2 hover:bg-surface text-ink font-mono border border-line"
            >
              {b.receipt_code}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Result Shield */}
      {result && (
        <div className="card p-6 mb-8 border-2 transition-all">
          {result.status === 'valid' && !result.fraud_flag && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={36} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-green-400">VALID RECEIPT ✓</h2>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                    Authentic
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">Receipt ID matches paid record in system database.</p>
              </div>
            </div>
          )}

          {result.status === 'valid' && result.fraud_flag && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertOctagon size={36} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-amber-400">HIGH FRAUD ALERT (Multiple Scans)</h2>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase animate-pulse">
                    Scan Count: {result.scan_count}
                  </span>
                </div>
                <p className="text-sm text-amber-300 font-semibold mt-1">
                  ⚠️ Yeh receipt pehle bhi {result.scan_count - 1} baar scan ho chuki hai. Possible fraud/double claim!
                </p>
              </div>
            </div>
          )}

          {result.status === 'invalid' && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ShieldX size={36} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-red-400">INVALID RECEIPT ✗</h2>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase">
                    Not Found
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{result.reason}</p>
              </div>
            </div>
          )}

          {result.status === 'tampered' && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={36} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-amber-400">POSSIBLE TAMPERING DETECTED</h2>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase">
                    Unpaid Status
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{result.reason}</p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          {result.bill && (
            <div className="mt-6 pt-5 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-muted">Table & Token</p>
                <p className="text-sm font-bold text-ink">{result.bill.table_number} · #{result.bill.token}</p>
              </div>
              <div>
                <p className="text-muted">Total Amount</p>
                <p className="text-sm font-bold text-accent tabular">{formatCurrency(result.bill.total)}</p>
              </div>
              <div>
                <p className="text-muted">Payment Method</p>
                <p className="text-sm font-bold text-ink uppercase">{result.bill.method || 'Cash'}</p>
              </div>
              <div>
                <p className="text-muted">Verify Code</p>
                <p className="text-sm font-mono font-bold text-purple-400">{result.bill.verify_code}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-line/60">
            {result.bill && (
              <>
                <button
                  onClick={handleResendWhatsApp}
                  className="h-10 px-4 rounded-xl bg-surface2 border border-line text-sm font-medium text-ink hover:bg-surface btn-press flex items-center gap-2"
                >
                  <Send size={14} /> Resend WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="h-10 px-4 rounded-xl bg-surface2 border border-line text-sm font-medium text-ink hover:bg-surface btn-press flex items-center gap-2"
                >
                  <Printer size={14} /> Print Stub
                </button>
              </>
            )}
            <button
              onClick={handleReportFraud}
              className="h-10 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-bold text-red-400 hover:bg-red-500/20 btn-press ml-auto flex items-center gap-2"
            >
              <AlertOctagon size={14} /> Report Fraud
            </button>
          </div>
        </div>
      )}

      {/* Recent Log Table */}
      <div className="card p-5">
        <h3 className="font-bold text-sm uppercase text-muted tracking-wider mb-3">Recent Verification Scans (Session Log)</h3>
        {recentScans.length === 0 ? (
          <p className="text-xs text-muted">No scans performed in this session yet.</p>
        ) : (
          <div className="space-y-2">
            {recentScans.map((sc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold">{sc.receipt_code}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded font-bold uppercase text-[10px]',
                    sc.status === 'valid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {sc.status}
                  </span>
                  {sc.fraud_flag && <span className="text-amber-400 font-bold">⚠️ Scan #{sc.scan_count}</span>}
                </div>
                <span className="text-muted">{new Date(sc.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
