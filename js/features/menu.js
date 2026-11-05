/**
 * ===================================================================
 * QR DINE — SECTION 8: MENU & PRICING (DEEP DIVE) [BOTH]
 * 8.1 Menu CRUD & UI Layout (Two-Column, Station Routing, Owner Locked Pricing, Aggregator Sync)
 * 8.2 BCG Menu Engineering Scatter Plot Matrix (Stars, Plowhorses, Puzzles, Dogs)
 * ===================================================================
 */

let selectedCategory = 'All';
let activeMenuViewMode = 'grid'; // 'grid' or 'bcg'

function renderMenu(el) {
  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Menu & Dynamic Pricing', 'Multilingual catalog (Hindi + English), KOT station routing, locked pricing with Owner Override, and BCG matrix.',
        `<div class="flex items-center gap-2">
          <button onclick="switchMenuView('grid')" id="menu-view-grid"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeMenuViewMode === 'grid' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            🍽️ Catalog Grid
          </button>
          <button onclick="switchMenuView('bcg')" id="menu-view-bcg"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeMenuViewMode === 'bcg' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            ⭐ BCG Engineering Matrix
          </button>
          <button onclick="openMenuEditModal(null)" class="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md ml-2">
            + Add New Dish
          </button>
        </div>`)}

      <div id="menu-main-container"></div>
    </div>
  `;

  renderActiveMenuView();
}

function switchMenuView(mode) {
  activeMenuViewMode = mode;
  renderActiveMenuView();

  const gBtn = document.getElementById('menu-view-grid');
  const bBtn = document.getElementById('menu-view-bcg');
  if (gBtn && bBtn) {
    if (mode === 'grid') {
      gBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-saffron-500 text-black shadow-md';
      bBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-gray-400 hover:text-white bg-dark-700/50';
    } else {
      bBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-saffron-500 text-black shadow-md';
      gBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-gray-400 hover:text-white bg-dark-700/50';
    }
  }
}

function renderActiveMenuView() {
  const container = document.getElementById('menu-main-container');
  if (!container) return;

  if (activeMenuViewMode === 'grid') {
    renderTwoColumnMenuCatalog(container);
  } else {
    renderBCGScatterMatrix(container);
  }
}

// ===================================================================
// 8.1 TWO-COLUMN MENU CRUD (Categories on Left, Cards on Right)
// ===================================================================
function renderTwoColumnMenuCatalog(el) {
  const filteredItems = selectedCategory === 'All' ? STATE.menu : STATE.menu.filter(m => m.category === selectedCategory);

  el.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Left Column: Categories List -->
      <div class="glass-card rounded-2xl p-4 h-fit space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Categories</div>
        ${STATE.categories.map(cat => `
          <button onclick="filterMenuCategory('${cat}')"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${selectedCategory === cat ? 'bg-saffron-500/20 text-saffron-400 border border-saffron-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}">
            <span>${cat}</span>
            <span class="text-[10px] text-gray-500 font-mono">${cat === 'All' ? STATE.menu.length : STATE.menu.filter(m => m.category === cat).length}</span>
          </button>
        `).join('')}
      </div>

      <!-- Right Column: Menu Cards Grid -->
      <div class="lg:col-span-3 space-y-4">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-400">Showing <strong>${filteredItems.length}</strong> items in <strong>${selectedCategory}</strong></span>
          ${!isOwner() ? `<span class="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">${icon('lock')} Prices locked for Manager (Click to Override)</span>` : ''}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredItems.map(m => {
            const bcg = calcMenuBCG(m);
            return `
              <div onclick="openMenuEditModal('${m.id}')"
                   class="glass-card interactive-card rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group border border-white/5">
                <div class="relative h-32 overflow-hidden">
                  <img src="${m.image}" alt="${m.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div class="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>
                  <!-- Veg / Non-Veg Indicator Dot -->
                  <div class="absolute top-2.5 left-2.5 w-4 h-4 rounded bg-dark-900/90 border ${m.isVeg ? 'border-green-500' : 'border-red-500'} flex items-center justify-center p-0.5">
                    <div class="w-2 h-2 rounded-full ${m.isVeg ? 'bg-green-500' : 'bg-red-500'}"></div>
                  </div>
                  <!-- BCG Badge -->
                  <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${bcg.badgeColor}">
                    ${bcg.quadrant}
                  </div>
                </div>

                <div class="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 class="font-bold text-white text-sm group-hover:text-saffron-400 transition">${m.name}</h4>
                    <div class="text-xs text-gray-400">${m.nameHi}</div>
                    <div class="text-[11px] text-gray-500 mt-1">Station: <strong class="text-gray-300">${m.station}</strong> · ${m.prepTime}m prep</div>
                  </div>

                  <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div class="text-[10px] text-gray-500 uppercase">Dine-in</div>
                      <div class="font-extrabold text-saffron-400 text-sm flex items-center">
                        ${formatINR(m.dineIn)}
                        ${!isOwner() ? icon('lock') : ''}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-[10px] text-gray-500 uppercase">Online (Swiggy/Zomato)</div>
                      <div class="font-extrabold text-white text-sm">${formatINR(m.online)}</div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function filterMenuCategory(cat) {
  selectedCategory = cat;
  renderTwoColumnMenuCatalog(document.getElementById('menu-main-container'));
}

// Full Modal for Menu Add / Edit
function openMenuEditModal(menuId) {
  const m = menuId ? STATE.menu.find(x => x.id === menuId) : null;
  const isNew = !m;

  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-bold text-white">${isNew ? 'Create Menu Item' : `Edit Item — ${m.name}`}</h3>
        <p class="text-xs text-gray-400">Hindi + English naming, KOT routing station, pricing & aggregator sync.</p>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form onsubmit="handleMenuSubmit(event, '${m ? m.id : ''}')" class="space-y-4 text-xs">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Item Name (English) *</label>
          <input type="text" name="name" required value="${m ? m.name : ''}" placeholder="e.g. Malai Kofta" class="w-full p-2.5 rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Item Name (Hindi) *</label>
          <input type="text" name="nameHi" required value="${m ? m.nameHi : ''}" placeholder="मलाई कोफ्ता" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">Category *</label>
          <select name="category" class="w-full p-2.5 rounded-lg">
            ${STATE.categories.filter(c => c !== 'All').map(c => `
              <option value="${c}" ${m && m.category === c ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Station Routing (KOT) *</label>
          <select name="station" class="w-full p-2.5 rounded-lg">
            <option value="Grill" ${m && m.station === 'Grill' ? 'selected' : ''}>Grill / Tandoor</option>
            <option value="Fry" ${m && m.station === 'Fry' ? 'selected' : ''}>Fry / Curry</option>
            <option value="Bar" ${m && m.station === 'Bar' ? 'selected' : ''}>Beverage Bar</option>
            <option value="Dessert" ${m && m.station === 'Dessert' ? 'selected' : ''}>Dessert Counter</option>
          </select>
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Prep Time (Mins) *</label>
          <input type="number" name="prepTime" required value="${m ? m.prepTime : 15}" class="w-full p-2.5 rounded-lg" />
        </div>
      </div>

      <!-- PRICING SECTION (OWNER ONLY LOCKED) -->
      <div class="p-3.5 rounded-xl bg-dark-700/50 border border-white/5 space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold text-saffron-400 uppercase tracking-wider">Dynamic Channel Pricing [Owner Protected]</div>
          ${!isOwner() ? `<span class="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">${icon('lock')} Locked (Click to enter Owner PIN)</span>` : ''}
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="${!isOwner() ? 'locked-field' : ''}" onclick="${!isOwner() ? `requestOwnerOverride('Dine-In Price', () => openMenuEditModal('${menuId}'))` : ''}">
            <label class="block text-gray-400 mb-1">Dine-In Price (₹) *</label>
            <input type="number" name="dineIn" required value="${m ? m.dineIn : 280}" ${!isOwner() ? 'readonly' : ''} class="w-full p-2.5 rounded-lg" />
          </div>
          <div class="${!isOwner() ? 'locked-field' : ''}" onclick="${!isOwner() ? `requestOwnerOverride('Zomato/Swiggy Price', () => openMenuEditModal('${menuId}'))` : ''}">
            <label class="block text-gray-400 mb-1">Zomato / Swiggy Price (₹) *</label>
            <input type="number" name="online" required value="${m ? m.online : 320}" ${!isOwner() ? 'readonly' : ''} class="w-full p-2.5 rounded-lg" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Takeaway / Parcel Price (₹)</label>
            <input type="number" name="takeaway" value="${m ? m.takeaway : 260}" class="w-full p-2.5 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- Aggregator Auto-Sync Toggle (Section 8.1) -->
      <div class="p-3 rounded-xl bg-dark-700/40 border border-white/5 flex items-center justify-between">
        <div>
          <div class="font-bold text-white">Aggregator Out-of-Stock Auto-Sync</div>
          <div class="text-[11px] text-gray-400">If Kitchen marks Sold Out in Staff Ops, instantly 86 this item on Zomato & Swiggy.</div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" name="autoSync" ${m && m.autoSyncOutOfStock ? 'checked' : ''} class="sr-only peer" />
          <div class="w-9 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-saffron-500"></div>
        </label>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
        <button type="button" onclick="closeModal()" class="btn-ghost px-4 py-2 rounded-lg text-xs font-semibold">Cancel</button>
        <button type="submit" class="btn-primary px-6 py-2 rounded-lg text-xs font-bold">Save Menu Item</button>
      </div>
    </form>
  `);
}

function handleMenuSubmit(e, menuId) {
  e.preventDefault();
  const fd = new FormData(e.target);

  if (menuId) {
    const item = STATE.menu.find(x => x.id === menuId);
    if (item) {
      item.name = fd.get('name');
      item.nameHi = fd.get('nameHi');
      item.category = fd.get('category');
      item.station = fd.get('station');
      item.prepTime = Number(fd.get('prepTime')) || 15;
      item.dineIn = Number(fd.get('dineIn')) || item.dineIn;
      item.online = Number(fd.get('online')) || item.online;
      item.takeaway = Number(fd.get('takeaway')) || item.takeaway;
      item.autoSyncOutOfStock = fd.get('autoSync') !== null;
    }
    showToast(`Updated menu item: ${item.name}`, 'success');
  } else {
    const newItem = {
      id: `M00${STATE.menu.length + 1}`,
      name: fd.get('name'),
      nameHi: fd.get('nameHi'),
      category: fd.get('category'),
      station: fd.get('station'),
      prepTime: Number(fd.get('prepTime')) || 15,
      dineIn: Number(fd.get('dineIn')) || 250,
      online: Number(fd.get('online')) || 280,
      takeaway: Number(fd.get('takeaway')) || 240,
      cost: 75,
      sales30: 100,
      autoSyncOutOfStock: true,
      hsn: '2106',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300'
    };
    STATE.menu.push(newItem);
    showToast(`Created new menu item: ${newItem.name}`, 'success');
  }

  closeModal();
  renderActiveMenuView();
}

// ===================================================================
// 8.2 BCG MENU ENGINEERING SCATTER MATRIX (Stars, Plowhorses, Puzzles, Dogs)
// ===================================================================
function renderBCGScatterMatrix(el) {
  el.innerHTML = `
    <div class="space-y-6">
      <!-- 4 Quadrants Legend Card -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="glass-card rounded-xl p-3 border-yellow-500/30">
          <div class="flex items-center gap-1.5 font-bold text-yellow-400 text-xs"><span>⭐ Stars</span></div>
          <div class="text-[11px] text-gray-300 mt-1 font-semibold">High Margin · High Sales</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Keep prominent, never change recipe!</div>
        </div>

        <div class="glass-card rounded-xl p-3 border-blue-500/30">
          <div class="flex items-center gap-1.5 font-bold text-blue-400 text-xs"><span>🐴 Plowhorses</span></div>
          <div class="text-[11px] text-gray-300 mt-1 font-semibold">Low Margin · High Sales</div>
          <div class="text-[10px] text-gray-500 mt-0.5">High volume, but high food cost! Adjust price.</div>
        </div>

        <div class="glass-card rounded-xl p-3 border-purple-500/30">
          <div class="flex items-center gap-1.5 font-bold text-purple-400 text-xs"><span>🧩 Puzzles</span></div>
          <div class="text-[11px] text-gray-300 mt-1 font-semibold">High Margin · Low Sales</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Profitable gems. Need photos or waiter push.</div>
        </div>

        <div class="glass-card rounded-xl p-3 border-red-500/30">
          <div class="flex items-center gap-1.5 font-bold text-red-400 text-xs"><span>🐕 Dogs</span></div>
          <div class="text-[11px] text-gray-300 mt-1 font-semibold">Low Margin · Low Sales</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Bleeding money and occupying prep space. Remove.</div>
        </div>
      </div>

      <!-- Scatter Chart Canvas -->
      <div class="glass-card rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">BCG Profitability vs Volume Scatter Analysis</h3>
          <span class="text-xs text-gray-400">Click any dot to inspect strategic recommendations.</span>
        </div>
        <div class="h-64">
          <canvas id="bcgScatterChart"></canvas>
        </div>
      </div>

      <!-- Item Classification Breakdown Table -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <table class="w-full text-xs text-left">
          <thead class="bg-white/5 border-b border-white/10 text-[11px] text-gray-400 uppercase">
            <tr>
              <th class="p-3">Menu Item</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Dine-In</th>
              <th class="p-3 text-right">Food Cost %</th>
              <th class="p-3 text-right">30d Orders</th>
              <th class="p-3 text-center">Quadrant</th>
              <th class="p-3">Action Strategy</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${STATE.menu.map(m => {
              const bcg = calcMenuBCG(m);
              return `
                <tr onclick="openBCGItemSlideOver('${m.id}')" class="table-row cursor-pointer">
                  <td class="p-3 font-bold text-white">${m.name}</td>
                  <td class="p-3 text-gray-400">${m.category}</td>
                  <td class="p-3 text-right font-semibold">${formatINR(m.dineIn)}</td>
                  <td class="p-3 text-right font-extrabold ${bcg.foodCostPct > 35 ? 'text-red-400' : 'text-green-400'}">${bcg.foodCostPct}%</td>
                  <td class="p-3 text-right font-mono font-bold">${m.sales30}</td>
                  <td class="p-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bcg.badgeColor}">
                      ${bcg.quadrant}
                    </span>
                  </td>
                  <td class="p-3 text-gray-300 text-[11px]">${bcg.advice}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Scatter Chart
  setTimeout(() => {
    const ctx = document.getElementById('bcgScatterChart');
    if (!ctx) return;

    const scatterData = STATE.menu.map(m => {
      const bcg = calcMenuBCG(m);
      return {
        x: m.sales30, // Volume
        y: bcg.marginPct, // Margin %
        name: m.name,
        quadrant: bcg.quadrant
      };
    });

    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Menu Items',
          data: scatterData,
          backgroundColor: '#f59e0b',
          pointRadius: 7,
          pointHoverRadius: 10
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `${item.raw.name} (${item.raw.quadrant}): ${item.raw.x} Sales, ${item.raw.y}% Margin`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Sales Volume (Last 30 Days)', color: '#888', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
          y: { title: { display: true, text: 'Profit Margin %', color: '#888', font: { size: 10 } }, min: 40, max: 85, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }
        }
      }
    });
  }, 50);
}

