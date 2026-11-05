/**
 * ===================================================================
 * QR DINE — SECTION 9: TABLES & QR MANAGEMENT (DEEP DIVE) [BOTH]
 * 9.1 Interactive Floor Plan View & Table CRUD (Drag & Drop layout)
 * 9.2 QR Standee Generation (Download PNG, PDF A4, Thermal Print direct)
 * 9.3 Merge Tables for Large Groups (Creates combined group_id)
 * ===================================================================
 */

let isLinkTablesMode = false;
let selectedTablesToMerge = [];

function renderTables(el) {
  const freeCount = STATE.tables.filter(t => t.status === 'Free').length;
  const occupiedCount = STATE.tables.filter(t => t.status === 'Occupied' || t.status === 'Billing Pending').length;

  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Floor Plan, Tables & QR Standees', 'Live dining room occupancy, customer QR code generation, and multi-table group merging.',
        `<div class="flex items-center gap-2">
          <button onclick="toggleLinkTablesMode()" id="link-tables-toggle-btn"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${isLinkTablesMode ? 'bg-amber-500 text-black shadow-lg animate-pulse' : 'bg-dark-700/80 text-gray-300 hover:text-white'}">
            🔗 ${isLinkTablesMode ? 'Selecting Tables to Merge...' : 'Link Tables (Merge Group)'}
          </button>
          <button onclick="openAddTableModal()" class="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md">
            + Add Table
          </button>
        </div>`)}

      <!-- Status Header & Merge Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-800/80 p-3.5 rounded-2xl border border-white/5">
        <div class="flex items-center gap-4 text-xs">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span> Free (${freeCount})</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> Occupied (${occupiedCount})</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Billing Pending (1)</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-gray-500"></span> Cleaning (1)</span>
        </div>
        ${isLinkTablesMode ? `
          <div class="flex items-center gap-2 text-xs">
            <span class="text-amber-400 font-semibold">Selected: ${selectedTablesToMerge.join(', ') || 'None'}</span>
            <button onclick="confirmMergeTables()" class="btn-primary px-3 py-1 rounded-lg text-xs font-bold">Merge Selected</button>
            <button onclick="cancelMergeTables()" class="btn-ghost px-2.5 py-1 rounded-lg text-xs">Cancel</button>
          </div>
        ` : `
          <span class="text-[11px] text-gray-400">💡 Drag tables to rearrange or click QR icon to print standee.</span>
        `}
      </div>

      <!-- 9.1 Visual Floor Plan Grid with Drag & Drop Simulation -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="floor-plan-grid">
        ${STATE.tables.map(t => {
          const isSelected = selectedTablesToMerge.includes(t.id);
          const colorClass =
            t.status === 'Occupied' ? 'bg-red-500/15 border-red-500/40 text-red-400' :
            t.status === 'Billing Pending' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' :
            t.status === 'Cleaning' ? 'bg-gray-500/15 border-gray-500/40 text-gray-400' :
            'bg-green-500/15 border-green-500/40 text-green-400';

          return `
            <div id="table-card-${t.id}"
                 draggable="true"
                 ondragstart="handleTableDragStart(event, '${t.id}')"
                 ondragover="handleTableDragOver(event)"
                 ondrop="handleTableDrop(event, '${t.id}')"
                 onclick="handleTableClick('${t.id}')"
                 class="glass-card interactive-card rounded-2xl p-4 flex flex-col justify-between border cursor-pointer ${isSelected ? 'ring-2 ring-saffron-400 bg-saffron-500/10' : colorClass}">
              
              <div class="flex items-center justify-between mb-2">
                <span class="text-lg font-extrabold text-white">${t.id} ${t.mergedWith ? `<span class="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">Linked: ${t.mergedWith}</span>` : ''}</span>
                <button onclick="event.stopPropagation(); openQRModal('${t.id}')" class="p-1 rounded-lg bg-dark-700/80 hover:bg-dark-600 text-gray-300 hover:text-white" title="Generate QR Code Standee">
                  <svg class="w-4 h-4 text-saffron-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                </button>
              </div>

              <div class="text-xs space-y-1">
                <div class="text-gray-300 font-semibold">${t.zone} · ${t.capacity} Seats</div>
                <div class="text-[11px] text-gray-400 font-medium">Status: <strong class="text-white">${t.status}</strong></div>
                ${t.status === 'Occupied' || t.status === 'Billing Pending' ? `
                  <div class="text-[11px] text-gray-400">Waiter: <span class="text-white">${t.waiter}</span></div>
                  <div class="text-[11px] text-saffron-400 font-bold">${formatINR(t.billAmount)} (${t.covers} covers)</div>
                ` : `
                  <div class="text-[11px] text-gray-500">Ready for guests</div>
                `}
              </div>

              <div class="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                <span>Hold & drag to move</span>
                <span class="text-saffron-400 font-semibold">Details →</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ===================================================================
// 9.1 TABLE CRUD & DRAG-AND-DROP
// ===================================================================
let draggedTableId = null;

function handleTableDragStart(e, tableId) {
  draggedTableId = tableId;
  e.dataTransfer.setData('text/plain', tableId);
}

function handleTableDragOver(e) {
  e.preventDefault();
}

function handleTableDrop(e, targetTableId) {
  e.preventDefault();
  if (!draggedTableId || draggedTableId === targetTableId) return;

  // Swap table positions in array
  const idx1 = STATE.tables.findIndex(t => t.id === draggedTableId);
  const idx2 = STATE.tables.findIndex(t => t.id === targetTableId);
  if (idx1 >= 0 && idx2 >= 0) {
    const temp = STATE.tables[idx1];
    STATE.tables[idx1] = STATE.tables[idx2];
    STATE.tables[idx2] = temp;
    renderTables(document.getElementById('main-content'));
    showToast(`Floor layout rearranged: Swapped ${draggedTableId} and ${targetTableId}`, 'success');
  }
}

function handleTableClick(tableId) {
  if (isLinkTablesMode) {
    if (selectedTablesToMerge.includes(tableId)) {
      selectedTablesToMerge = selectedTablesToMerge.filter(id => id !== tableId);
    } else {
      selectedTablesToMerge.push(tableId);
    }
    renderTables(document.getElementById('main-content'));
    return;
  }

  // Open Table Details Slide-Over
  openTableDetailsSlideOver(tableId);
}

function openAddTableModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <h3 class="text-base font-bold text-white">Add Dining Table</h3>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>
    <form onsubmit="handleAddTableSubmit(event)" class="space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1">Table Number / Label *</label>
        <input type="text" name="id" required value="T-${String(STATE.tables.length + 1).padStart(2, '0')}" class="w-full p-2.5 rounded-lg font-bold" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Seating Capacity *</label>
          <input type="number" name="capacity" required value="4" class="w-full p-2.5 rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Floor Zone *</label>
          <select name="zone" class="w-full p-2.5 rounded-lg">
            <option value="Indoor Main">Indoor Main</option>
            <option value="AC Family">AC Family Dining</option>
            <option value="Rooftop Lounge">Rooftop Lounge</option>
            <option value="Outdoor Patio">Outdoor Patio</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 pt-3">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Add Table & Generate QR</button>
      </div>
    </form>
  `);
}

function handleAddTableSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const newTable = {
    id: fd.get('id'),
    capacity: Number(fd.get('capacity')) || 4,
    zone: fd.get('zone'),
    status: 'Free',
    waiter: '—',
    timeSeated: '—',
    covers: 0,
    billAmount: 0,
    orderItems: [],
    mergedWith: null
  };
  STATE.tables.push(newTable);
  closeModal();
  renderTables(document.getElementById('main-content'));
  showToast(`Added table ${newTable.id} with seating for ${newTable.capacity}`, 'success');
}

