/**
 * ===================================================================
 * QR DINE — SECTION 10: FINANCIALS & APPROVALS (DEEP DIVE) [BOTH]
 * 10.1 Day Close (Z-Report & Cash Reconciliation with > ₹100 Discrepancy Reason)
 * 10.2 Approvals Inbox (Fraud Prevention, Discount Escalation to Owner PIN)
 * 10.3 GST Compliance [OWNER ONLY] & Petty Cash Ledger [BOTH]
 * ===================================================================
 */

let activeFinancialsSubTab = 'dayclose'; // 'dayclose', 'approvals', 'gst', 'petty'

function renderFinancials(el) {
  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Financials, Day-Close & Approvals', 'Cash reconciliation, Z-Reports, approvals, and petty cash',
        `<div class="flex items-center gap-2">
          <button onclick="switchFinancialsTab('dayclose')" id="fin-tab-dayclose"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeFinancialsSubTab === 'dayclose' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            🌙 Day Close & Z-Report
          </button>
          <button onclick="switchFinancialsTab('approvals')" id="fin-tab-approvals"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeFinancialsSubTab === 'approvals' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            🛡 Approvals Inbox (${STATE.approvals.filter(a => a.status === 'Pending').length})
          </button>
          <button onclick="switchFinancialsTab('gst')" id="fin-tab-gst"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeFinancialsSubTab === 'gst' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            📋 GST & Invoicing ${!isOwner() ? icon('lock') : ''}
          </button>
          <button onclick="switchFinancialsTab('petty')" id="fin-tab-petty"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeFinancialsSubTab === 'petty' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            💰 Petty Cash Ledger
          </button>
        </div>`)}

      <div id="financials-tab-container"></div>
    </div>
  `;

  renderFinancialsSubTabContent();
}

function switchFinancialsTab(tab) {
  activeFinancialsSubTab = tab;
  renderFinancialsSubTabContent();

  ['dayclose', 'approvals', 'gst', 'petty'].forEach(t => {
    const btn = document.getElementById(`fin-tab-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-saffron-500 text-black shadow-md';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-gray-400 hover:text-white bg-dark-700/50';
      }
    }
  });
}

function renderFinancialsSubTabContent() {
  const container = document.getElementById('financials-tab-container');
  if (!container) return;

  if (activeFinancialsSubTab === 'dayclose') {
    renderDayCloseView(container);
  } else if (activeFinancialsSubTab === 'approvals') {
    renderApprovalsInboxView(container);
  } else if (activeFinancialsSubTab === 'gst') {
    renderGSTInvoicingView(container);
  } else {
    renderPettyCashView(container);
  }
}