function openBCGItemSlideOver(menuId) {
  const m = STATE.menu.find(x => x.id === menuId);
  if (!m) return;
  const bcg = calcMenuBCG(m);

  const content = `
    <div class="space-y-5 text-xs">
      <div class="glass-card rounded-2xl p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase text-gray-400 font-semibold">${m.category}</span>
          <span class="px-2.5 py-1 rounded-full font-bold text-xs border ${bcg.badgeColor}">${bcg.quadrant}</span>
        </div>
        <h3 class="text-lg font-bold text-white mt-1">${m.name}</h3>
        <p class="text-xs text-gray-400">${m.nameHi} · HSN ${m.hsn}</p>
      </div>

      <div class="glass-card rounded-2xl p-4 space-y-3">
        <div class="font-bold text-white uppercase text-saffron-400">Financial Diagnostic</div>
        <div class="flex justify-between"><span class="text-gray-400">Dine-In Price</span><span class="font-bold text-white text-sm">${formatINR(m.dineIn)}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Recipe Raw Food Cost</span><span class="font-bold text-white">${formatINR(m.cost)}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Gross Margin Per Plate</span><span class="font-bold text-green-400 text-sm">${formatINR(bcg.margin)} (${bcg.marginPct}%)</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Food Cost Percentage</span><span class="font-bold ${bcg.foodCostPct > 35 ? 'text-red-400 font-extrabold' : 'text-green-400'}">${bcg.foodCostPct}%</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Monthly Volume Sold</span><span class="font-mono font-bold text-white">${m.sales30} portions</span></div>
      </div>

      <div class="p-4 rounded-2xl bg-dark-700/60 border border-white/5 space-y-2">
        <div class="font-bold text-white uppercase text-xs">Menu Engineer's Recommendation</div>
        <p class="text-xs text-gray-300 leading-relaxed">${bcg.advice}</p>
      </div>

      <div class="pt-2">
        <button onclick="openMenuEditModal('${m.id}')" class="btn-primary w-full py-2.5 rounded-lg text-xs font-bold">
          Adjust Price / Recipe in Editor →
        </button>
      </div>
    </div>
  `;

  openSlideOver(`BCG Matrix Analysis — ${m.name}`, content);
}
