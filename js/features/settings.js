/**
 * ===================================================================
 * QR-Cafe — SECTION 11: BUSINESS SETTINGS [OWNER ONLY]
 * 11.1 Business Rules (GST Rates, Manager Discount & Void Limits)
 * 11.2 Integrations (Zomato/Swiggy API Keys, WhatsApp WATI Tokens)
 * 11.3 Hardware (LAN Thermal Printer ESC/POS IP, Auto Cash Drawer)
 * Strict Owner Only guard: Triggers Owner Override Protocol if accessed by Manager.
 * ===================================================================
 */

function renderSettings(el) {
  if (!isOwner()) {
    el.innerHTML = `
      <div class="p-8 text-center max-w-md mx-auto fade-in">
        <div class="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 mx-auto flex items-center justify-center mb-4">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Owner Authorization Required</h3>
        <p class="text-xs text-gray-400 mb-6 leading-relaxed">
          Business Settings (GSTIN, Statutory Tax Rates, Hardware IPs, and Aggregator API keys) are strictly restricted to the Super Admin (Owner).
        </p>
        <button onclick="requestOwnerOverride('Business Settings Console', () => navigate('settings'))"
                class="btn-primary w-full py-2.5 rounded-lg text-xs font-bold shadow-lg">
          Authorize with 4-Digit Owner PIN →
        </button>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="p-6 fade-in space-y-6">
      ${pageHeader('Business Settings & System Configuration', 'Super Admin controls: Statutory GST rates, supervisor authority limits, API integrations, and hardware.',
        `<button onclick="saveAllSettings()" class="btn-primary px-5 py-2 rounded-lg text-xs font-bold shadow-md">
          Save Configuration
        </button>`)}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 11.1 Business Rules -->
        <div class="glass-card rounded-2xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-white/10">
            <span class="w-2.5 h-2.5 rounded-full bg-saffron-400"></span>
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">11.1 Business & Tax Rules</h3>
          </div>

          <div>
            <label class="block text-gray-400 text-xs mb-1">Outlet Legal Trade Name</label>
            <input type="text" id="setting-outlet" value="${STATE.settings.outletName}" class="w-full p-2.5 rounded-lg text-xs font-medium" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-400 text-xs mb-1">GSTIN Number</label>
              <input type="text" id="setting-gstin" value="${STATE.settings.gstin}" class="w-full p-2.5 rounded-lg text-xs font-mono uppercase" />
            </div>
            <div>
              <label class="block text-gray-400 text-xs mb-1">FSSAI License No</label>
              <input type="text" id="setting-fssai" value="${STATE.settings.fssai}" class="w-full p-2.5 rounded-lg text-xs font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <label class="block text-gray-400 text-xs mb-1">CGST Rate (%)</label>
              <input type="number" step="0.1" id="setting-cgst" value="${STATE.settings.cgstRate}" class="w-full p-2.5 rounded-lg text-xs font-bold" />
            </div>
            <div>
              <label class="block text-gray-400 text-xs mb-1">SGST Rate (%)</label>
              <input type="number" step="0.1" id="setting-sgst" value="${STATE.settings.sgstRate}" class="w-full p-2.5 rounded-lg text-xs font-bold" />
            </div>
          </div>

          <div class="pt-2 border-t border-white/5">
            <div class="font-bold text-white text-xs mb-2 text-saffron-400">Supervisor Authority Ceilings</div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-gray-400 text-[11px] mb-1">Manager Max Discount %</label>
                <input type="number" id="setting-disc-limit" value="${STATE.settings.managerDiscountLimit}" class="w-full p-2 rounded-lg text-xs" />
              </div>
              <div>
                <label class="block text-gray-400 text-[11px] mb-1">Manager Max Void (₹)</label>
                <input type="number" id="setting-void-limit" value="${STATE.settings.managerVoidLimit}" class="w-full p-2 rounded-lg text-xs" />
              </div>
            </div>
          </div>
        </div>

        <!-- 11.2 Aggregators & WhatsApp API -->
        <div class="glass-card rounded-2xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-white/10">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">11.2 Aggregators & WhatsApp</h3>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-gray-400 text-xs">Zomato Restaurant API Token</label>
              <span class="text-[10px] text-green-400 font-bold">Connected ●</span>
            </div>
            <input type="password" value="${STATE.settings.zomatoApiKey}" class="w-full p-2.5 rounded-lg text-xs font-mono" />
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-gray-400 text-xs">Swiggy Partner Live Key</label>
              <span class="text-[10px] text-green-400 font-bold">Connected ●</span>
            </div>
            <input type="password" value="${STATE.settings.swiggyApiKey}" class="w-full p-2.5 rounded-lg text-xs font-mono" />
          </div>

          <div class="pt-2 border-t border-white/5">
            <div class="flex justify-between items-center mb-1">
              <label class="text-gray-400 text-xs">WhatsApp Business API (WATI / Gupshup)</label>
              <span class="text-[10px] text-saffron-400 font-bold">Active</span>
            </div>
            <input type="password" value="${STATE.settings.watiToken}" class="w-full p-2.5 rounded-lg text-xs font-mono" />
            <p class="text-[10px] text-gray-500 mt-1">Used for auto-dispatching customer bills, payslips, and daily Z-reports.</p>
          </div>
        </div>

        <!-- 11.3 Hardware & Offline Engine -->
        <div class="glass-card rounded-2xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-white/10">
            <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">11.3 Hardware & LAN ESC/POS</h3>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2">
              <label class="block text-gray-400 text-xs mb-1">Thermal Printer IP</label>
              <input type="text" id="setting-printer-ip" value="${STATE.settings.printerIp}" class="w-full p-2.5 rounded-lg text-xs font-mono" />
            </div>
            <div>
              <label class="block text-gray-400 text-xs mb-1">Port</label>
              <input type="number" value="${STATE.settings.printerPort}" class="w-full p-2.5 rounded-lg text-xs font-mono" />
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <div>
              <div class="text-xs font-bold text-white">Paper Width Specification</div>
              <div class="text-[10px] text-gray-400">Standard restaurant receipt size</div>
            </div>
            <select class="text-xs p-1.5 rounded-lg bg-dark-700">
              <option value="80mm" selected>80mm (Standard)</option>
              <option value="58mm">58mm (Compact)</option>
            </select>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-white/5">
            <div>
              <div class="text-xs font-bold text-white">Auto-Kick Cash Drawer</div>
              <div class="text-[10px] text-gray-400">Triggers 24V RJ11 pulse on cash settlement</div>
            </div>
            <input type="checkbox" checked class="rounded" />
          </div>

          <div class="pt-3">
            <button onclick="testPrinterKOT()" class="btn-ghost w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
              <span>Test Print ESC/POS KOT Slip 🖨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function saveAllSettings() {
  STATE.settings.outletName = document.getElementById('setting-outlet')?.value || STATE.settings.outletName;
  STATE.settings.gstin = document.getElementById('setting-gstin')?.value || STATE.settings.gstin;
  STATE.settings.fssai = document.getElementById('setting-fssai')?.value || STATE.settings.fssai;
  STATE.settings.cgstRate = Number(document.getElementById('setting-cgst')?.value) || 2.5;
  STATE.settings.sgstRate = Number(document.getElementById('setting-sgst')?.value) || 2.5;
  STATE.settings.managerDiscountLimit = Number(document.getElementById('setting-disc-limit')?.value) || 15;
  STATE.settings.managerVoidLimit = Number(document.getElementById('setting-void-limit')?.value) || 500;
  STATE.settings.printerIp = document.getElementById('setting-printer-ip')?.value || STATE.settings.printerIp;

  showToast('Configuration and business rules saved successfully', 'success');
}

function testPrinterKOT() {
  showToast(`Test KOT slip dispatched to LAN Thermal Printer @ ${STATE.settings.printerIp}`, 'success');
}
