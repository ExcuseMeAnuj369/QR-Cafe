/**
 * ===================================================================
 * QR DINE — DASHBOARD: THE COMMAND CENTER
 * Refined SaaS Enterprise Design (Comfortable Contrast & Calibrated Typography)
 * 1. Top Section: 4 Compact KPI Cards (Balanced Font Hierarchy)
 * 2. Middle Section: 60% Sales Trend Chart + 40% Live Activity Feed
 * 3. Bottom Section: Action Required Inbox (Subtle, Eye-Friendly Borders)
 * 4. Error Handling: 30s Auto-Polling, Skeleton UI, Offline Cache Banner
 * ===================================================================
 */

let dashboardPollTimer = null;
let lastDashboardSyncTime = new Date();
let isDashboardOfflineSimulated = false;
let salesTrendChartInstance = null;

function renderDashboard(el) {
  if (window._showDashboardSkeletonOnce) {
    window._showDashboardSkeletonOnce = false;
    renderDashboardSkeleton(el);
    setTimeout(() => renderDashboard(el), 350);
    return;
  }

  // Live KPI metrics from STATE
  const occupiedTables = STATE.tables.filter(t => t.status === 'Occupied' || t.status === 'Billing Pending').length;
  const freeTables = STATE.tables.filter(t => t.status === 'Free').length;
  const billingTables = STATE.tables.filter(t => t.status === 'Billing Pending').length;
  
  const staffPresentCount = STATE.staff.filter(s => s.status === 'Clocked In' || s.status === 'On Break').length;
  const staffTotalCount = STATE.staff.length;
  const staffLateCount = STATE.staff.filter(s => s.checkIn && s.checkIn > s.shiftStart).length;
  const staffAbsentCount = STATE.staff.filter(s => s.status === 'Absent').length;

  const activeOrdersCount = STATE.kitchenOrders.length;
  const newOrdersCount = STATE.kitchenOrders.filter(o => o.status === 'New').length;
  const preparingOrdersCount = STATE.kitchenOrders.filter(o => o.status === 'Preparing').length;

  const pendingLeavesCount = STATE.leaves ? STATE.leaves.filter(l => l.status === 'Pending').length : 3;
  const lowStockCount = STATE.inventory ? STATE.inventory.filter(i => i.stock <= i.reorder).length : 2;
  const pendingApprovalsCount = STATE.approvals ? STATE.approvals.filter(a => a.status === 'Pending').length : 2;

  el.innerHTML = `
    <div class="p-5 fade-in space-y-5 max-w-[1600px] mx-auto">
      
      <!-- OFFLINE CACHE FALLBACK BANNER -->
      ${isDashboardOfflineSimulated ? `
        <div id="dashboard-offline-banner" class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>Showing offline cached snapshot from 2 mins ago.</span>
          </div>
          <button onclick="retryDashboardConnection()" class="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition text-xs">
            Retry Sync
          </button>
        </div>
      ` : ''}

      <!-- CALIBRATED PAGE HEADER (Sleek SaaS Sizing: 22px bold) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
        <div>
          <div class="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <span>OPERATIONS DESK</span>
            <span class="text-gray-600">/</span>
            <span class="text-gray-400 font-normal">${STATE.user.role.toUpperCase()} CONSOLE</span>
          </div>
          <h1 class="text-xl sm:text-[22px] font-bold text-gray-100 tracking-tight">Dashboard</h1>
          <p class="text-xs text-gray-400 mt-0.5">Real-time pulse of restaurant floor, live billing, and workforce status.</p>
        </div>

        <!-- Controls: Auto-sync + Floor Announcement + Live Operations -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="flex items-center gap-2 bg-dark-800/80 border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-xs">
            <span class="status-dot status-live" style="width:6px;height:6px"></span>
            <span class="text-gray-400 text-[11px]">Synced: <span id="dash-last-updated" class="text-gray-200 font-medium">Just now</span></span>
            <button onclick="refreshDashboardData()" title="Refresh now" class="text-gray-400 hover:text-white transition ml-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>

          <button onclick="openBroadcastModal()" class="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white flex items-center gap-1.5 transition">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
            Announcement
          </button>

          <button onclick="activeLiveTab = 'kitchen'; navigate('live');" class="btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span>Live Ops</span> →
          </button>
        </div>
      </div>

      <!-- ===============================================================
           1. TOP SECTION: 4 COMPACT KPI CARDS
           Calibrated Font Scale:
           - KPI Numbers: text-2xl (24px) font-bold text-white tabular-nums
           - Labels: text-[11px] font-semibold text-gray-400 uppercase tracking-wider
           - Subtext: text-[11px] font-medium
           - Card padding: p-4 with subtle border border-white/[0.08]
           =============================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

        <!-- Card 1: Today's Revenue -->
        <div onclick="openRevenueSlideOver()"
             class="glass-card rounded-xl p-4 cursor-pointer relative overflow-hidden group hover:border-amber-500/30 transition">
          <div class="flex items-center justify-between mb-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <!-- Lucide IndianRupee icon -->
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4.5 4.5 0 0 0 0-9"/>
              </svg>
            </div>
            <span class="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              +12% vs y'day
            </span>
          </div>

          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Today's Revenue
          </div>

          <div class="text-2xl font-bold text-white mt-1 tabular-nums tracking-tight">
            ${formatINR(STATE.financials.todayRevenue)}
          </div>

          <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <span>${STATE.financials.todayBillsCount} orders billed</span>
            <span class="text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">Split →</span>
          </div>
        </div>

        <!-- Card 2: Live Tables -->
        <div onclick="openLiveTablesSlideOver()"
             class="glass-card rounded-xl p-4 cursor-pointer relative overflow-hidden group hover:border-amber-500/30 transition">
          <div class="flex items-center justify-between mb-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <!-- Lucide LayoutGrid icon -->
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
            </div>
            <span class="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              4 Free, 2 Billing
            </span>
          </div>

          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Live Tables
          </div>

          <div class="text-2xl font-bold text-white mt-1 tabular-nums tracking-tight">
            ${occupiedTables}/${STATE.tables.length} <span class="text-xs font-medium text-gray-400 font-normal">Occupied</span>
          </div>

          <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <span>${freeTables} Free · ${billingTables} Billing</span>
            <span class="text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">Floor map →</span>
          </div>
        </div>

        <!-- Card 3: Active Orders (Direct Kitchen redirect) -->
        <div onclick="activeLiveTab = 'kitchen'; navigate('live');"
             class="glass-card rounded-xl p-4 cursor-pointer relative overflow-hidden group hover:border-blue-500/30 transition">
          <div class="flex items-center justify-between mb-2">
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <!-- Lucide Receipt icon -->
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
              </svg>
            </div>
            <span class="text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
              ${newOrdersCount || 4} New, ${preparingOrdersCount || 10} Prep
            </span>
          </div>

          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Active Orders
          </div>

          <div class="text-2xl font-bold text-white mt-1 tabular-nums tracking-tight">
            ${activeOrdersCount || 14}
          </div>

          <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <span class="text-red-400 font-medium">1 in queue &gt; 10m</span>
            <span class="text-blue-400 group-hover:translate-x-0.5 transition-transform font-medium">Kitchen tab →</span>
          </div>
        </div>

        <!-- Card 4: Staff Present -->
        <div onclick="openStaffPresentSlideOver()"
             class="glass-card rounded-xl p-4 cursor-pointer relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div class="flex items-center justify-between mb-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <!-- Lucide Users icon -->
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span class="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              2 Late, 1 Leave
            </span>
          </div>

          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Staff Present
          </div>

          <div class="text-2xl font-bold text-white mt-1 tabular-nums tracking-tight">
            ${staffPresentCount}/${staffTotalCount}
          </div>

          <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <span>1 Break · 1 Sick leave</span>
            <span class="text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">Roster →</span>
          </div>
        </div>

      </div>

      <!-- ===============================================================
           2. MIDDLE SECTION: 60% SALES TREND + 40% LIVE ACTIVITY FEED
           Comfortable visual height (220px chart), soft borders, clean feed
           =============================================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">

        <!-- 60% Left: Sales Trend Chart (3/5 cols) -->
        <div class="lg:col-span-3 glass-card rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Weekly Analytics</div>
              <h2 class="text-sm font-semibold text-gray-100">7-Day Sales Trend</h2>
            </div>
            <div class="flex items-center gap-2">
              <span id="chart-hover-indicator" class="hidden text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-semibold">
                ₹0
              </span>
              <span class="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                +14.2% weekly
              </span>
            </div>
          </div>

          <!-- Compact Chart Canvas (h-52 = 208px) -->
          <div class="relative w-full h-[210px]">
            <canvas id="salesTrendChart"></canvas>
          </div>

          <div class="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <span>Peak day: Monday (₹52,000)</span>
            <span>Hover chart to view exact day figures</span>
          </div>
        </div>

        <!-- 40% Right: Real-Time Activity Feed (2/5 cols) -->
        <div class="lg:col-span-2 glass-card rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <div class="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Live Events</div>
                <h2 class="text-sm font-semibold text-gray-100">Floor & Kitchen Stream</h2>
              </div>
              <span class="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span class="status-dot status-live" style="width:5px;height:5px"></span> Live
              </span>
            </div>

            <!-- Compact, Clean Activity List -->
            <div id="activity-feed-container" class="space-y-2.5 overflow-y-auto max-h-[205px] pr-1">
              ${STATE.activityFeed.map(a => `
                <div class="flex items-start gap-2.5 py-1.5 border-b border-white/[0.04] last:border-0">
                  <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'critical' ? 'bg-red-400' : 'bg-emerald-400'}"></span>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-gray-200 font-normal leading-snug break-words">
                      ${a.text}
                    </div>
                    <div class="text-[10px] text-gray-500 mt-0.5">
                      ${a.time}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <span>Websockets streaming</span>
            <button onclick="simulateNewActivityEvent()" class="text-amber-400 hover:underline font-medium text-[11px]">
              + Trigger test event
            </button>
          </div>
        </div>

      </div>

      <!-- ===============================================================
           3. BOTTOM SECTION: ACTION REQUIRED INBOX (Eye-Friendly 1px Borders)
           Calibrated sizing, no visual glare, comfortable contrast
           =============================================================== -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <h2 class="text-sm font-semibold text-gray-100">Action Required (Command Inbox)</h2>
          </div>
          <span class="text-[11px] text-gray-400">Immediate attention items</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

          <!-- Widget 1: Pending Approvals -->
          <div onclick="activeAttendanceSubTab = 'leaves'; navigate('attendance');"
               class="glass-card rounded-xl p-3.5 cursor-pointer border border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/[0.03] transition group">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Leaves Pending
              </span>
              <span class="text-[10px] font-semibold bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
                INBOX
              </span>
            </div>
            
            <div class="text-base font-bold text-gray-100 mt-1">
              ${pendingLeavesCount} Leaves Pending
            </div>
            <p class="text-xs text-gray-400 mt-0.5 leading-snug">Saturday Night shift understaffed risk flagged.</p>
            
            <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Attendance &gt; Leaves</span>
              <span>Review →</span>
            </div>
          </div>

          <!-- Widget 2: Low Stock -->
          <div onclick="activeInventorySubTab = 'vendors'; navigate('inventory');"
               class="glass-card rounded-xl p-3.5 cursor-pointer border border-red-500/25 hover:border-red-500/50 hover:bg-red-500/[0.03] transition group">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                Low Stock
              </span>
              <span class="text-[10px] font-semibold bg-red-500/15 text-red-300 px-1.5 py-0.5 rounded">
                PAR ALERT
              </span>
            </div>
            
            <div class="text-base font-bold text-gray-100 mt-1">
              Low Stock: Paneer, Butter
            </div>
            <p class="text-xs text-gray-400 mt-0.5 leading-snug">Milk (4.5 L) & Maida (8 kg) below minimum Par limit.</p>
            
            <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-red-400 font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Inventory &gt; Purchase Orders</span>
              <span>Order →</span>
            </div>
          </div>

          <!-- Widget 3: Discount Requests -->
          <div onclick="activeFinancialsSubTab = 'approvals'; navigate('financials');"
               class="glass-card rounded-xl p-3.5 cursor-pointer border border-blue-500/25 hover:border-blue-500/50 hover:bg-blue-500/[0.03] transition group">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Discount Approvals
              </span>
              <span class="text-[10px] font-semibold bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">
                PIN REQ
              </span>
            </div>
            
            <div class="text-base font-bold text-gray-100 mt-1">
              2 Discount Requests
            </div>
            <p class="text-xs text-gray-400 mt-0.5 leading-snug">1 discount exceeds 15% Manager limit (PIN: 9999).</p>
            
            <div class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Financials &gt; Approvals</span>
              <span>Queue →</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  // Start 30s auto-polling
  setupDashboardAutoPolling();

  // Render smooth curved Line Chart with gentle styling
  renderSalesTrendChart();
}