// ===================================================================
// 9.2 QR GENERATION (STANDARDS: PNG, PDF A4, DIRECT THERMAL)
// ===================================================================
function openQRModal(tableId) {
  const t = STATE.tables.find(x => x.id === tableId);
  if (!t) return;

  const qrUrl = `https://qrdine.com/t/${t.id}`;
  // Standard SVG QR mock rendering
  const qrSvg = `
    <svg viewBox="0 0 160 160" class="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl">
      <rect width="160" height="160" fill="#ffffff"/>
      <!-- Outer position squares -->
      <rect x="15" y="15" width="40" height="40" fill="#000000"/>
      <rect x="23" y="23" width="24" height="24" fill="#ffffff"/>
      <rect x="29" y="29" width="12" height="12" fill="#f59e0b"/>

      <rect x="105" y="15" width="40" height="40" fill="#000000"/>
      <rect x="113" y="23" width="24" height="24" fill="#ffffff"/>
      <rect x="119" y="29" width="12" height="12" fill="#f59e0b"/>

      <rect x="15" y="105" width="40" height="40" fill="#000000"/>
      <rect x="23" y="113" width="24" height="24" fill="#ffffff"/>
      <rect x="29" y="119" width="12" height="12" fill="#f59e0b"/>

      <!-- Data grid mock -->
      <rect x="65" y="20" width="10" height="20" fill="#000000"/>
      <rect x="85" y="30" width="10" height="10" fill="#000000"/>
      <rect x="65" y="65" width="30" height="30" fill="#f59e0b" rx="4"/>
      <rect x="20" y="65" width="10" height="30" fill="#000000"/>
      <rect x="110" y="65" width="20" height="10" fill="#000000"/>
      <rect x="70" y="110" width="20" height="30" fill="#000000"/>
      <rect x="105" y="110" width="35" height="15" fill="#000000"/>
    </svg>
  `;

  openModal(`
    <div class="text-center pb-4 border-b border-white/10 mb-4">
      <div class="text-[11px] font-bold text-saffron-400 uppercase tracking-wider">Customer Contactless Ordering</div>
      <h3 class="text-xl font-bold text-white mt-1">Table Standee QR — ${t.id}</h3>
      <p class="text-xs text-gray-400">${t.zone} · ${t.capacity} Seats</p>
    </div>

    <div class="space-y-4 text-center">
      ${qrSvg}

      <div class="bg-dark-700/60 p-2.5 rounded-xl text-xs font-mono text-gray-300 break-all max-w-sm mx-auto">
        ${qrUrl}
      </div>

      <!-- Action Buttons (Section 9.2) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
        <button onclick="downloadQRPNG('${t.id}')" class="btn-ghost py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
          <span>Download PNG</span>
        </button>
        <button onclick="downloadQRA4PDF('${t.id}')" class="btn-ghost py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
          <span>Download A4 PDF</span>
        </button>
        <button onclick="printDirectThermal('${t.id}')" class="btn-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
          <span>Direct Thermal 🖨</span>
        </button>
      </div>

      <p class="text-[10px] text-gray-500">
        Direct Thermal sends 80mm ESC/POS command to configured LAN printer IP (${STATE.settings.printerIp}).
      </p>
    </div>
  `);
}