// ===================================================================
// 10.1 DAY CLOSE & CASH RECONCILIATION (Z-REPORT)
// ===================================================================
function renderDayCloseView(el) {
  const discrepancy = STATE.financials.actualDrawerCash - STATE.financials.expectedCash;
  const isFlagged = Math.abs(discrepancy) > 50;

  el.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">End-Of-Day Cash Drawer Reconciliation</h3>
          <p class="text-xs text-gray-400">Reconcile physical cash counted in drawer against automated POS collections.</p>
        </div>
        <button onclick="openEndOfWeekModal()" class="btn-primary px-4 py-2 rounded-lg text-xs font-bold shadow-md">
          🌙 Start End of Day (Z-Report)
        </button>
      </div>

      <!-- 3 Key Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="glass-card rounded-2xl p-5">
          <div class="text-xs text-gray-400 uppercase font-semibold">Expected Cash in Drawer</div>
          <div class="text-2xl font-extrabold text-white mt-1">${formatINR(STATE.financials.expectedCash)}</div>
          <div class="text-[11px] text-gray-400 mt-1">Calculated from all settled cash orders</div>
        </div>

        <div class="glass-card rounded-2xl p-5">
          <div class="text-xs text-gray-400 uppercase font-semibold">Physical Counted Cash</div>
          <div class="text-2xl font-extrabold text-white mt-1">${formatINR(STATE.financials.actualDrawerCash)}</div>
          <div class="text-[11px] text-gray-400 mt-1">Counted by Manager at drawer close</div>
        </div>

        <div class="glass-card rounded-2xl p-5 border ${isFlagged ? 'border-red-500/40 bg-red-500/5' : 'border-green-500/30'}">
          <div class="text-xs ${isFlagged ? 'text-red-400' : 'text-green-400'} uppercase font-semibold">
            ${isFlagged ? 'Cash Discrepancy Flag' : 'Reconciliation Status'}
          </div>
          <div class="text-2xl font-extrabold ${isFlagged ? 'text-red-400' : 'text-green-400'} mt-1">
            ${discrepancy < 0 ? '-' : '+'}${formatINR(Math.abs(discrepancy))}
          </div>
          <div class="text-[11px] ${isFlagged ? 'text-red-300 font-bold' : 'text-green-300'} mt-1">
            ${isFlagged ? '⚠ Discrepancy > ₹50 threshold (Requires Reason)' : 'Balanced drawer'}
          </div>
        </div>
      </div>

      <!-- Today's Payment Channel Doughnut -->
      <div class="glass-card rounded-2xl p-5">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-4">Day Payment Channel Distribution</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div class="h-48">
            <canvas id="dayClosePaymentChart"></canvas>
          </div>
          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-dark-700/50 flex justify-between">
              <span>UPI (Google Pay, PhonePe, Paytm QR)</span>
              <strong class="text-saffron-400">${formatINR(STATE.financials.collections.upi)} (59.6%)</strong>
            </div>
            <div class="p-3 rounded-xl bg-dark-700/50 flex justify-between">
              <span>Cash Payments (Drawer)</span>
              <strong class="text-green-400">${formatINR(STATE.financials.collections.cash)} (26.0%)</strong>
            </div>
            <div class="p-3 rounded-xl bg-dark-700/50 flex justify-between">
              <span>Credit & Debit Cards (EDC Terminal)</span>
              <strong class="text-blue-400">${formatINR(STATE.financials.collections.card)} (14.4%)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const ctx = document.getElementById('dayClosePaymentChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['UPI', 'Cash', 'Card'],
        datasets: [{
          data: [STATE.financials.collections.upi, STATE.financials.collections.cash, STATE.financials.collections.card],
          backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6'],
          borderWidth: 0
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#aaa', font: { size: 10 } } } }
      }
    });
  }, 50);
}

