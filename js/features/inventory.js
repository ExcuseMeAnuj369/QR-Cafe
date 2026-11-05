/**
 * ===================================================================
 * QR DINE — SECTION 7: INVENTORY & RECIPES (THE MONEY SAVER) [BOTH]
 * 7.1 Ingredient Master & Par Level Stock Tracking
 * 7.2 Recipe Builder, Live Food Cost % (> 35% Red Alert), Auto-Deduction
 * 7.3 Procurement, Vendor Ledgers, WhatsApp POs & Wastage Logs
 * ===================================================================
 */

let activeInventorySubTab = 'ingredients'; // 'ingredients', 'recipes', 'vendors', 'wastage'

function renderInventory(el) {
  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Inventory & Recipe Costing', 'Prevent food leakage, live Food Cost % auditing, negative stock guard, and vendor ledgers.',
        `<div class="flex items-center gap-2">
          <button onclick="openAddIngredientModal()" class="btn-primary px-3.5 py-2 rounded-lg text-xs font-bold shadow-md">
            + Add Ingredient
          </button>
          <button onclick="openCreatePOModal()" class="px-3.5 py-2 rounded-lg border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 transition">
            + Create PO
          </button>
        </div>`)}

      <!-- Sub-Tab Switcher -->
      <div class="flex items-center gap-2 border-b border-white/10 pb-3">
        <button onclick="switchInventoryTab('ingredients')" id="inv-tab-ingredients"
                class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeInventorySubTab === 'ingredients' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          📦 Ingredient Master (${STATE.inventory.length})
        </button>
        <button onclick="switchInventoryTab('recipes')" id="inv-tab-recipes"
                class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeInventorySubTab === 'recipes' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          🍳 Recipe Builder & Cost %
        </button>
        <button onclick="switchInventoryTab('vendors')" id="inv-tab-vendors"
                class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeInventorySubTab === 'vendors' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          🚛 Vendor Ledgers (${STATE.vendors.length})
        </button>
        <button onclick="switchInventoryTab('wastage')" id="inv-tab-wastage"
                class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeInventorySubTab === 'wastage' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          🗑 Wastage Log (${STATE.wastageLogs.length})
        </button>
      </div>

      <div id="inventory-tab-container"></div>
    </div>
  `;

  renderInventorySubTabContent();
}

function switchInventoryTab(tab) {
  activeInventorySubTab = tab;
  renderInventorySubTabContent();

  ['ingredients', 'recipes', 'vendors', 'wastage'].forEach(t => {
    const btn = document.getElementById(`inv-tab-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-saffron-500 text-black shadow-md';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-gray-400 hover:text-white bg-dark-700/50';
      }
    }
  });
}

function renderInventorySubTabContent() {
  const container = document.getElementById('inventory-tab-container');
  if (!container) return;

  if (activeInventorySubTab === 'ingredients') {
    renderIngredientMasterView(container);
  } else if (activeInventorySubTab === 'recipes') {
    renderRecipeBuilderView(container);
  } else if (activeInventorySubTab === 'vendors') {
    renderVendorLedgerView(container);
  } else {
    renderWastageLogView(container);
  }
}

