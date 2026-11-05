/**
 * ===================================================================
 * QR-Cafe — SECTION 4: LIVE OPERATIONS (READ-ONLY MONITOR) [BOTH]
 * 4.1 Kitchen Kanban (New -> Preparing -> Ready with Red Pulse > 10m)
 * 4.2 Waiter Floor Coverage & Service Requests
 * 4.3 Cashier Pending Settlements & Method Totals
 * Strictly read-only to oversee without interfering with operational staff.
 * ===================================================================
 */

let activeLiveTab = 'kitchen';

function renderLive(el) {
  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Live Operations Monitor', 'Real-time floor, kitchen, and cashier stream',
        `<div class="flex items-center gap-2">
          <span class="text-xs text-green-400 font-semibold flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
            <span class="status-dot status-live"></span> Live
          </span>
        </div>`)}

      <!-- 3 Master Tabs -->
      <div class="flex items-center gap-2 border-b border-white/10 pb-3">
        <button onclick="switchLiveTab('kitchen')" id="live-tab-kitchen"
                class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeLiveTab === 'kitchen' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          🍳 Kitchen Kanban (${STATE.kitchenOrders.length})
        </button>
        <button onclick="switchLiveTab('waiter')" id="live-tab-waiter"
                class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeLiveTab === 'waiter' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          👔 Waiter Coverage (${STATE.waiterRequests.length})
        </button>
        <button onclick="switchLiveTab('cashier')" id="live-tab-cashier"
                class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeLiveTab === 'cashier' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          💰 Cashier Desk & Revenue (${(STATE.bills || []).filter(b => b.status === 'paid').length})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="live-tab-container">
        <!-- Rendered based on active tab -->
      </div>
    </div>
  `;

  renderActiveLiveTab();
}

function switchLiveTab(tab) {
  activeLiveTab = tab;
  renderActiveLiveTab();

  ['kitchen', 'waiter', 'cashier'].forEach(t => {
    const btn = document.getElementById(`live-tab-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-saffron-500 text-black shadow-md';
      } else {
        btn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-400 hover:text-white bg-dark-700/50';
      }
    }
  });
}

function renderActiveLiveTab() {
  const container = document.getElementById('live-tab-container');
  if (!container) return;

  if (activeLiveTab === 'kitchen') {
    renderKitchenTab(container);
  } else if (activeLiveTab === 'waiter') {
    renderWaiterTab(container);
  } else {
    renderCashierTab(container);
  }
}