function downloadQRPNG(tableId) {
  showToast(`Downloaded Standee PNG for Table ${tableId}`, 'success');
}

function downloadQRA4PDF(tableId) {
  showToast(`Generated print-ready A4 Standee PDF for Table ${tableId}`, 'success');
}

function printDirectThermal(tableId) {
  showToast(`Printed standee slip for Table ${tableId} to thermal printer @ ${STATE.settings.printerIp}`, 'success');
}

// ===================================================================
// 9.3 MERGE TABLES (FOR LARGE GROUPS - CREATES COMBINED GROUP_ID)
// ===================================================================
function toggleLinkTablesMode() {
  isLinkTablesMode = !isLinkTablesMode;
  selectedTablesToMerge = [];
  renderTables(document.getElementById('main-content'));

  if (isLinkTablesMode) {
    showToast('Link Mode: Click 2 or more tables to combine them for large groups.', 'warning');
  }
}

function cancelMergeTables() {
  isLinkTablesMode = false;
  selectedTablesToMerge = [];
  renderTables(document.getElementById('main-content'));
}

function confirmMergeTables() {
  if (selectedTablesToMerge.length < 2) {
    showToast('Please select at least 2 tables to link together.', 'error');
    return;
  }

  const combinedLabel = selectedTablesToMerge.join(' + ');
  selectedTablesToMerge.forEach(id => {
    const t = STATE.tables.find(x => x.id === id);
    if (t) {
      t.mergedWith = combinedLabel;
      t.status = 'Occupied';
      t.covers = 8;
    }
  });

  isLinkTablesMode = false;
  selectedTablesToMerge = [];
  renderTables(document.getElementById('main-content'));
  showToast(`Tables linked into group: "${combinedLabel}". KOTs and billing will print combined.`, 'success');
}

function openTableDetailsSlideOver(tableId) {
  const t = STATE.tables.find(x => x.id === tableId);
  if (!t) return;

  const content = `
    <div class="space-y-4 text-xs">
      <div class="glass-card rounded-2xl p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-400 uppercase">${t.zone}</span>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'Occupied' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}">${t.status}</span>
        </div>
        <h3 class="text-2xl font-extrabold text-white mt-1">${t.id}</h3>
        ${t.mergedWith ? `<div class="text-xs text-amber-400 mt-1 font-bold">Combined Group: ${t.mergedWith}</div>` : ''}
      </div>

      <div class="glass-card rounded-2xl p-4 space-y-2.5">
        <div class="font-bold text-white uppercase text-saffron-400">Dining Session Details</div>
        <div class="flex justify-between"><span class="text-gray-400">Assigned Waiter</span><span class="text-white font-bold">${t.waiter}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Seating Capacity</span><span class="text-white">${t.capacity} Guests</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Active Covers Seated</span><span class="text-white font-bold">${t.covers} Persons</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Time Since Seated</span><span class="text-white">${t.timeSeated}</span></div>
        <div class="flex justify-between pt-2 border-t border-white/5"><span class="text-gray-400">Current Check Amount</span><span class="text-base font-extrabold text-saffron-400">${formatINR(t.billAmount)}</span></div>
      </div>

      <div class="glass-card rounded-2xl p-4">
        <div class="font-bold text-white uppercase text-saffron-400 mb-2">Active KOT Dishes</div>
        ${t.orderItems.length > 0 ? `
          <ul class="space-y-1.5 list-disc pl-4 text-gray-200">
            ${t.orderItems.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : `
          <div class="text-gray-500 py-2">No active kitchen orders for this table.</div>
        `}
      </div>

      <div class="flex gap-2 pt-2">
        <button onclick="openQRModal('${t.id}')" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">
          View & Print QR Standee
        </button>
      </div>
    </div>
  `;

  openSlideOver(`Table Details — ${t.id}`, content);
}