// 10.1 "End of Day" Process Modal
function openEndOfWeekModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-bold text-white">End of Day (Z-Report Finalization)</h3>
        <p class="text-xs text-gray-400">Step-by-step cash counting and discrepancy audit.</p>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form onsubmit="handleFinalizeDaySubmit(event)" class="space-y-4 text-xs">
      <div class="p-3 rounded-xl bg-dark-700/60 border border-white/5 space-y-1">
        <div class="flex justify-between text-gray-300">
          <span>Expected Cash in Register:</span>
          <span class="font-bold text-white text-sm">${formatINR(STATE.financials.expectedCash)}</span>
        </div>
        <div class="text-[10px] text-gray-500">Calculated automatically from all settled cash receipts.</div>
      </div>

      <div>
        <label class="block text-gray-400 mb-1 font-semibold text-white">Step 2: Enter Actual Cash Counted in Drawer (₹) *</label>
        <input type="number" id="actual-cash-input" name="actualCash" required value="${STATE.financials.actualDrawerCash}"
               oninput="checkDiscrepancyInput(this.value)" class="w-full p-2.5 rounded-lg text-sm font-bold font-mono" />
      </div>

      <!-- Discrepancy Alert Box (Section 10.1 Step 3) -->
      <div id="discrepancy-warning-box" class="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-300 text-xs">
        <div class="font-bold flex items-center gap-1.5">
          <span>⚠ Discrepancy of ₹70 detected (Above ₹50 threshold)!</span>
        </div>
        <div class="mt-2">
          <label class="block text-white mb-1 font-semibold">Mandatory Reason Required *</label>
          <textarea name="discrepancyReason" required rows="2" placeholder="e.g. Returned ₹70 excess change to customer on Bill #B-098"
                    class="w-full p-2 rounded-lg text-xs"></textarea>
        </div>
      </div>

      <div class="text-[11px] text-gray-400">
        Action: "Finalize Day" freezes all orders for today, locks cash ledgers, generates the Z-Report PDF, and dispatches the summary to the Owner's WhatsApp.
      </div>

      <div class="flex gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Finalize Day & Send Z-Report</button>
      </div>
    </form>
  `);
}

function checkDiscrepancyInput(val) {
  const actual = Number(val) || 0;
  const diff = Math.abs(actual - STATE.financials.expectedCash);
  const box = document.getElementById('discrepancy-warning-box');
  if (!box) return;

  if (diff > 50) {
    box.classList.remove('hidden');
    box.querySelector('textarea').required = true;
  } else {
    box.classList.add('hidden');
    box.querySelector('textarea').required = false;
  }
}

function handleFinalizeDaySubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  STATE.financials.actualDrawerCash = Number(fd.get('actualCash')) || STATE.financials.actualDrawerCash;
  STATE.financials.discrepancyReason = fd.get('discrepancyReason') || '';
  STATE.financials.dayFinalized = true;

  closeModal();
  renderDayCloseView(document.getElementById('financials-tab-container'));
  showToast('Day Finalized. Z-Report PDF Generated & Sent to Owner WhatsApp.', 'success');
}

// ===================================================================
// 10.2 APPROVALS INBOX (DISCOUNT LIMIT ESCALATION TO OWNER PIN)
// ===================================================================
function renderApprovalsInboxView(el) {
  const pending = STATE.approvals.filter(a => a.status === 'Pending');

  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Supervisor Approvals Queue (${pending.length} Pending)</h3>
          <p class="text-xs text-gray-400">Discounts above Manager limit (${STATE.settings.managerDiscountLimit}%) strictly escalate to Owner PIN.</p>
        </div>
      </div>

      <div class="space-y-3">
        ${STATE.approvals.map(a => {
          const exceedsManagerLimit = a.type === 'Discount' && a.discountPct > STATE.settings.managerDiscountLimit;

          return `
            <div class="glass-card rounded-2xl p-4 border ${exceedsManagerLimit ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'}">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-dark-700 text-saffron-400 font-extrabold flex items-center justify-center text-sm shrink-0">
                    ${a.type === 'Discount' ? '%' : a.type === 'Void Item' ? '✕' : 'PO'}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-white">${a.billId} — ${a.type}</span>
                      <span class="text-xs font-extrabold text-saffron-400">${formatINR(a.amount)}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${exceedsManagerLimit ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}">
                        ${exceedsManagerLimit ? 'Requires Owner PIN (>15%)' : 'Manager Limit OK'}
                      </span>
                    </div>
                    <div class="text-xs text-gray-300 mt-1">Requested by: <strong>${a.requestor}</strong></div>
                    <div class="text-xs text-gray-400">Reason: "${a.reason}"</div>
                  </div>
                </div>

                ${a.status === 'Pending' ? `
                  <div class="flex items-center gap-2 shrink-0">
                    <button onclick="rejectApprovalItem(${a.id})" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                      Reject
                    </button>
                    <button onclick="approveWithLimitCheck(${a.id})" class="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <span>Approve</span>
                      ${exceedsManagerLimit ? icon('lock') : ''}
                    </button>
                  </div>
                ` : `
                  <span class="text-xs px-2.5 py-1 rounded-full font-bold ${a.status === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                    ${a.status}
                  </span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function approveWithLimitCheck(approvalId) {
  const a = STATE.approvals.find(x => x.id === approvalId);
  if (!a) return;

  const exceedsLimit = a.type === 'Discount' && a.discountPct > STATE.settings.managerDiscountLimit;

  if (exceedsLimit && !isOwner()) {
    // Escalate to Owner Override Protocol (Section 10.2)
    requestOwnerOverride(`High Discount (${a.discountPct}%) on ${a.billId}`, () => {
      a.status = 'Approved';
      renderApprovalsInboxView(document.getElementById('financials-tab-container'));
      renderSidebar();
      showToast(`Discount authorized via Owner Override for ${a.billId}`, 'success');
    });
    return;
  }

  // Otherwise standard Manager PIN prompt
  const pin = prompt(`Enter Manager PIN to approve ${a.billId} (${a.type}):\n(Default: 1234)`);
  if (!pin) return;

  if (pin === STATE.managerPin || pin === STATE.ownerPin) {
    a.status = 'Approved';
    renderApprovalsInboxView(document.getElementById('financials-tab-container'));
    renderSidebar();
    showToast(`Approved ${a.type} for ${a.billId}`, 'success');
  } else {
    showToast('Invalid Manager PIN. Action rejected.', 'error');
  }
}

function rejectApprovalItem(approvalId) {
  const a = STATE.approvals.find(x => x.id === approvalId);
  if (!a) return;
  a.status = 'Rejected';
  renderApprovalsInboxView(document.getElementById('financials-tab-container'));
  renderSidebar();
  showToast(`Rejected request for ${a.billId}`, 'error');
}

// ===================================================================
// 10.3 GST & INVOICING [OWNER ONLY]
// ===================================================================
function renderGSTInvoicingView(el) {
  el.innerHTML = `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">GST Compliance & GSTR-1 Draft</h3>
          <p class="text-xs text-gray-400">Sequential invoice numbering per financial year with item-level CGST & SGST splitting.</p>
        </div>
        <button onclick="handleGSTR1Export()" class="btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
          <span>Download GSTR-1 JSON</span>
          ${!isOwner() ? icon('lock') : ''}
        </button>
      </div>

      <!-- GST Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="glass-card rounded-2xl p-4">
          <div class="text-xs text-gray-400 uppercase font-semibold">Registered GSTIN</div>
          <div class="text-sm font-bold text-white font-mono mt-1">${STATE.settings.gstin}</div>
          <div class="text-[11px] text-gray-400 mt-0.5">Karnataka State (Code 29)</div>
        </div>

        <div class="glass-card rounded-2xl p-4">
          <div class="text-xs text-gray-400 uppercase font-semibold">Restaurant Composition Rate</div>
          <div class="text-lg font-extrabold text-saffron-400 mt-1">5.0% Flat (No ITC)</div>
          <div class="text-[11px] text-gray-400 mt-0.5">CGST 2.5% + SGST 2.5%</div>
        </div>

        <div class="glass-card rounded-2xl p-4">
          <div class="text-xs text-gray-400 uppercase font-semibold">Month-to-Date Tax Collected</div>
          <div class="text-lg font-extrabold text-white mt-1">₹42,115</div>
          <div class="text-[11px] text-green-400 mt-0.5">Reconciled against 1,240 bills</div>
        </div>
      </div>

      <!-- Sample Invoice Tax Table -->
      <div class="glass-card rounded-2xl p-5">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Item-Level Tax Invoice Breakdown (Sample)</h4>
        <table class="w-full text-xs text-left">
          <thead class="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-[11px]">
            <tr>
              <th class="p-2.5">Item</th>
              <th class="p-2.5 text-right">Taxable Val</th>
              <th class="p-2.5 text-right">CGST (2.5%)</th>
              <th class="p-2.5 text-right">SGST (2.5%)</th>
              <th class="p-2.5 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr>
              <td class="p-2.5 font-bold text-white">Paneer Butter Masala</td>
              <td class="p-2.5 text-right font-mono">304.76</td>
              <td class="p-2.5 text-right font-mono">7.62</td>
              <td class="p-2.5 text-right font-mono">7.62</td>
              <td class="p-2.5 text-right font-bold text-white">320.00</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-white">Garlic Naan ×2</td>
              <td class="p-2.5 text-right font-mono">152.38</td>
              <td class="p-2.5 text-right font-mono">3.81</td>
              <td class="p-2.5 text-right font-mono">3.81</td>
              <td class="p-2.5 text-right font-bold text-white">160.00</td>
            </tr>
            <tr class="font-bold text-white bg-white/5">
              <td class="p-2.5">Invoice Total</td>
              <td class="p-2.5 text-right font-mono text-saffron-400">457.14</td>
              <td class="p-2.5 text-right font-mono">11.43</td>
              <td class="p-2.5 text-right font-mono">11.43</td>
              <td class="p-2.5 text-right font-extrabold text-saffron-400 text-sm">480.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ===================================================================
// 10.4 PETTY CASH LEDGER [BOTH]
// ===================================================================
function renderPettyCashView(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Petty Cash Daily Outflow Ledger</h3>
          <p class="text-xs text-gray-400">Expenses logged here instantly debit from daily cash flow and hit P&L.</p>
        </div>
        <button onclick="openAddPettyCashModal()" class="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold">
          + Record Petty Expense
        </button>
      </div>

      <div class="glass-card rounded-2xl overflow-hidden">
        <table class="w-full text-xs text-left">
          <thead class="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-[11px]">
            <tr>
              <th class="p-3">Date</th>
              <th class="p-3">Category</th>
              <th class="p-3">Payee / Vendor</th>
              <th class="p-3">Approved By</th>
              <th class="p-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${STATE.pettyCash.map(pc => `
              <tr class="table-row">
                <td class="p-3 font-mono text-gray-400">${pc.date}</td>
                <td class="p-3 font-bold text-white">${pc.category}</td>
                <td class="p-3 text-gray-300">${pc.payee}</td>
                <td class="p-3 text-gray-400">${pc.approvedBy}</td>
                <td class="p-3 text-right font-extrabold text-red-400">-${formatINR(pc.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddPettyCashModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <h3 class="text-base font-bold text-white">Record Petty Cash Outflow</h3>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>
    <form onsubmit="handlePettyCashSubmit(event)" class="space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1">Expense Category *</label>
        <select name="category" class="w-full p-2.5 rounded-lg">
          <option value="Cleaning Supplies">Cleaning & Housekeeping Supplies</option>
          <option value="Staff Tea / Refreshments">Staff Tea / Break Refreshments</option>
          <option value="Emergency Grocery Purchase">Emergency Local Grocery Run</option>
          <option value="Minor Plumbing / Electrical">Minor Electrical / Plumbing Repair</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Amount Paid (₹) *</label>
          <input type="number" name="amount" required placeholder="350" class="w-full p-2.5 rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Payee / Merchant Name *</label>
          <input type="text" name="payee" required placeholder="e.g. Mahadev Hardware" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>
      <div>
        <label class="block text-gray-400 mb-1">Attach Receipt / Voucher Photo (Optional)</label>
        <input type="file" class="w-full p-2 rounded-lg bg-dark-700/60 text-gray-400" />
      </div>
      <div class="flex gap-2 pt-3">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Debit Petty Cash</button>
      </div>
    </form>
  `);
}

function handlePettyCashSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const newPC = {
    id: STATE.pettyCash.length + 1,
    date: 'Today',
    category: fd.get('category'),
    payee: fd.get('payee'),
    amount: Number(fd.get('amount')) || 0,
    approvedBy: STATE.user.name
  };
  STATE.pettyCash.push(newPC);
  closeModal();
  renderPettyCashView(document.getElementById('financials-tab-container'));
  showToast(`Recorded petty cash debit of ${formatINR(newPC.amount)}`, 'success');
}