/**
 * Render smooth Line Chart with soft tones and ergonomic tooltips
 */
function renderSalesTrendChart() {
  setTimeout(() => {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    if (salesTrendChartInstance) {
      salesTrendChartInstance.destroy();
    }

    const chartCtx = ctx.getContext('2d');
    const gradient = chartCtx.createLinearGradient(0, 0, 0, 190);
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
    gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.04)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

    const dates = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Today'];
    const salesData = [38500, 44200, 52000, 31400, 39800, 42720, 47850];

    salesTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Revenue',
          data: salesData,
          borderColor: '#F59E0B',
          borderWidth: 2.2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          cubicInterpolationMode: 'monotone',
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#F59E0B',
          pointHoverBackgroundColor: '#FFFFFF',
          pointBorderColor: '#121215',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        onHover: (event, activeElements) => {
          const hoverIndicator = document.getElementById('chart-hover-indicator');
          if (hoverIndicator) {
            if (activeElements && activeElements.length > 0) {
              const idx = activeElements[0].index;
              hoverIndicator.classList.remove('hidden');
              hoverIndicator.textContent = `${dates[idx]}: ₹${salesData[idx].toLocaleString('en-IN')}`;
            } else {
              hoverIndicator.classList.add('hidden');
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(18, 18, 22, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#fbbf24',
            bodyFont: { size: 12, weight: 'bold' },
            padding: 8,
            displayColors: false,
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => `Revenue: ₹${item.raw.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 10, weight: '500' }
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 10 },
              callback: (v) => '₹' + (v / 1000) + 'k'
            }
          }
        }
      }
    });
  }, 50);
}

// ===================================================================
// ERROR HANDLING, AUTO-POLLING & SKELETON UI
// ===================================================================

function setupDashboardAutoPolling() {
  if (dashboardPollTimer) clearInterval(dashboardPollTimer);
  dashboardPollTimer = setInterval(() => {
    lastDashboardSyncTime = new Date();
    const updatedEl = document.getElementById('dash-last-updated');
    if (updatedEl) {
      updatedEl.textContent = 'Just now';
    }
  }, 30000);
}

function refreshDashboardData() {
  const updatedEl = document.getElementById('dash-last-updated');
  if (updatedEl) updatedEl.textContent = 'Syncing...';
  
  setTimeout(() => {
    lastDashboardSyncTime = new Date();
    if (updatedEl) updatedEl.textContent = 'Just now';
    showToast('Dashboard numbers refreshed with floor sync', 'success');
  }, 300);
}

function retryDashboardConnection() {
  isDashboardOfflineSimulated = false;
  showToast('Reconnected to live ops server. Synced.', 'success');
  navigate('dashboard');
}

function renderDashboardSkeleton(el) {
  el.innerHTML = `
    <div class="p-5 space-y-5">
      <div class="h-8 w-48 skeleton-shimmer"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        ${[1, 2, 3, 4].map(() => `<div class="h-28 rounded-xl skeleton-shimmer"></div>`).join('')}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div class="lg:col-span-3 h-64 rounded-xl skeleton-shimmer"></div>
        <div class="lg:col-span-2 h-64 rounded-xl skeleton-shimmer"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${[1, 2, 3].map(() => `<div class="h-24 rounded-xl skeleton-shimmer"></div>`).join('')}
      </div>
    </div>
  `;
}

function simulateNewActivityEvent() {
  const events = [
    { text: 'Order #1043 billed ₹1,120 via UPI (PhonePe)', type: 'normal' },
    { text: 'Paneer stock fell below 5kg (4.8 kg remaining)', type: 'critical' },
    { text: 'Table T-05 marked Cleaned & Ready', type: 'normal' },
    { text: 'Kitchen order #ORD-8425 marked Ready to serve', type: 'normal' }
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  STATE.activityFeed.unshift({
    id: Date.now(),
    time: 'Just now',
    text: ev.text,
    type: ev.type
  });

  const container = document.getElementById('activity-feed-container');
  if (container) {
    const item = document.createElement('div');
    item.className = 'flex items-start gap-2.5 py-1.5 border-b border-white/[0.04] last:border-0 fade-in';
    item.innerHTML = `
      <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.type === 'critical' ? 'bg-red-400' : 'bg-emerald-400'}"></span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-gray-200 font-normal leading-snug break-words">
          ${ev.text}
        </div>
        <div class="text-[10px] text-gray-500 mt-0.5">
          Just now
        </div>
      </div>
    `;
    container.insertBefore(item, container.firstChild);
    showToast(`Websocket event: ${ev.text}`, ev.type === 'critical' ? 'error' : 'success');
  }
}

// ===================================================================
// SLIDE-OVER DRILL DOWNS (Calibrated Typography & Layout)
// ===================================================================

/**
 * Slide-Over 1: Today's Revenue Drill Down
 */
function openRevenueSlideOver() {
  const content = `
    <div class="space-y-4">
      <div class="glass-card rounded-xl p-4">
        <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Collection</div>
        <div class="text-2xl font-bold text-white mt-1">${formatINR(STATE.financials.todayRevenue)}</div>
        <div class="text-xs text-emerald-400 mt-1 font-medium">+12% over yesterday (${formatINR(STATE.financials.yesterdayRevenue)})</div>
      </div>

      <!-- Payment Breakdown Doughnut -->
      <div class="glass-card rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold text-gray-200">Payment Breakdown</div>
          <span class="text-[10px] text-gray-400">Cash 40% • UPI 50% • Card 10%</span>
        </div>
        <div class="h-40 relative">
          <canvas id="revDoughnutChart"></canvas>
        </div>
        <div class="grid grid-cols-3 gap-2 mt-3 text-center">
          <div class="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">UPI (50%)</div>
            <div class="text-xs font-bold text-amber-400 mt-0.5">${formatINR(Math.round(STATE.financials.todayRevenue * 0.50))}</div>
          </div>
          <div class="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Cash (40%)</div>
            <div class="text-xs font-bold text-emerald-400 mt-0.5">${formatINR(Math.round(STATE.financials.todayRevenue * 0.40))}</div>
          </div>
          <div class="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Card (10%)</div>
            <div class="text-xs font-bold text-blue-400 mt-0.5">${formatINR(Math.round(STATE.financials.todayRevenue * 0.10))}</div>
          </div>
        </div>
      </div>

      <!-- Hourly Bar Chart -->
      <div class="glass-card rounded-xl p-4">
        <div class="text-xs font-semibold text-gray-200 mb-2">Hourly Revenue Trend</div>
        <div class="h-36 relative">
          <canvas id="hourlyBarChart"></canvas>
        </div>
      </div>
    </div>
  `;

  const isUserOwner = isOwner();
  const footer = `
    <div class="w-full space-y-1.5">
      <button onclick="handleGSTR1Export()" class="btn-primary w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
        <span>Export GSTR-1 Draft (CA Ready)</span>
        ${!isUserOwner ? `<span class="bg-black/30 px-1.5 py-0.5 rounded text-[10px] text-amber-300">Owner Only</span>` : ''}
      </button>
      ${!isUserOwner ? `<p class="text-[10px] text-center text-gray-500">Managers require 4-digit Owner PIN override (9999).</p>` : ''}
    </div>
  `;

  openSlideOver("Today's Revenue Drill-Down", content, footer);

  setTimeout(() => {
    const dCtx = document.getElementById('revDoughnutChart');
    if (dCtx) {
      new Chart(dCtx, {
        type: 'doughnut',
        data: {
          labels: ['UPI (50%)', 'Cash (40%)', 'Card (10%)'],
          datasets: [{
            data: [50, 40, 10],
            backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
            borderWidth: 0
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } } } }
        }
      });
    }

    const bCtx = document.getElementById('hourlyBarChart');
    if (bCtx) {
      new Chart(bCtx, {
        type: 'bar',
        data: {
          labels: STATE.financials.hourlyRevenue.map(h => h.hour),
          datasets: [{
            data: STATE.financials.hourlyRevenue.map(h => h.rev),
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
            borderRadius: 4
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } },
            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', callback: v => '₹' + (v / 1000) + 'k' } }
          }
        }
      });
    }
  }, 80);
}

function handleGSTR1Export() {
  if (!isOwner()) {
    requestOwnerOverride('GSTR-1 Tax Export', () => {
      exportGSTR1Draft();
    });
    return;
  }
  exportGSTR1Draft();
}

function exportGSTR1Draft() {
  showToast('GSTR-1 JSON Draft downloaded for GST Portal', 'success');
}

/**
 * Slide-Over 2: Live Tables Mini Floor Plan Drill Down
 */
function openLiveTablesSlideOver() {
  const content = `
    <div class="space-y-4">
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-400">Click a table to inspect live ticket:</span>
        <div class="flex gap-2 text-[10px] font-semibold">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Free</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span> Occupied</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Billing</span>
        </div>
      </div>

      <!-- Mini Floor Grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        ${STATE.tables.map(t => {
          const isRed = t.status === 'Occupied';
          const isYellow = t.status === 'Billing Pending';
          const isCleaning = t.status === 'Cleaning';
          
          const colorClass =
            isRed ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' :
            isYellow ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' :
            isCleaning ? 'bg-gray-500/10 border-gray-500/30 text-gray-400' :
            'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';

          return `
            <div onclick="showTableBlueprintTooltip('${t.id}')"
                 id="table-cube-${t.id}"
                 class="p-2.5 rounded-lg border ${colorClass} cursor-pointer transition text-center">
              <div class="font-bold text-xs text-white">${t.id}</div>
              <div class="text-[9px] font-medium mt-0.5 truncate">${t.status}</div>
              <div class="text-[8px] text-gray-400">${t.capacity} seats</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Tooltip Popover -->
      <div id="table-interactive-popover" class="glass-card rounded-xl p-3.5 border border-white/[0.08]">
        <div class="text-xs text-gray-400 text-center py-1">
          Click any table above to view seating details.
        </div>
      </div>
    </div>
  `;

  openSlideOver('Live Tables Floor Map', content);
  setTimeout(() => showTableBlueprintTooltip('T-01'), 100);
}

function showTableBlueprintTooltip(tableId) {
  const t = STATE.tables.find(x => x.id === tableId);
  const container = document.getElementById('table-interactive-popover');
  if (!t || !container) return;

  const isRed = t.status === 'Occupied';
  const isYellow = t.status === 'Billing Pending';

  document.querySelectorAll('[id^="table-cube-"]').forEach(el => el.classList.remove('ring-1', 'ring-amber-400'));
  const activeCube = document.getElementById(`table-cube-${t.id}`);
  if (activeCube) activeCube.classList.add('ring-1', 'ring-amber-400');

  if (isRed || isYellow) {
    const waiterName = t.waiter === 'Priya Sharma' ? 'Ravi (Priya S.)' : t.waiter;
    const timeMins = t.timeSeated.includes('min') ? t.timeSeated : '45 mins';
    const billAmt = t.billAmount ? formatINR(t.billAmount) : '₹1,200';

    container.innerHTML = `
      <div class="fade-in space-y-2.5">
        <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
          <div class="text-xs font-medium text-white">
            <span class="text-amber-400">Waiter:</span> ${waiterName} • 
            <span class="text-amber-400">Time:</span> ${timeMins} • 
            <span class="text-amber-400">Bill:</span> ${billAmt}
          </div>
          <button onclick="activeLiveTab = 'kitchen'; closeSlideOver(); navigate('live'); showToast('Opened kitchen ticket for Table ${t.id}', 'info');"
                  class="btn-primary px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0">
            [View Order]
          </button>
        </div>

        <div class="flex items-center justify-between text-xs border-b border-white/[0.06] pb-1.5">
          <div>
            <span class="font-bold text-white">${t.id} (${t.zone})</span>
            <span class="text-gray-400 text-[11px] block">${t.covers} seated / ${t.capacity} covers</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${isRed ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}">${t.status}</span>
        </div>

        <div class="space-y-1 text-xs text-gray-300">
          <div class="text-[10px] text-gray-400 uppercase font-semibold">Running KOT:</div>
          <ul class="space-y-0.5 list-disc pl-4 text-gray-300 text-[11px]">
            ${t.orderItems && t.orderItems.length > 0 ? t.orderItems.map(item => `<li>${item}</li>`).join('') : '<li>2x Paneer Butter Masala</li><li>4x Garlic Naan</li>'}
          </ul>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="fade-in space-y-1.5 text-center py-2">
        <div class="font-bold text-white text-xs">${t.id} (${t.zone})</div>
        <div class="text-xs text-emerald-400 font-medium">Status: ${t.status} (Ready for seating)</div>
        <p class="text-[11px] text-gray-400">Capacity: ${t.capacity} covers. QR standee active.</p>
      </div>
    `;
  }
}

/**
 * Slide-Over 4: Staff Present Live Roster
 */
function openStaffPresentSlideOver() {
  const present = STATE.staff.filter(s => s.status === 'Clocked In');
  const onBreak = STATE.staff.filter(s => s.status === 'On Break');
  const sickLeaveStaff = {
    name: 'Ramesh Verma',
    role: 'Tandoor Cook',
    shift: 'Dinner',
    reason: 'Leave (Sick)'
  };

  const content = `
    <div class="space-y-4 text-xs">
      <!-- Clocked In -->
      <div>
        <div class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          Clocked In (${present.length})
        </div>
        <div class="space-y-1.5">
          ${present.map(s => `
            <div class="glass-card rounded-lg p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                  ${s.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div class="font-semibold text-white text-xs">${s.name}</div>
                  <div class="text-gray-400 text-[10px]">${s.role} · In at ${s.checkIn || '10:00 AM'}</div>
                </div>
              </div>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">${s.shift}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- On Break -->
      <div>
        <div class="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          On Break (${onBreak.length})
        </div>
        <div class="space-y-1.5">
          ${onBreak.map(s => `
            <div class="glass-card rounded-lg p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                  ${s.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div class="font-semibold text-white text-xs">${s.name}</div>
                  <div class="text-gray-400 text-[10px]">${s.role} · 15m break</div>
                </div>
              </div>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-medium">${s.shift}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Absent / Leave -->
      <div>
        <div class="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-400"></span>
          Absent & On Leave (1)
        </div>
        <div class="space-y-1.5">
          <div class="glass-card rounded-lg p-2.5 flex items-center justify-between border border-red-500/20">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center text-[10px]">
                RV
              </div>
              <div>
                <div class="font-semibold text-white text-xs">${sickLeaveStaff.name}</div>
                <div class="text-gray-400 text-[10px]">${sickLeaveStaff.role} · ${sickLeaveStaff.shift}</div>
              </div>
            </div>
            <div class="text-right">
              <span class="text-red-400 font-semibold text-[11px]">${sickLeaveStaff.reason}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  openSlideOver("Live Floor Roster", content);
}

// ===================================================================
// FLOOR ANNOUNCEMENT MODAL
// ===================================================================

function openBroadcastModal() {
  openModal(`
    <h3 class="text-sm font-bold text-white mb-1.5">Send Floor Broadcast</h3>
    <p class="text-xs text-gray-400 mb-3">Announce instantly to Waiters & Kitchen screens.</p>
    <div class="space-y-3">
      <div>
        <label class="text-[11px] text-gray-400 block mb-1">Target Station</label>
        <select id="broadcast-station" class="w-full text-xs py-2 px-2.5 rounded-lg bg-dark-700 border border-white/10 text-white">
          <option>All Staff (Kitchen + Floor + Cashier)</option>
          <option>Kitchen Only</option>
          <option>Waiters Floor Only</option>
        </select>
      </div>
      <div>
        <label class="text-[11px] text-gray-400 block mb-1">Announcement Message</label>
        <textarea id="broadcast-msg" rows="3" class="w-full text-xs p-2.5 rounded-lg bg-dark-700 border border-white/10 text-white" placeholder="e.g. 86 Paneer Butter Masala immediately - low stock"></textarea>
      </div>
      <div class="flex gap-2 pt-1">
        <button onclick="closeModal()" class="btn-ghost flex-1 py-1.5 rounded-lg text-xs">Cancel</button>
        <button onclick="sendBroadcast()" class="btn-primary flex-1 py-1.5 rounded-lg text-xs font-semibold">Broadcast Now</button>
      </div>
    </div>
  `);
}

function sendBroadcast() {
  const msg = document.getElementById('broadcast-msg')?.value;
  if (!msg) {
    showToast('Please type an announcement message', 'error');
    return;
  }
  closeModal();
  showToast(`Broadcast sent: "${msg}"`, 'success');
}