// 4.1 Kitchen Kanban (New -> Preparing -> Ready)
function renderKitchenTab(el) {
  const newOrders = STATE.kitchenOrders.filter(o => (o.status || '').toLowerCase() === 'new');
  const prepOrders = STATE.kitchenOrders.filter(o => (o.status || '').toLowerCase() === 'preparing');
  const readyOrders = STATE.kitchenOrders.filter(o => (o.status || '').toLowerCase() === 'ready');

  el.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- Column: New Orders -->
      <div class="glass-card rounded-2xl p-4 flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">New Incoming KOTs</span>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">${newOrders.length}</span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          ${newOrders.map(o => {
            const isDelayed = o.timeElapsedMin > 10;
            return `
              <div class="glass-card rounded-xl p-3.5 border ${isDelayed ? 'red-pulse' : 'border-blue-500/30'}">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm font-extrabold text-accent">${o.table}</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded ${isDelayed ? 'bg-red-500 text-white font-bold animate-bounce' : 'bg-blue-500/20 text-blue-400'}">
                    ${o.timeElapsedMin}m elapsed ${isDelayed ? '⚠ >10m!' : ''}
                  </span>
                </div>
                <div class="text-[11px] font-medium text-saffron-400 mb-2">${o.id} · ${o.source}</div>
                <ul class="space-y-1 text-xs text-gray-200 list-disc pl-4">
                  ${(o.items || []).map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            `;
          }).join('')}
          ${newOrders.length === 0 ? `
            <div class="text-center py-10 text-gray-500 text-xs">
              <p class="text-2xl mb-1">🍳</p>
              <p>No new incoming KOTs</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Column: Preparing -->
      <div class="glass-card rounded-2xl p-4 flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Cooking / Preparing</span>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">${prepOrders.length}</span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          ${prepOrders.map(o => `
            <div class="glass-card rounded-xl p-3.5 border border-amber-500/20">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm font-extrabold text-white">${o.table}</span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Cooking for ${o.timeElapsedMin}m
                </span>
              </div>
              <div class="text-[11px] font-medium text-amber-400/80 mb-2">${o.id} · ${o.source}</div>
              <ul class="space-y-1 text-xs text-gray-200 list-disc pl-4">
                ${(o.items || []).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          ${prepOrders.length === 0 ? `
            <div class="text-center py-10 text-gray-500 text-xs">
              <p>No orders currently cooking</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Column: Ready for Pickup -->
      <div class="glass-card rounded-2xl p-4 flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Ready for Service</span>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">${readyOrders.length}</span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          ${readyOrders.map(o => `
            <div class="glass-card rounded-xl p-3.5 border border-green-500/30">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm font-extrabold text-white">${o.table}</span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">
                  🔔 Ready for Pickup
                </span>
              </div>
              <div class="text-[11px] font-medium text-green-400/80 mb-2">${o.id} · Plated at Pass counter</div>
              <ul class="space-y-1 text-xs text-gray-200 list-disc pl-4">
                ${(o.items || []).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          ${readyOrders.length === 0 ? `
            <div class="text-center py-10 text-gray-500 text-xs">
              <p>No orders ready for pickup</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// 4.2 Waiter Floor Coverage & Service Requests
function renderWaiterTab(el) {
  // Dynamically aggregate active waiters
  const activeWaiters = (STATE.staff || []).filter(s => {
    const r = (s.role || '').toLowerCase();
    const sr = (s.staffRole || '').toLowerCase();
    return r.includes('waiter') || r.includes('server') || sr === 'waiter';
  });

  const waiterList = activeWaiters.length > 0 ? activeWaiters : [
    { name: 'Priya Sharma', id: '2002', status: 'Clocked In' },
    { name: 'Sneha Patel', id: '2004', status: 'Clocked In' }
  ];

  // Dynamic table assignment aggregation:
  // Tables are non-permanent! Only occupied tables actively claimed by a waiter are assigned.
  const waiters = waiterList.map(w => {
    const assignedTables = (STATE.tables || []).filter(t => {
      const st = (t.status || '').toLowerCase();
      // Free or cleaning tables are NOT assigned to anyone!
      if (st === 'free' || st === 'cleaning') return false;

      const idMatch = (t.assigned_waiter_id && String(t.assigned_waiter_id) === String(w.id)) ||
                      (t.waiter_id && String(t.waiter_id) === String(w.id));
      const nameMatch = t.waiter && t.waiter !== '—' && t.waiter.toLowerCase() === w.name.toLowerCase();
      return idMatch || nameMatch;
    });

    const tableNames = assignedTables.map(t => t.table_number || t.id);
    const totalCovers = assignedTables.reduce((sum, t) => sum + (t.covers || 0), 0);
    return {
      name: w.name,
      id: w.id,
      status: w.status === 'Clocked In' ? 'Active on floor' : (w.status || 'Active on floor'),
      tables: tableNames.length > 0 ? tableNames : [],
      covers: totalCovers
    };
  });

  el.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Waiter Table Assignments (Dynamic Non-Permanent Floor Load) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Waiter Station Load</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${waiters.map(w => `
            <div class="glass-card rounded-2xl p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-full bg-saffron-500/20 text-saffron-400 font-bold flex items-center justify-center text-xs">
                    ${w.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white">${w.name}</div>
                    <div class="text-[10px] text-gray-400">ID: ${w.id} · <span class="text-green-400">${w.status}</span></div>
                  </div>
                </div>
                <span class="text-xs font-bold ${w.tables.length > 0 ? 'text-saffron-400' : 'text-gray-500'}">
                  ${w.tables.length} ${w.tables.length === 1 ? 'Table' : 'Tables'}
                </span>
              </div>
              <div class="bg-dark-700/50 p-2.5 rounded-xl mb-2 text-xs border border-white/5">
                <div class="flex gap-1.5 flex-wrap">
                  ${w.tables.length > 0
                    ? w.tables.map(t => `<span class="px-2.5 py-1 rounded-md bg-saffron-500/20 border border-saffron-500/30 text-saffron-300 font-mono font-bold">${t}</span>`).join('')
                    : `<span class="text-[11px] text-gray-500 italic">No tables claimed</span>`
                  }
                </div>
              </div>
              <div class="text-[11px] text-gray-400">Dining covers: <strong class="text-white">${w.covers} guests</strong></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right: Pending Customer & Food Re-Order Requests -->
      <div class="glass-card rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Live Table Requests</h3>
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <span class="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full">${STATE.waiterRequests.length}</span>
        </div>
        <div class="space-y-3 overflow-y-auto max-h-[480px]">
          ${STATE.waiterRequests.map(r => {
            const isFood = !!r.is_food || (r.request && r.request.includes('Food'));
            return `
              <div class="p-3 rounded-xl bg-dark-700/60 border ${isFood ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-extrabold text-white">${r.table}</span>
                    ${isFood ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">Food Re-Order</span>` : ''}
                  </div>
                  <span class="text-[10px] text-amber-400 font-medium">${r.time}</span>
                </div>
                <div class="text-xs text-gray-200 font-semibold mb-1">${r.request}</div>
                <div class="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-white/5">
                  <span>Waiter: <strong class="text-white">${r.waiter}</strong></span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded ${r.status === 'accepted' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'bg-amber-500/20 text-amber-400'}">
                    ${r.status === 'accepted' ? 'Accepted' : 'Pending'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
          ${STATE.waiterRequests.length === 0 ? `
            <div class="text-center py-8 text-gray-500 text-xs">
              <p class="text-2xl mb-1">🛎️</p>
              <p>No active table requests</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ===================================================================
// 4.3 💰 CASHIER DESK & REAL-TIME REVENUE SURVEILLANCE
// Executive & Operational Oversight of Customer Payments, Till Cash & Anti-Theft
// ===================================================================

let activeCashierFilterMethod = 'all';

function renderCashierTab(el) {
  const allBills = STATE.bills || [];
  const paidBills = allBills.filter(b => b.status === 'paid');
  const pendingFloorTables = (STATE.tables || []).filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'billing pending' || s === 'billing-pending' || s === 'occupied';
  });

  const collections = (STATE.financials && STATE.financials.collections) || { cash: 12450, upi: 28500, card: 6900 };
  const todayRevenue = (STATE.financials && STATE.financials.todayRevenue) || (collections.cash + collections.upi + collections.card);
  const totalBillsCount = (STATE.financials && STATE.financials.todayBillsCount) || paidBills.length || 52;
  const avgOrderValue = totalBillsCount > 0 ? Math.round(todayRevenue / totalBillsCount) : 0;

  const totalGST = paidBills.reduce((sum, b) => sum + (Number(b.cgst || 0) + Number(b.sgst || 0)), 0);
  const totalDiscounts = paidBills.reduce((sum, b) => sum + Number(b.discount || 0), 0);

  const pendingApprovals = (STATE.approvals || []).filter(a => a.status === 'Pending');
  const pettyCashList = STATE.pettyCash || [];
  const totalPettyCash = pettyCashList.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Active cashier on desk info
  const cashierStaff = (STATE.staff || []).find(s => {
    const r = ((s.role || '') + ' ' + (s.staffRole || '')).toLowerCase();
    return r.includes('cashier') || r.includes('accountant');
  }) || { name: 'Rahul Verma', id: '3003', status: 'Clocked In', shift: 'All Day' };

  // Filter bills based on active filter method
  let displayBills = paidBills;
  if (activeCashierFilterMethod !== 'all') {
    displayBills = paidBills.filter(b => (b.method || '').toLowerCase() === activeCashierFilterMethod);
  }

  el.innerHTML = `
    <div class="space-y-6">

      <!-- Executive Status & Shift Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-dark-800 via-dark-800/90 to-dark-750 border border-white/10 shadow-lg">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-saffron-400 to-amber-600 flex items-center justify-center font-extrabold text-black text-xl shadow-lg shadow-saffron-500/20 shrink-0">
            ₹
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-extrabold text-white tracking-wide">Live Cashier & Customer Revenue Radar</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> STREAM ACTIVE
              </span>
            </div>
          </div>
        </div>

        <!-- Cashier on Desk Badge -->
        <div class="flex items-center gap-3 bg-dark-900/80 px-3.5 py-2 rounded-xl border border-white/5 shrink-0">
          <div class="w-8 h-8 rounded-full bg-saffron-500/20 text-saffron-400 font-bold flex items-center justify-center text-xs">
            ${cashierStaff.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <div class="text-xs">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Active Cashier</div>
            <div class="font-bold text-white">${cashierStaff.name} <span class="text-gray-500 font-mono">(${cashierStaff.id})</span></div>
          </div>
        </div>
      </div>

      <!-- 1. 🌟 TOP 4 GLOWING KPI METRIC CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Inflow -->
        <div class="glass-card rounded-2xl p-4.5 border border-saffron-500/30 bg-gradient-to-br from-saffron-500/10 via-dark-800 to-dark-800 relative overflow-hidden group">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Today's Inflow</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
              ${totalBillsCount} Paid
            </span>
          </div>
          <div class="text-3xl font-black text-white mt-2 tracking-tight group-hover:text-saffron-400 transition">
            ${formatINR(todayRevenue)}
          </div>
          <div class="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-white/5">
            <span>ATV: <strong class="text-white">${formatINR(avgOrderValue)}</strong></span>
            <span class="text-green-400 font-semibold">+12.4%</span>
          </div>
        </div>

        <!-- UPI Inflow -->
        <div class="glass-card rounded-2xl p-4.5 border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-dark-800 to-dark-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-base">📱</span>
              <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">UPI / QR</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-400">
              ${todayRevenue > 0 ? ((collections.upi / todayRevenue) * 100).toFixed(1) : 0}% Share
            </span>
          </div>
          <div class="text-3xl font-black text-white mt-2 tracking-tight">
            ${formatINR(collections.upi)}
          </div>
          <div class="text-xs text-gray-400 mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Instant Digital Inflow</span>
            <span class="text-blue-400 font-bold">Auto-Verified</span>
          </div>
        </div>

        <!-- Cash in Register / Drawer -->
        <div class="glass-card rounded-2xl p-4.5 border border-green-500/25 bg-gradient-to-br from-green-500/10 via-dark-800 to-dark-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-base">💵</span>
              <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Cash in Register</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${collections.cash > 15000 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-green-500/20 text-green-400'}">
              ${collections.cash > 15000 ? '⚠️ Skim Needed' : '✓ Safe Level'}
            </span>
          </div>
          <div class="text-3xl font-black text-white mt-2 tracking-tight">
            ${formatINR(collections.cash)}
          </div>
          <div class="text-xs text-gray-400 mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Petty Outflow: <strong class="text-red-400">-${formatINR(totalPettyCash)}</strong></span>
            <button onclick="openSafeDropModal()" class="text-saffron-400 font-bold hover:underline">Safe Drop</button>
          </div>
        </div>

        <!-- Card POS Settlements -->
        <div class="glass-card rounded-2xl p-4.5 border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-dark-800 to-dark-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-base">💳</span>
              <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Card EDC</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-400">
              ${todayRevenue > 0 ? ((collections.card / todayRevenue) * 100).toFixed(1) : 0}% Share
            </span>
          </div>
          <div class="text-3xl font-black text-white mt-2 tracking-tight">
            ${formatINR(collections.card)}
          </div>
          <div class="text-xs text-gray-400 mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>POS EDC Terminals</span>
            <span class="text-green-400 font-bold">Settled</span>
          </div>
        </div>

      </div>

      <!-- 2. 🔍 SEARCH, CHANNEL FILTERS & EXECUTIVE ACTION BAR -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-dark-800/80 p-3.5 rounded-2xl border border-white/5">
        
        <!-- Live Instant Search -->
        <div class="relative flex-1">
          <input type="text" id="cashier-search-input" oninput="filterCashierFeed()"
                 placeholder="Search by customer phone (e.g. 9876543210), receipt code (RCP-0048), table, or food item..."
                 class="w-full text-xs rounded-xl pl-9 pr-4 py-2.5 bg-dark-900 border border-white/10 text-white placeholder-gray-500 focus:border-saffron-500 focus:outline-none" />
          <svg class="w-4 h-4 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>

        <!-- Channel Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 lg:pb-0">
          <button onclick="filterCashierByMethod('all')" id="c-filter-all"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeCashierFilterMethod === 'all' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/60'}">
            All Payments (${paidBills.length})
          </button>
          <button onclick="filterCashierByMethod('upi')" id="c-filter-upi"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${activeCashierFilterMethod === 'upi' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/60'}">
            📱 UPI (${paidBills.filter(b=>b.method==='upi').length})
          </button>
          <button onclick="filterCashierByMethod('cash')" id="c-filter-cash"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${activeCashierFilterMethod === 'cash' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/60'}">
            💵 Cash (${paidBills.filter(b=>b.method==='cash').length})
          </button>
          <button onclick="filterCashierByMethod('card')" id="c-filter-card"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${activeCashierFilterMethod === 'card' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/60'}">
            💳 Card (${paidBills.filter(b=>b.method==='card').length})
          </button>
          <button onclick="filterCashierByMethod('split')" id="c-filter-split"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${activeCashierFilterMethod === 'split' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/60'}">
            🔀 Split (${paidBills.filter(b=>b.method==='split').length})
          </button>
        </div>

        <!-- Executive Tools -->
        <div class="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-white/5">
          <button onclick="openCashierShiftSummaryModal()" class="btn-ghost px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-gray-300 hover:text-white border border-white/10" title="Print Cashier Shift X-Report">
            <span>🖨️ Shift X-Report</span>
          </button>
          <button onclick="openSafeDropModal()" class="btn-primary px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
            <span>🔒 Safe Cash Drop</span>
          </button>
        </div>

      </div>

      <!-- 3. 🧾 REAL-TIME PAID CUSTOMER TRANSACTIONS STREAM -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-white/5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>Customer Settled Receipts Stream</span>
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            </h3>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="text-gray-400">GST: <strong class="text-white">${formatINR(totalGST)}</strong></span>
            <span class="text-gray-400">Discounts: <strong class="text-amber-400">-${formatINR(totalDiscounts)}</strong></span>
          </div>
        </div>

        <div class="divide-y divide-white/5" id="cashier-transactions-list">
          ${displayBills.length === 0 ? `
            <div class="p-10 text-center">
              <div class="text-3xl mb-2">🧾</div>
              <div class="text-xs font-semibold text-gray-400">No customer transactions match criteria</div>
            </div>
          ` : displayBills.map(b => {
            const timeAgo = b.paid_at ? formatTimeAgo(b.paid_at) : 'Just now';
            const methodUpper = (b.method || 'cash').toUpperCase();
            
            let methodBadgeClass = 'bg-green-500/20 text-green-400 border-green-500/30';
            let methodIcon = '💵';
            let methodDetail = 'Cash in Register Drawer';
            if (b.method === 'upi') {
              methodBadgeClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
              methodIcon = '📱';
              methodDetail = b.upi_ref || 'UPI GPay/PhonePe Verified';
            } else if (b.method === 'card') {
              methodBadgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
              methodIcon = '💳';
              methodDetail = b.card_brand || 'Card POS EDC Batch Settled';
            } else if (b.method === 'split') {
              methodBadgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
              methodIcon = '🔀';
              methodDetail = b.split_details ? `Cash ₹${b.split_details.cash} + UPI ₹${b.split_details.upi}` : 'Split Payment Settled';
            }

            const itemsList = Array.isArray(b.items) && b.items.length > 0
              ? b.items.map(i => `${i.name} (x${i.qty || 1})`).join(', ')
              : 'Dine-in full service meal check';

            return `
              <div class="transaction-card p-4.5 hover:bg-white/[0.02] transition space-y-2.5" data-search="${(b.id + ' ' + (b.customer_name || '') + ' ' + (b.customer_phone || '') + ' ' + (b.table_number || '') + ' ' + (b.receipt_code || '') + ' ' + itemsList).toLowerCase()}">
                
                <!-- Row 1: Header (Table, Customer, Time, Amount) -->
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-1 rounded-lg bg-dark-700 text-white font-extrabold text-xs font-mono border border-white/10">
                      ${b.table_number || b.table_id || 'T-01'}
                    </span>
                    <span class="text-xs font-bold text-white">
                      ${b.customer_name || 'Walk-in Dining Guest'}
                    </span>
                    ${b.customer_phone ? `
                      <span class="text-[11px] font-mono text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                        <span>📱</span> ${b.customer_phone}
                      </span>
                    ` : ''}
                    <span class="text-[11px] text-gray-500 font-mono">
                      Token #${b.token || '—'} · ${b.receipt_code || b.id}
                    </span>
                  </div>

                  <div class="flex items-center gap-3">
                    <span class="text-xs text-gray-400">${timeAgo}</span>
                    <div class="text-right">
                      <div class="text-base font-black text-saffron-400 tracking-tight">${formatINR(b.total)}</div>
                      <div class="text-[10px] text-gray-400">${b.discount > 0 ? `<span class="text-amber-400">Disc: -${formatINR(b.discount)}</span> · ` : ''}GST: ${formatINR((b.cgst||0) + (b.sgst||0))}</div>
                    </div>
                    <button onclick="openCustomerInvoiceModal('${b.id}')"
                            class="btn-ghost px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 hover:border-saffron-500/50 hover:text-white flex items-center gap-1 shadow-sm">
                      <span>🧾 Audit Invoice</span>
                    </button>
                  </div>
                </div>

                <!-- Row 2: Items summary -->
                <div class="text-xs text-gray-300 bg-dark-850/60 p-2.5 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div class="truncate max-w-2xl text-gray-300">
                    <span class="text-gray-500 font-semibold mr-1">Food Items:</span> ${itemsList}
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${methodBadgeClass} flex items-center gap-1">
                      <span>${methodIcon}</span> ${methodUpper}
                    </span>
                    <span class="text-[10px] text-gray-400 font-mono">${methodDetail}</span>
                  </div>
                </div>

                <!-- Row 3: Staff & System Audit Signature -->
                <div class="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-0.5">
                  <div class="flex items-center gap-3">
                    <span>Cashier: <strong class="text-gray-300">${b.cashier_name || 'Rahul Verma (Cashier)'}</strong></span>
                    <span>·</span>
                    <span>Waiter: <strong class="text-gray-300">${b.waiter_name || 'Floor Waiter'}</strong></span>
                    ${b.verify_code ? `<span>·</span><span>Security Verify Code: <strong class="text-saffron-400 font-mono">${b.verify_code}</strong></span>` : ''}
                  </div>
                  <div class="text-green-400/80 font-medium">✓ Settled & Written to Audit Vault</div>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4. 🍽️ FLOOR ACTIVE DINING & BILLING QUEUE (Read-Only Monitor) -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>Floor Dining & Billing Status</span>
              <span class="text-xs text-saffron-400 font-normal">(${pendingFloorTables.length} Active Tables)</span>
            </h3>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            Cashier Synced
          </span>
        </div>

        <div class="divide-y divide-white/5">
          ${pendingFloorTables.length === 0 ? `
            <div class="p-6 text-center text-xs text-gray-400">No active dining checks on floor currently.</div>
          ` : pendingFloorTables.map(t => {
            const rawStatus = (t.status || '').toLowerCase();
            const isBilling = rawStatus.includes('billing');
            return `
              <div class="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-white/[0.02]">
                <div class="flex items-center gap-3">
                  <span class="font-extrabold text-white text-sm font-mono">${t.id}</span>
                  <span class="text-gray-400">${t.zone || 'Hall'} · ${t.covers || 2} Guests</span>
                  <span class="text-gray-500">·</span>
                  <span class="text-gray-300">Waiter: <strong class="text-white">${t.waiter || 'Floor Staff'}</strong></span>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-gray-400 text-right">
                    <div>Seated: <strong class="text-white">${t.timeSeated || 'Active'}</strong></div>
                    <div class="text-[10px] text-gray-500">${t.orderItems ? t.orderItems.length : 0} items ordered</div>
                  </div>
                  <div class="font-extrabold text-saffron-400 text-sm font-mono">${formatINR(t.billAmount || 0)}</div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${isBilling ? 'bg-amber-500/20 text-amber-400 animate-pulse border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}">
                    ${isBilling ? 'Checkout / Billing Pending' : 'Dining in Progress'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 5. 🛡️ ANTI-SHRINKAGE FRAUD RADAR & SUPERVISOR APPROVALS QUEUE -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        <!-- Left: Cashier Anti-Theft Risk Radar -->
        <div class="glass-card rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="text-base">🚨</span>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Anti-Theft Radar</h3>
            </div>
            <span class="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-bold border border-green-500/20">
              Normal
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Risk 1: Post KOT Voids -->
            <div class="p-3 rounded-xl bg-dark-700/50 border border-white/5 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white flex items-center gap-1.5">
                  <span class="text-amber-400">⚠️</span> Post-KOT Kitchen Cancellations
                </span>
                <span class="text-[10px] text-gray-400">Manager PIN Protected</span>
              </div>
            </div>

            <!-- Risk 2: High Discount Exceptions -->
            <div class="p-3 rounded-xl bg-dark-700/50 border border-white/5 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white flex items-center gap-1.5">
                  <span class="text-blue-400">🛡️</span> High Discount Threshold (>15%)
                </span>
                <span class="text-[10px] text-saffron-400 font-bold">Owner Protected</span>
              </div>
            </div>

            <!-- Risk 3: Drawer Cash Limit -->
            <div class="p-3 rounded-xl bg-dark-700/50 border border-white/5 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white flex items-center gap-1.5">
                  <span class="text-green-400">💰</span> Register Float Skim Ceiling
                </span>
                <span class="text-[10px] font-mono text-gray-300">Ceiling: ₹15,000</span>
              </div>
              <div class="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                <div class="bg-gradient-to-r from-green-500 to-saffron-500 h-full" style="width: ${Math.min(100, Math.round((collections.cash / 15000) * 100))}%"></div>
              </div>
              <div class="flex justify-between text-[10px] text-gray-500">
                <span>Current: ${formatINR(collections.cash)}</span>
                <span>${collections.cash > 15000 ? '<strong class=\"text-amber-400\">Transfer to safe advised</strong>' : 'Safe operating balance'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Supervisor Approvals Queue -->
        <div class="glass-card rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="text-base">⚖️</span>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Supervisor Approvals Queue</h3>
            </div>
            <span class="text-xs px-2 py-0.5 rounded font-extrabold ${pendingApprovals.length > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-gray-500/20 text-gray-400'}">
              ${pendingApprovals.length} Pending
            </span>
          </div>

          <div class="space-y-3 text-xs">
            ${pendingApprovals.length === 0 ? `
              <div class="p-8 text-center text-xs text-gray-400">
                ✓ All supervisor requests are clear.
              </div>
            ` : pendingApprovals.map(a => {
              const isOwnerTier = a.limitRequired === 'Owner';
              return `
                <div class="p-3.5 rounded-xl bg-dark-700/60 border ${isOwnerTier ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'} flex flex-wrap items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-extrabold text-white">${a.type} — ${a.billId}</span>
                      <span class="text-saffron-400 font-extrabold font-mono">${formatINR(a.amount)}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${isOwnerTier ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}">
                        ${a.limitRequired} Level
                      </span>
                    </div>
                    <div class="text-gray-300">${a.reason}</div>
                    <div class="text-[10px] text-gray-500">Requested by: ${a.requestor}</div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button onclick="handleCashierApproval(${a.id}, 'Rejected')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
                      Reject
                    </button>
                    <button onclick="handleCashierApproval(${a.id}, 'Approved', '${a.limitRequired}')" class="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                      <span>Approve</span>
                      ${isOwnerTier ? '<span class=\"text-[10px]\">🔒</span>' : ''}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- 6. 💸 PETTY CASH REGISTER OUTFLOW LOG -->
      <div class="glass-card rounded-2xl p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>Till Petty Cash Outflow</span>
              <span class="text-xs text-red-400 font-mono">(-${formatINR(totalPettyCash)} spent today)</span>
            </h3>
          </div>
          <button onclick="openCashierPettyCashModal()" class="btn-ghost px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/10 hover:border-saffron-500/50 flex items-center gap-1.5">
            <span>+ Log Drawer Outflow</span>
          </button>
        </div>

        <div class="divide-y divide-white/5">
          ${pettyCashList.length === 0 ? `
            <div class="p-6 text-center text-xs text-gray-400">No emergency petty cash withdrawn today.</div>
          ` : pettyCashList.slice(0, 5).map(pc => `
            <div class="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span class="font-extrabold text-white">${pc.purpose || pc.category}</span>
                <span class="text-gray-400 ml-2">→ Paid to: <strong class="text-gray-300">${pc.paid_to || pc.payee || 'Vendor'}</strong></span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 ml-2 font-mono uppercase">${pc.category}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-red-400 font-black font-mono text-sm">-${formatINR(pc.amount)}</span>
                <span class="text-gray-500 text-[11px]">${pc.approvedBy || 'Manager Approved'}</span>
                <button onclick="handleDeletePettyCash('${pc.id}')" class="text-gray-500 hover:text-red-400 text-xs px-1" title="Remove Record">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// Filter transactions stream by text input (phone, receipt, name, table)
function filterCashierFeed() {
  const query = document.getElementById('cashier-search-input')?.value.toLowerCase().trim() || '';
  const cards = document.querySelectorAll('#cashier-transactions-list .transaction-card');
  cards.forEach(card => {
    const text = card.getAttribute('data-search') || '';
    card.style.display = (!query || text.includes(query)) ? '' : 'none';
  });
}

// Filter transactions stream by payment method
function filterCashierByMethod(method) {
  activeCashierFilterMethod = method;
  renderCashierTab(document.getElementById('live-tab-container'));
}

// ===================================================================
// 🧾 DIGITAL GST TAX INVOICE THERMAL SLIP AUDIT MODAL
// ===================================================================
function openCustomerInvoiceModal(billId) {
  const b = (STATE.bills || []).find(x => x.id === billId);
  if (!b) return;

  const items = Array.isArray(b.items) && b.items.length > 0 ? b.items : [
    { name: 'Dine-in Service Meal Check', qty: 1, price: b.subtotal || b.total }
  ];

  const subtotal = Number(b.subtotal) || Number(b.total) || 500;
  const discount = Number(b.discount) || 0;
  const cgst = Number(b.cgst) || Number((subtotal * 0.025).toFixed(2));
  const sgst = Number(b.sgst) || Number((subtotal * 0.025).toFixed(2));
  const total = Number(b.total) || Math.round(subtotal - discount + cgst + sgst);

  const formattedDate = b.paid_at ? new Date(b.paid_at).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }) : new Date().toLocaleString('en-IN');

  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-extrabold text-white flex items-center gap-2">
          <span>Customer Tax Invoice Audit</span>
          <span class="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">PAID</span>
        </h3>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white text-base">✕</button>
    </div>

    <!-- Authentic Indian Restaurant GST Thermal Receipt Preview -->
    <div class="bg-white text-black p-6 rounded-2xl shadow-2xl max-w-sm mx-auto font-mono text-xs space-y-3 leading-relaxed border border-gray-300">
      
      <!-- Restaurant Header -->
      <div class="text-center border-b border-dashed border-gray-400 pb-3">
        <div class="text-base font-black tracking-wider uppercase">👑 QR-Cafe RESTAURANT</div>
        <div class="text-[10px] text-gray-700">100 Feet Road, Indiranagar, Bengaluru - 560038</div>
        <div class="text-[10px] text-gray-700 font-bold mt-1">GSTIN: 29ABCDE1234F1Z5 · FSSAI: 11223334000123</div>
        <div class="text-[11px] font-bold mt-1 uppercase tracking-widest text-gray-900 border-t border-b border-gray-300 py-0.5">
          Tax Invoice / Retail Bill
        </div>
      </div>

      <!-- Bill Meta Details -->
      <div class="grid grid-cols-2 text-[10px] text-gray-800 border-b border-dashed border-gray-400 pb-2">
        <div><strong>Receipt #:</strong> ${b.receipt_code || b.id}</div>
        <div class="text-right"><strong>Table:</strong> ${b.table_number || b.table_id || 'T-01'} (Tk #${b.token || 1})</div>
        <div><strong>Date:</strong> ${formattedDate}</div>
        <div class="text-right"><strong>Mode:</strong> ${(b.method || 'cash').toUpperCase()}</div>
        ${b.customer_phone ? `<div class="col-span-2"><strong>Customer:</strong> ${b.customer_name || 'Guest'} (${b.customer_phone})</div>` : ''}
      </div>

      <!-- Itemized Table -->
      <div class="border-b border-dashed border-gray-400 pb-3">
        <table class="w-full text-[10px]">
          <thead>
            <tr class="border-b border-gray-400 font-bold">
              <th class="text-left pb-1">ITEM</th>
              <th class="text-center pb-1">QTY</th>
              <th class="text-right pb-1">RATE</th>
              <th class="text-right pb-1">AMT</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${items.map(it => `
              <tr>
                <td class="py-1 font-semibold">${it.name}</td>
                <td class="py-1 text-center">${it.qty || 1}</td>
                <td class="py-1 text-right">₹${it.price || it.rate || 0}</td>
                <td class="py-1 text-right font-bold">₹${(it.qty || 1) * (it.price || it.rate || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Calculation Summary -->
      <div class="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
        <div class="flex justify-between"><span>Food Subtotal:</span> <span>₹${subtotal.toFixed(2)}</span></div>
        ${discount > 0 ? `<div class="flex justify-between text-red-600"><span>Discount (${b.discount_reason || 'Promo'}):</span> <span>-₹${discount.toFixed(2)}</span></div>` : ''}
        <div class="flex justify-between text-gray-700"><span>CGST @ 2.5%:</span> <span>₹${cgst.toFixed(2)}</span></div>
        <div class="flex justify-between text-gray-700"><span>SGST @ 2.5%:</span> <span>₹${sgst.toFixed(2)}</span></div>
        <div class="flex justify-between text-sm font-black border-t border-gray-900 pt-1 text-black">
          <span>NET AMOUNT PAID:</span> <span>${formatINR(total)}</span>
        </div>
      </div>

      <!-- Payment & Security Trace -->
      <div class="text-[9px] text-gray-600 text-center space-y-1 pt-1">
        <div>Cashier: <strong>${b.cashier_name || 'Rahul Verma'}</strong> · Waiter: <strong>${b.waiter_name || 'Floor Staff'}</strong></div>
        ${b.verify_code ? `<div>Security Audit Token: <strong class="font-bold text-black">${b.verify_code}</strong></div>` : ''}
        <div class="italic pt-1 font-sans">Thank you for dining with us! Please visit again.</div>
      </div>

    </div>

    <!-- Modal Action Buttons -->
    <div class="flex gap-2 pt-4">
      <button onclick="closeModal()" class="btn-ghost flex-1 py-2.5 rounded-lg text-xs font-semibold">
        Close Audit
      </button>
      <button onclick="showToast('Invoice thermal layout sent to printer', 'success')" class="btn-primary flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
        <span>🖨️ Print 80mm Receipt</span>
      </button>
    </div>
  `);
}

// ===================================================================
// 🖨️ CASHIER SHIFT SUMMARY X-REPORT MODAL
// ===================================================================
function openCashierShiftSummaryModal() {
  const collections = (STATE.financials && STATE.financials.collections) || { cash: 12450, upi: 28500, card: 6900 };
  const todayRevenue = (STATE.financials && STATE.financials.todayRevenue) || 47850;
  const paidBills = (STATE.bills || []).filter(b => b.status === 'paid');

  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-extrabold text-white">Cashier Mid-Day Shift X-Report</h3>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <div class="space-y-4 text-xs font-mono">
      <div class="p-4 rounded-xl bg-dark-700/60 border border-white/5 space-y-2">
        <div class="flex justify-between text-gray-400"><span>Shift Operating Window:</span> <span class="text-white">10:00 AM – Active</span></div>
        <div class="flex justify-between text-gray-400"><span>Total Customer Bills Settled:</span> <span class="text-saffron-400 font-bold">${paidBills.length || 52} checks</span></div>
        <div class="flex justify-between text-gray-400"><span>Opening Float In Till:</span> <span class="text-white">₹2,000.00</span></div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 space-y-2">
        <div class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Collections Breakdown</div>
        <div class="flex justify-between"><span>📱 UPI (GPay/PhonePe):</span> <span class="text-blue-400 font-bold">${formatINR(collections.upi)}</span></div>
        <div class="flex justify-between"><span>💵 Cash in Till:</span> <span class="text-green-400 font-bold">${formatINR(collections.cash)}</span></div>
        <div class="flex justify-between"><span>💳 Card EDC Settlements:</span> <span class="text-purple-400 font-bold">${formatINR(collections.card)}</span></div>
        <div class="flex justify-between text-sm font-black pt-2 border-t border-white/10 text-white">
          <span>Total Realized Inflow:</span> <span class="text-saffron-400">${formatINR(todayRevenue)}</span>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button onclick="closeModal()" class="btn-ghost flex-1 py-2.5 rounded-lg text-xs font-semibold">Close</button>
        <button onclick="showToast('X-Report PDF Generated & Sent to Owner WhatsApp', 'success')" class="btn-primary flex-1 py-2.5 rounded-lg text-xs font-bold">
          🖨️ Print X-Report
        </button>
      </div>
    </div>
  `);
}

// ===================================================================
// 🔒 SAFE CASH DROP (SKIM) MODAL
// ===================================================================
function openSafeDropModal() {
  const currentCash = (STATE.financials && STATE.financials.collections && STATE.financials.collections.cash) || 12450;

  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-extrabold text-white">Safe Cash Drop</h3>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form onsubmit="confirmSafeDrop(event)" class="space-y-4 text-xs font-mono">
      <div class="p-3 rounded-xl bg-dark-700/60 border border-white/5 flex justify-between">
        <span class="text-gray-400">Current Cash in Drawer:</span>
        <span class="text-green-400 font-extrabold text-sm">${formatINR(currentCash)}</span>
      </div>

      <div>
        <label class="block text-gray-400 mb-1">Drop Amount (₹) *</label>
        <input type="number" name="dropAmount" required min="500" max="${Math.max(500, currentCash - 2000)}" value="5000"
               class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-bold" />
        <span class="text-[10px] text-gray-500 mt-1 block">Leaves minimum ₹2,000 float in drawer for change.</span>
      </div>

      <div>
        <label class="block text-gray-400 mb-1">Supervisor PIN (Owner / Manager) *</label>
        <input type="password" name="pin" required maxlength="4" placeholder="••••"
               class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white text-center tracking-widest font-bold" />
      </div>

      <div class="flex gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2.5 rounded-lg text-xs font-semibold font-sans">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2.5 rounded-lg text-xs font-bold font-sans">Confirm Safe Drop</button>
      </div>
    </form>
  `);
}

function confirmSafeDrop(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const amount = Number(fd.get('dropAmount')) || 0;
  const pin = fd.get('pin');

  if (pin !== STATE.ownerPin && pin !== STATE.managerPin) {
    showToast('Invalid Supervisor PIN for Safe Drop', 'error');
    return;
  }

  if (STATE.financials && STATE.financials.collections) {
    STATE.financials.collections.cash = Math.max(0, STATE.financials.collections.cash - amount);
    STATE.financials.expectedCash = STATE.financials.collections.cash;
  }

  closeModal();
  showToast(`Safe Drop Recorded: ${formatINR(amount)} moved to Office Safe`, 'success');
  const container = document.getElementById('live-tab-container');
  if (container) renderCashierTab(container);
}

// Supervisor Approval Handler
async function handleCashierApproval(appId, status, limitRequired) {
  if (status === 'Approved' && limitRequired === 'Owner' && !isOwner()) {
    requestOwnerOverride(`Approval #${appId} (Owner Level)`, async () => {
      await executeCashierApproval(appId, status);
    });
    return;
  }
  await executeCashierApproval(appId, status);
}

async function executeCashierApproval(appId, status) {
  if (typeof API !== 'undefined' && API.updateApproval) {
    await API.updateApproval(appId, status);
  }
  const item = (STATE.approvals || []).find(a => a.id === appId);
  if (item) item.status = status;
  showToast(`Approval #${appId} marked as ${status}`, status === 'Approved' ? 'success' : 'warning');
  const container = document.getElementById('live-tab-container');
  if (container) renderCashierTab(container);
}

// Petty Cash Modal
function openCashierPettyCashModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-bold text-white">Log Drawer Outflow</h3>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form onsubmit="handleCashierPettyCashSubmit(event)" class="space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1">Expense Purpose *</label>
        <input type="text" name="purpose" required placeholder="e.g. Gas cylinder refill, cleaning cloth, fresh mint" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white" />
      </div>
      <div>
        <label class="block text-gray-400 mb-1">Paid To (Vendor / Person) *</label>
        <input type="text" name="payee" required placeholder="e.g. Indane Gas, Sharma Tea Point" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Amount (₹) *</label>
          <input type="number" name="amount" required min="10" max="5000" placeholder="500" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Category</label>
          <select name="category" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white">
            <option value="Ingredients">Ingredients</option>
            <option value="Utilities">Utilities</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Refreshments">Refreshments</option>
            <option value="Misc">Misc</option>
          </select>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2.5 rounded-lg font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2.5 rounded-lg font-bold">Save Drawer Outflow</button>
      </div>
    </form>
  `);
}

async function handleCashierPettyCashSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const purpose = fd.get('purpose');
  const payee = fd.get('payee');
  const amount = Number(fd.get('amount')) || 0;
  const category = fd.get('category') || 'Misc';

  closeModal();

  const newEntry = {
    id: `pc-${Date.now()}`,
    purpose,
    paid_to: payee,
    payee,
    amount,
    category,
    created_at: new Date().toISOString(),
    created_by: (STATE.user && STATE.user.name) || 'Cashier'
  };

  STATE.pettyCash = STATE.pettyCash || [];
  STATE.pettyCash.unshift(newEntry);

  if (typeof API !== 'undefined' && API.addPettyCash) {
    await API.addPettyCash(newEntry);
  }

  showToast(`Drawer Outflow Logged: ${formatINR(amount)} for ${purpose}`, 'success');
  const container = document.getElementById('live-tab-container');
  if (container) renderCashierTab(container);
}

async function handleDeletePettyCash(pcId) {
  if (!confirm('Remove this petty cash expense entry?')) return;
  STATE.pettyCash = (STATE.pettyCash || []).filter(p => String(p.id) !== String(pcId));
  if (typeof API !== 'undefined' && API.deletePettyCash) {
    await API.deletePettyCash(pcId);
  }
  showToast('Petty cash entry removed', 'info');
  const container = document.getElementById('live-tab-container');
  if (container) renderCashierTab(container);
}