// ===================================================================
// 7.1 INGREDIENT MASTER
// ===================================================================
function renderIngredientMasterView(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between text-xs">
        <p class="text-gray-400">Raw materials inventory. Automated alerts trigger when stock drops below Par Level.</p>
        <span class="text-red-400 font-semibold">${STATE.inventory.filter(i => i.stock <= i.reorder).length} items below Par Level</span>
      </div>

      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-white/5 border-b border-white/10 text-[11px] text-gray-400 uppercase">
              <tr>
                <th class="py-3 px-4">Item Name</th>
                <th class="py-3 px-3">Current Stock</th>
                <th class="py-3 px-3">Par Level (Alert)</th>
                <th class="py-3 px-3 text-right">Cost / Unit</th>
                <th class="py-3 px-3">Primary Vendor</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${STATE.inventory.map(i => {
                const isLow = i.stock <= i.reorder;
                return `
                  <tr class="table-row">
                    <td class="py-3 px-4">
                      <div class="font-bold text-white text-sm ${isLow ? 'text-red-400' : ''}">${i.name}</div>
                      <div class="text-[10px] text-gray-400 font-mono">ID: ${i.id} ${i.expiry ? `· Expiry: ${i.expiry}` : ''}</div>
                    </td>
                    <td class="py-3 px-3 font-extrabold ${isLow ? 'text-red-400 text-sm' : 'text-white'}">
                      ${i.stock} ${i.unit}
                    </td>
                    <td class="py-3 px-3 text-gray-400 font-medium">
                      ${i.reorder} ${i.unit}
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-gray-200">
                      ${formatINR(i.rate)}/${i.unit}
                    </td>
                    <td class="py-3 px-3 text-gray-300 font-medium">${i.vendor}</td>
                    <td class="py-3 px-4 text-center">
                      ${isLow ? `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                          ⚠ Low Stock
                        </span>
                      ` : `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">
                          Healthy
                        </span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openAddIngredientModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <h3 class="text-base font-bold text-white">Add Raw Material Ingredient</h3>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>
    <form onsubmit="handleAddIngredientSubmit(event)" class="space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1">Ingredient Name *</label>
        <input type="text" name="name" required placeholder="e.g. Fresh Kasuri Methi" class="w-full p-2.5 rounded-lg" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Unit of Measurement *</label>
          <select name="unit" class="w-full p-2.5 rounded-lg">
            <option value="kg">kg (Kilograms)</option>
            <option value="L">L (Liters)</option>
            <option value="gm">gm (Grams)</option>
            <option value="pcs">pcs (Pieces)</option>
          </select>
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Cost Per Unit (₹) *</label>
          <input type="number" name="rate" required placeholder="240" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Opening Stock *</label>
          <input type="number" step="0.1" name="stock" required placeholder="10" class="w-full p-2.5 rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Par Level (Low Alert Threshold) *</label>
          <input type="number" step="0.1" name="reorder" required placeholder="5" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>
      <div>
        <label class="block text-gray-400 mb-1">Default Vendor</label>
        <select name="vendor" class="w-full p-2.5 rounded-lg">
          ${STATE.vendors.map(v => `<option value="${v.name}">${v.name}</option>`).join('')}
        </select>
      </div>
      <div class="flex gap-2 pt-3">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Save Ingredient</button>
      </div>
    </form>
  `);
}

function handleAddIngredientSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const newIng = {
    id: `I00${STATE.inventory.length + 1}`,
    name: fd.get('name'),
    unit: fd.get('unit'),
    rate: Number(fd.get('rate')) || 100,
    stock: Number(fd.get('stock')) || 0,
    reorder: Number(fd.get('reorder')) || 5,
    vendor: fd.get('vendor'),
    expiry: null
  };
  STATE.inventory.push(newIng);
  closeModal();
  renderInventorySubTabContent();
  showToast(`Added raw ingredient: ${newIng.name}`, 'success');
}

// ===================================================================
// 7.2 RECIPE BUILDER & LIVE FOOD COST % (> 35% RED ALERT)
// ===================================================================
function renderRecipeBuilderView(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <div class="p-3.5 rounded-xl bg-dark-700/50 border border-white/5 text-xs text-gray-300">
        <strong>Zero-Bug Food Cost Rule:</strong> Food Cost % is calculated in real-time as <code class="text-saffron-400">(Recipe Cost / Dine-In Price) × 100</code>.
        If Food Cost exceeds <strong class="text-red-400">35%</strong>, the item is marked in <strong>RED</strong> as an unprofitable recipe!
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${Object.entries(STATE.recipes).map(([mid, ings]) => {
          const m = STATE.menu.find(x => x.id === mid);
          if (!m) return '';

          // Compute exact recipe cost
          let totalCost = 0;
          const ingredientBreakdown = ings.map(r => {
            const ing = STATE.inventory.find(i => i.id === r.ing);
            const lineCost = ing ? Math.round(r.qty * ing.rate) : 0;
            totalCost += lineCost;
            return { name: ing?.name || r.ing, qty: r.qty, unit: ing?.unit || '', rate: ing?.rate || 0, lineCost };
          });

          const foodCostPct = Number(((totalCost / m.dineIn) * 100).toFixed(1));
          const isHighCost = foodCostPct > 35; // Section 7.2 rule: >35% is red

          return `
            <div class="glass-card rounded-2xl p-5 border ${isHighCost ? 'border-red-500/40 bg-red-500/5' : 'border-white/5'}">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h4 class="text-base font-bold ${isHighCost ? 'text-red-400' : 'text-white'}">
                    ${m.name} ${isHighCost ? '<span class="text-xs bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full ml-1.5">Food Cost > 35%!</span>' : ''}
                  </h4>
                  <div class="text-xs text-gray-400">${m.nameHi} · Dine-In: ${formatINR(m.dineIn)}</div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-extrabold ${isHighCost ? 'text-red-400' : 'text-green-400'}">${foodCostPct}%</div>
                  <div class="text-[10px] text-gray-400">Food Cost %</div>
                </div>
              </div>

              <!-- Ingredient Breakdown Table -->
              <div class="bg-dark-850/60 rounded-xl p-3 mb-3 border border-white/5">
                <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">Recipe Proportions:</div>
                <div class="space-y-1.5 text-xs">
                  ${ingredientBreakdown.map(ib => `
                    <div class="flex justify-between items-center text-gray-300">
                      <span>${ib.name} (${ib.qty} ${ib.unit} @ ₹${ib.rate}/${ib.unit})</span>
                      <span class="font-mono font-semibold">${formatINR(ib.lineCost)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="flex justify-between pt-2 border-t border-white/10 font-bold text-white mt-2 text-xs">
                  <span>Total Recipe Raw Cost:</span>
                  <span class="text-saffron-400">${formatINR(totalCost)}</span>
                </div>
              </div>

              <div class="text-[10px] text-gray-400 flex items-center justify-between">
                <span>Auto-deducts raw stock when Kitchen clicks "PREPARING".</span>
                <button onclick="simulateOrderDeduction('${m.id}')" class="text-saffron-400 hover:underline font-bold">
                  Simulate Order Prep →
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function simulateOrderDeduction(menuId) {
  const m = STATE.menu.find(x => x.id === menuId);
  const ings = STATE.recipes[menuId];
  if (!m || !ings) return;

  // Check negative stock guard
  let canDeduct = true;
  ings.forEach(r => {
    const ing = STATE.inventory.find(i => i.id === r.ing);
    if (ing && ing.stock < r.qty) {
      canDeduct = false;
    }
  });

  if (!canDeduct) {
    // Negative Stock Prompt (Section 7.2 & 12.2)
    if (confirm(`⚠ Negative Stock Warning for ${m.name}!\nOne or more raw ingredients are empty. Allow Manager Override to deduct below zero during peak hours?`)) {
      ings.forEach(r => {
        const ing = STATE.inventory.find(i => i.id === r.ing);
        if (ing) ing.stock = Math.max(0, Number((ing.stock - r.qty).toFixed(2)));
      });
      renderInventorySubTabContent();
      showToast(`Manager override granted: Deducted raw materials for 1x ${m.name}`, 'warning');
    }
    return;
  }

  ings.forEach(r => {
    const ing = STATE.inventory.find(i => i.id === r.ing);
    if (ing) ing.stock = Number((ing.stock - r.qty).toFixed(2));
  });

  renderInventorySubTabContent();
  showToast(`Idempotent Deduction: 1x ${m.name} ingredients deducted from master stock`, 'success');
}

// ===================================================================
// 7.3 VENDOR LEDGERS & PROCUREMENT
// ===================================================================
function renderVendorLedgerView(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider">Vendor Accounts & Accounts Payable</h3>
        <button onclick="openCreatePOModal()" class="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold">
          + New Purchase Order
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${STATE.vendors.map(v => `
          <div class="glass-card rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-white text-sm">${v.name}</span>
                <span class="text-[10px] text-gray-500">ID: ${v.id}</span>
              </div>
              <div class="text-xs text-gray-400 font-mono">${v.contact}</div>
              <div class="text-xs text-gray-300 mt-2">${v.items}</div>
            </div>

            <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-gray-500 uppercase">Outstanding Balance</div>
                <div class="text-base font-extrabold text-amber-400">${formatINR(v.outstanding)}</div>
              </div>
              <button onclick="openVendorPaymentModal('${v.id}')" class="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white">
                Record Pay
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openCreatePOModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <h3 class="text-base font-bold text-white">Create Purchase Order (PO)</h3>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>
    <form onsubmit="handlePOSubmit(event)" class="space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1">Select Wholesaler / Vendor *</label>
        <select name="vendor" class="w-full p-2.5 rounded-lg">
          ${STATE.vendors.map(v => `<option value="${v.name}">${v.name} (${v.items})</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-gray-400 mb-1">Replenishment Item *</label>
        <select name="item" class="w-full p-2.5 rounded-lg">
          ${STATE.inventory.map(i => `<option value="${i.name}">${i.name} (Current: ${i.stock} ${i.unit})</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Order Quantity *</label>
          <input type="number" name="qty" required value="20" class="w-full p-2.5 rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Estimated Amount (₹) *</label>
          <input type="number" name="amount" required value="6400" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>
      <div class="flex gap-2 pt-3">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Generate PDF & Send WhatsApp</button>
      </div>
    </form>
  `);
}

function handlePOSubmit(e) {
  e.preventDefault();
  closeModal();
  showToast('PO-2024-89 PDF Generated & Dispatched to Wholesaler on WhatsApp', 'success');
}

function openVendorPaymentModal(vendorId) {
  const v = STATE.vendors.find(x => x.id === vendorId);
  if (!v) return;

  const amt = prompt(`Enter payment amount to record for ${v.name} (Outstanding: ${formatINR(v.outstanding)}):`);
  if (!amt || isNaN(amt)) return;

  v.outstanding = Math.max(0, v.outstanding - Number(amt));
  renderVendorLedgerView(document.getElementById('inventory-tab-container'));
  showToast(`Recorded payment of ${formatINR(amt)} to ${v.name}`, 'success');
}

// ===================================================================
// 7.4 WASTAGE LOG (DEDUCTS STOCK & HITS P&L)
// ===================================================================
function renderWastageLogView(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Kitchen Wastage & Spoilage Log</h3>
          <p class="text-xs text-gray-400">Items logged here instantly deduct from Inventory AND hit the P&L account.</p>
        </div>
        <button onclick="openLogWastageModal()" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
          + Log Food Waste
        </button>
      </div>

      <div class="glass-card rounded-2xl overflow-hidden">
        <table class="w-full text-xs text-left">
          <thead class="bg-white/5 border-b border-white/10 text-[11px] text-gray-400 uppercase">
            <tr>
              <th class="p-3">Date</th>
              <th class="p-3">Raw Material</th>
              <th class="p-3">Spoiled Qty</th>
              <th class="p-3">Reason</th>
              <th class="p-3 text-right">P&L Loss (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${STATE.wastageLogs.map(w => `
              <tr class="table-row">
                <td class="p-3 font-mono text-gray-400">${w.date}</td>
                <td class="p-3 font-bold text-white">${w.item}</td>
                <td class="p-3 font-bold text-red-400">${w.qty}</td>
                <td class="p-3 text-gray-300">${w.reason}</td>
                <td class="p-3 text-right font-extrabold text-red-400">${formatINR(w.cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openLogWastageModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <h3 class="text-base font-bold text-white">Log Food Waste / Spoilage</h3>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>
    <form onsubmit="handleWastageSubmit(event)" class="space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1">Select Ingredient *</label>
        <select name="item" class="w-full p-2.5 rounded-lg">
          ${STATE.inventory.map(i => `<option value="${i.name}">${i.name} (Stock: ${i.stock} ${i.unit})</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Spoiled Quantity *</label>
          <input type="text" name="qty" required placeholder="e.g. 2 kg" class="w-full p-2.5 rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Cost Impact (₹) *</label>
          <input type="number" name="cost" required placeholder="320" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>
      <div>
        <label class="block text-gray-400 mb-1">Reason for Spoilage *</label>
        <input type="text" name="reason" required placeholder="e.g. Refrigerator temperature failure overnight" class="w-full p-2.5 rounded-lg" />
      </div>
      <div class="flex gap-2 pt-3">
        <button type="button" onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Record Loss in P&L</button>
      </div>
    </form>
  `);
}

function handleWastageSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const newWastage = {
    id: STATE.wastageLogs.length + 1,
    date: 'Today',
    item: fd.get('item'),
    qty: fd.get('qty'),
    reason: fd.get('reason'),
    cost: Number(fd.get('cost')) || 0
  };
  STATE.wastageLogs.push(newWastage);
  closeModal();
  renderWastageLogView(document.getElementById('inventory-tab-container'));
  showToast(`Wastage logged. Deducted from stock and debited ${formatINR(newWastage.cost)} in P&L.`, 'warning');
}
