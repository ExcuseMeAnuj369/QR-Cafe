/**
 * ===================================================================
 * QR DINE — SECTION 5: STAFF & PAYROLL PANEL (DEEP DIVE) [BOTH]
 * 5.1 Staff List View (Search, Filters, Role, Status)
 * 5.2 Add Staff Modal (Full Indian KYC, PF/ESI, Locked Salary Rate)
 * 5.3 Staff Profile Slide-Over (4 Tabs: KYC, 30-day Calendar, Payroll, Requests)
 * 5.4 Indian Statutory Payroll Engine (Strict PF on Basic, ESI <= 21k, OT 2×)
 * ===================================================================
 */

let activeStaffSubTab = 'roster'; // 'roster' or 'payroll'

function renderStaff(el) {
  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Staff & Indian Statutory Payroll', 'Manage employee lifecycle, KYC compliance, and statutory payroll',
        `<button onclick="openAddStaffModal()" class="btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
          <span>+ Add Staff Member</span>
        </button>`)}

      <!-- Sub-Tab Switcher: Roster Directory vs Payroll Engine -->
      <div class="flex items-center gap-2 border-b border-white/10 pb-3">
        <button onclick="switchStaffSubTab('roster')" id="staff-tab-roster"
                class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeStaffSubTab === 'roster' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          👥 Staff Directory & KYC (${STATE.staff.length})
        </button>
        <button onclick="switchStaffSubTab('payroll')" id="staff-tab-payroll"
                class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeStaffSubTab === 'payroll' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
          💰 Indian Payroll Engine (May 2024)
          ${STATE.payrollLocked ? '<span class="px-1.5 py-0.5 rounded text-[9px] bg-red-500 text-white font-extrabold">LOCKED</span>' : ''}
        </button>
      </div>

      <!-- Main Container for Roster or Payroll -->
      <div id="staff-subtab-container"></div>
    </div>
  `;

  renderStaffSubTab();
}

function switchStaffSubTab(tab) {
  activeStaffSubTab = tab;
  renderStaffSubTab();

  const rBtn = document.getElementById('staff-tab-roster');
  const pBtn = document.getElementById('staff-tab-payroll');
  if (rBtn && pBtn) {
    if (tab === 'roster') {
      rBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-saffron-500 text-black shadow-md';
      pBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-400 hover:text-white bg-dark-700/50';
    } else {
      pBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-saffron-500 text-black shadow-md';
      rBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-400 hover:text-white bg-dark-700/50';
    }
  }
}

function renderStaffSubTab() {
  const container = document.getElementById('staff-subtab-container');
  if (!container) return;

  if (activeStaffSubTab === 'roster') {
    renderStaffDirectory(container);
  } else {
    renderPayrollEngine(container);
  }
}

// ===================================================================
// 5.1 STAFF DIRECTORY VIEW
// ===================================================================
function renderStaffDirectory(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <input type="text" id="staff-search-input" oninput="filterStaffTable()" placeholder="Search staff by full name, phone number, or employee ID..."
                 class="w-full text-xs rounded-xl pl-9 pr-4 py-2.5 bg-dark-800" />
          <svg class="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <select id="staff-filter-role" onchange="filterStaffTable()" class="text-xs rounded-xl px-3 py-2.5 bg-dark-800 text-gray-300 w-full sm:w-40">
          <option value="All">All Roles</option>
          <option value="Kitchen">Kitchen</option>
          <option value="Waiter">Waiter</option>
          <option value="Cashier">Cashier</option>
          <option value="Cleaner">Cleaner</option>
        </select>
        <select id="staff-filter-status" onchange="filterStaffTable()" class="text-xs rounded-xl px-3 py-2.5 bg-dark-800 text-gray-300 w-full sm:w-40">
          <option value="All">All Statuses</option>
          <option value="Clocked In">Clocked In</option>
          <option value="On Break">On Break</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      <!-- Staff Table -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="staff-main-table">
            <thead class="text-[11px] text-gray-400 border-b border-white/5 bg-white/5 uppercase">
              <tr>
                <th class="py-3 px-4">Employee</th>
                <th class="py-3 px-3">Role</th>
                <th class="py-3 px-3 text-center">Rating</th>
                <th class="py-3 px-3">Phone</th>
                <th class="py-3 px-3 text-center">Today's Status</th>
                <th class="py-3 px-3 text-right">Est. Monthly Salary</th>
                <th class="py-3 px-3 text-right">Base Hourly</th>
                <th class="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5" id="staff-table-body">
              ${STATE.staff.map(s => {
                const payroll = calcIndianPayroll(s);
                const statusColor =
                  s.status === 'Clocked In' ? 'bg-green-500/20 text-green-400' :
                  s.status === 'On Break' ? 'bg-amber-500/20 text-amber-400' :
                  s.status === 'On Leave' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400';
                const aadhaarLast4 = s.aadhaar ? String(s.aadhaar).replace(/\s/g, '').slice(-4) : '—';
                const initials = (s.name || 'Staff').trim().split(/\s+/).map(n => n[0] || '').join('').slice(0, 2);

                return `
                  <tr class="table-row">
                    <td class="py-3 px-4">
                      <div onclick="openStaffProfileSlideOver('${s.id}')" class="flex items-center gap-3 cursor-pointer group">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-500/30 to-amber-600/30 text-saffron-400 font-bold flex items-center justify-center text-xs group-hover:scale-110 transition">
                          ${initials}
                        </div>
                        <div>
                          <div class="font-bold text-white group-hover:text-saffron-400 transition">${s.name || 'Staff Member'}</div>
                          <div class="text-[10px] text-gray-400 font-mono">${s.id} · Aadhaar: ${aadhaarLast4}</div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-3 text-gray-300 font-medium">${s.role || 'Staff'}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        ★ ${s.rating ? Number(s.rating).toFixed(1) : '4.8'}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-gray-400 font-mono">${s.phone || '—'}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}">${s.status || 'Clocked In'}</span>
                    </td>
                    <td class="py-3 px-3 text-right font-extrabold text-white">${formatINR(payroll.netPayable)}</td>
                    <td class="py-3 px-3 text-right text-gray-400 font-medium">${formatINR(s.rate || 180)}/hr</td>
                    <td class="py-3 px-4 text-center">
                      <button onclick="openStaffProfileSlideOver('${s.id}')" class="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white" title="View Full Profile">
                        ⋮
                      </button>
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

function filterStaffTable() {
  const query = document.getElementById('staff-search-input')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('staff-filter-role')?.value || 'All';
  const statusFilter = document.getElementById('staff-filter-status')?.value || 'All';

  const rows = document.querySelectorAll('#staff-table-body tr');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesRole = roleFilter === 'All' || text.includes(roleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || text.includes(statusFilter.toLowerCase());

    row.style.display = (matchesQuery && matchesRole && matchesStatus) ? '' : 'none';
  });
}

// ===================================================================
// 5.2 ➕ ADD STAFF MODAL (Exhaustive Fields & KYC)
// ===================================================================
function openAddStaffModal() {
  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-bold text-white">Enroll New Staff Member</h3>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form id="add-staff-form" class="space-y-4 text-xs" onsubmit="handleAddStaffSubmit(event)">
      <!-- 1. Personal Information -->
      <div>
        <h4 class="text-xs font-bold text-saffron-400 uppercase tracking-wider mb-2">1. Personal Information</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Full Legal Name *</label>
            <input type="text" name="name" required placeholder="e.g. Ramesh Chandra" class="w-full p-2.5 rounded-lg" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Mobile Number (10 Digits) *</label>
            <input type="tel" name="phone" required pattern="[0-9]{10}" placeholder="9876543210" class="w-full p-2.5 rounded-lg" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-gray-400 mb-1">Emergency Contact (Relation & Phone)</label>
            <input type="text" name="emergency" placeholder="e.g. Meena Chandra (Spouse) - 9876543299" class="w-full p-2.5 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- 2. KYC (India) -->
      <div class="pt-2 border-t border-white/5">
        <h4 class="text-xs font-bold text-saffron-400 uppercase tracking-wider mb-2">2. Indian KYC Documents</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Aadhaar Card Number (12 Digits) *</label>
            <input type="text" name="aadhaar" required placeholder="1234 5678 9012" class="w-full p-2.5 rounded-lg" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">PAN Card Number (10 Alphanumeric) *</label>
            <input type="text" name="pan" required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" placeholder="ABCDE1234F" class="w-full p-2.5 rounded-lg uppercase" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-gray-400 mb-1">Current Residential Address *</label>
            <textarea name="address" required rows="2" placeholder="Full permanent/current address..." class="w-full p-2.5 rounded-lg"></textarea>
          </div>
        </div>
      </div>

      <!-- 3. Banking Details -->
      <div class="pt-2 border-t border-white/5">
        <h4 class="text-xs font-bold text-saffron-400 uppercase tracking-wider mb-2">3. Bank Account for Direct Salary Deposit</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Bank Name *</label>
            <input type="text" name="bankName" required placeholder="e.g. State Bank of India" class="w-full p-2.5 rounded-lg" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Account Number *</label>
            <input type="password" name="accountNumber" required placeholder="Account No" class="w-full p-2.5 rounded-lg" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">IFSC Code *</label>
            <input type="text" name="ifsc" required placeholder="SBIN0001234" class="w-full p-2.5 rounded-lg uppercase" />
          </div>
        </div>
      </div>

      <!-- 4. Employment & Shift -->
      <div class="pt-2 border-t border-white/5">
        <h4 class="text-xs font-bold text-saffron-400 uppercase tracking-wider mb-2">4. Role & Shift Timing</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Role *</label>
            <select name="role" class="w-full p-2.5 rounded-lg">
              <option value="Waiter">Waiter</option>
              <option value="Kitchen">Kitchen Chef / Cook</option>
              <option value="Cashier">Cashier</option>
              <option value="Manager">Assistant Manager</option>
              <option value="Cleaner">Housekeeping / Cleaner</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Shift Type</label>
            <select name="shift" class="w-full p-2.5 rounded-lg">
              <option value="Morning">Morning (10 AM - 6 PM)</option>
              <option value="Evening">Evening (2 PM - 11 PM)</option>
              <option value="All">Full Day (11 AM - 10 PM)</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Date of Joining</label>
            <input type="date" name="joiningDate" value="2024-05-18" class="w-full p-2.5 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- 5. Salary Configuration [OWNER ONLY] -->
      <div class="pt-2 border-t border-white/5">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-bold text-saffron-400 uppercase tracking-wider">5. Salary & Statutory Benefits</h4>
          ${!isOwner() ? `<span class="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">${icon('lock')} Owner Protected Field</span>` : ''}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="${!isOwner() ? 'locked-field' : ''}" onclick="${!isOwner() ? "requestOwnerOverride('Base Salary Rate', () => openAddStaffModal())" : ''}">
            <label class="block text-gray-400 mb-1">Base Hourly Rate (₹) *</label>
            <input type="number" id="new-staff-rate" name="rate" value="180" ${!isOwner() ? 'readonly' : ''} class="w-full p-2.5 rounded-lg" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Overtime Rate (2× Indian Law)</label>
            <input type="number" name="otRate" value="360" readonly class="w-full p-2.5 rounded-lg bg-dark-700/60 text-gray-400" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">System Login PIN (4 Digits) *</label>
            <input type="password" name="pin" maxlength="4" required value="1234" class="w-full p-2.5 rounded-lg" />
          </div>
        </div>

        <div class="flex items-center gap-6 mt-3 bg-dark-700/50 p-2.5 rounded-xl">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="pfApplicable" checked class="rounded" />
            <span class="text-gray-300">Provident Fund (PF - 12%)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="esiApplicable" checked class="rounded" />
            <span class="text-gray-300">ESI Medical Benefit (<= ₹21,000)</span>
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" onclick="closeModal()" class="btn-ghost px-4 py-2 rounded-lg text-xs font-semibold">
          Cancel
        </button>
        <button type="submit" class="btn-primary px-6 py-2 rounded-lg text-xs font-bold">
          Save Staff Member
        </button>
      </div>
    </form>
  `);
}

async function handleAddStaffSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const selectedRole = fd.get('role');
  const roleLower = selectedRole.toLowerCase();

  let prefix = '20';
  if (roleLower.includes('kitchen') || roleLower.includes('cook') || roleLower.includes('chef')) {
    prefix = '10';
  } else if (roleLower.includes('cashier') || roleLower.includes('accountant')) {
    prefix = '30';
  }

  const assignedId = `${prefix}${String(STATE.staff.length + 1).padStart(2, '0')}`;
  const pinValue = fd.get('pin') || assignedId;

  const newStaff = {
    id: assignedId,
    name: fd.get('name'),
    role: selectedRole,
    phone: fd.get('phone'),
    emergencyContact: fd.get('emergency'),
    aadhaar: fd.get('aadhaar'),
    pan: fd.get('pan'),
    address: fd.get('address'),
    bankName: fd.get('bankName'),
    accountNumber: fd.get('accountNumber'),
    ifsc: fd.get('ifsc'),
    shift: fd.get('shift'),
    shiftStart: '10:00 AM',
    shiftEnd: '06:00 PM',
    joiningDate: fd.get('joiningDate'),
    status: 'Clocked In',
    checkIn: '10:00 AM',
    rate: Number(fd.get('rate')) || 180,
    otRate: (Number(fd.get('rate')) || 180) * 2,
    pfApplicable: fd.get('pfApplicable') !== null,
    esiApplicable: fd.get('esiApplicable') !== null,
    pin: pinValue,
    hoursWorked: 200,
    otHours: 0,
    unapprovedAbsences: 0,
    basicMonthly: 12000,
    daMonthly: 2000,
    hraMonthly: 3000
  };

  STATE.staff.push(newStaff);
  closeModal();
  renderStaffSubTab();
  showToast(`Enrolled: ${newStaff.name} · Staff ID: ${newStaff.id} · PIN: ${newStaff.pin}`, 'success');

  if (typeof API !== 'undefined' && API.addStaff) {
    const res = await API.addStaff(newStaff);
    if (res && res.staff) {
      console.log('Staff synced to backend:', res.staff);
    }
  }
}

// ===================================================================
// 5.3 👥 STAFF PROFILE FLOATING MODAL & INLINE EDIT SUITE
// ===================================================================
let activeProfileTab = 'overview';
let isStaffProfileEditing = false;

function openStaffProfileModal(staffId) {
  isStaffProfileEditing = false;
  activeProfileTab = 'overview';
  renderStaffProfileModalUI(staffId);
}

// Keep slide-over alias so any existing caller automatically gets the centered floating modal
const openStaffProfileSlideOver = openStaffProfileModal;

function renderStaffProfileModalUI(staffId) {
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  const initials = (s.name || 'Staff').trim().split(/\s+/).map(n => n[0] || '').join('').slice(0, 2);
  const statusColor =
    s.status === 'Clocked In' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
    s.status === 'On Break' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
    'bg-red-500/20 text-red-400 border border-red-500/30';

  const html = `
    <!-- Modal Header -->
    <div class="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron-500/30 to-amber-600/30 text-saffron-400 font-extrabold flex items-center justify-center text-sm border border-saffron-500/20 shadow-md">
          ${initials}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-extrabold text-white">${s.name}</h3>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}">
              ${s.status || 'Clocked In'}
            </span>
          </div>
          <div class="text-xs text-gray-400 mt-0.5 font-mono">
            ${s.role || 'Staff'} · ID: <span class="text-saffron-400 font-bold">${s.id}</span> · PIN: ${s.pin || s.id}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[11px] text-gray-400">Rating:</span>
            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              ★ ${s.rating ? Number(s.rating).toFixed(1) : '4.8'} / 5.0
            </span>
            <button onclick="promptStaffRating('${s.id}')" class="text-[11px] text-saffron-400 hover:underline font-semibold ml-1">
              Rate Staff ✎
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="toggleStaffProfileEdit('${s.id}')"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${isStaffProfileEditing ? 'bg-saffron-500 text-black shadow-md' : 'bg-dark-700/80 text-gray-300 hover:text-white border border-white/10'}">
          <span>${isStaffProfileEditing ? '✕ Cancel Edit' : '✏️ Edit Information'}</span>
        </button>
        <button onclick="closeModal()" class="w-8 h-8 rounded-xl bg-dark-700/60 hover:bg-dark-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition">
          ✕
        </button>
      </div>
    </div>

    <!-- 4 Sub-Tabs Bar -->
    <div class="flex items-center gap-1.5 border-b border-white/10 pb-3 mb-4 text-xs">
      <button onclick="switchStaffModalTab('${s.id}', 'overview')" id="prof-tab-overview"
              class="px-3.5 py-1.5 rounded-lg font-bold transition ${activeProfileTab === 'overview' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
        👤 Overview & KYC
      </button>
      <button onclick="switchStaffModalTab('${s.id}', 'attendance')" id="prof-tab-attendance"
              class="px-3.5 py-1.5 rounded-lg font-bold transition ${activeProfileTab === 'attendance' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
        📅 Attendance (30d)
      </button>
      <button onclick="switchStaffModalTab('${s.id}', 'payroll')" id="prof-tab-payroll"
              class="px-3.5 py-1.5 rounded-lg font-bold transition ${activeProfileTab === 'payroll' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
        💰 Payslips
      </button>
      <button onclick="switchStaffModalTab('${s.id}', 'requests')" id="prof-tab-requests"
              class="px-3.5 py-1.5 rounded-lg font-bold transition ${activeProfileTab === 'requests' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
        📝 Requests
      </button>
    </div>

    <!-- Profile Tab Dynamic Container -->
    <div id="staff-modal-tab-content"></div>
  `;

  openModal(html, 'max-w-2xl');
  renderStaffModalTabContent(s, activeProfileTab);
}

function toggleStaffProfileEdit(staffId) {
  isStaffProfileEditing = !isStaffProfileEditing;
  activeProfileTab = 'overview';
  renderStaffProfileModalUI(staffId);
}

function switchStaffModalTab(staffId, tab) {
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  activeProfileTab = tab;
  ['overview', 'attendance', 'payroll', 'requests'].forEach(t => {
    const btn = document.getElementById(`prof-tab-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3.5 py-1.5 rounded-lg font-bold transition bg-saffron-500 text-black shadow-md';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-lg font-bold transition text-gray-400 hover:text-white bg-dark-700/50';
      }
    }
  });

  renderStaffModalTabContent(s, tab);
}

function renderStaffModalTabContent(s, tab) {
  const container = document.getElementById('staff-modal-tab-content');
  if (!container) return;

  if (tab === 'overview') {
    if (isStaffProfileEditing) {
      // EDIT MODE FORM
      container.innerHTML = `
        <form id="edit-staff-profile-form" onsubmit="handleSaveStaffProfile(event, '${s.id}')" class="space-y-4 text-xs">
          
          <!-- Personal & Contact -->
          <div class="glass-card rounded-xl p-3.5 space-y-3">
            <div class="font-bold text-saffron-400 uppercase tracking-wider text-[11px]">1. Identity & Contact Information</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-gray-400 mb-1">Full Name *</label>
                <input type="text" name="name" required value="${s.name || ''}" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-semibold" />
              </div>
              <div>
                <label class="block text-gray-400 mb-1">Mobile Phone (10 Digits) *</label>
                <input type="tel" name="phone" required pattern="[0-9]{10}" value="${s.phone || ''}" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-gray-400 mb-1">Emergency Contact</label>
                <input type="text" name="emergencyContact" value="${s.emergencyContact || ''}" placeholder="e.g. Ramesh (Father) - 9876543299" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-gray-400 mb-1">Residential Address</label>
                <textarea name="address" rows="2" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white">${s.address || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- Role & Schedule -->
          <div class="glass-card rounded-xl p-3.5 space-y-3">
            <div class="font-bold text-saffron-400 uppercase tracking-wider text-[11px]">2. Role, Shift & Status</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-gray-400 mb-1">Assigned Role *</label>
                <select name="role" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-semibold">
                  <option value="Waiter" ${s.role === 'Waiter' ? 'selected' : ''}>Waiter</option>
                  <option value="Kitchen" ${s.role === 'Kitchen' ? 'selected' : ''}>Kitchen Chef</option>
                  <option value="Cashier" ${s.role === 'Cashier' ? 'selected' : ''}>Cashier / Accountant</option>
                  <option value="Manager" ${s.role === 'Manager' ? 'selected' : ''}>Assistant Manager</option>
                  <option value="Cleaner" ${s.role === 'Cleaner' ? 'selected' : ''}>Cleaner / Housekeeping</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-400 mb-1">Shift Type</label>
                <select name="shift" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white">
                  <option value="Morning" ${s.shift === 'Morning' ? 'selected' : ''}>Morning (10 AM - 6 PM)</option>
                  <option value="Evening" ${s.shift === 'Evening' ? 'selected' : ''}>Evening (2 PM - 11 PM)</option>
                  <option value="All" ${s.shift === 'All' ? 'selected' : ''}>Full Day (11 AM - 10 PM)</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-400 mb-1">Current Status</label>
                <select name="status" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-bold">
                  <option value="Clocked In" ${s.status === 'Clocked In' ? 'selected' : ''}>Clocked In</option>
                  <option value="On Break" ${s.status === 'On Break' ? 'selected' : ''}>On Break</option>
                  <option value="Absent" ${s.status === 'Absent' ? 'selected' : ''}>Absent</option>
                </select>
              </div>
            </div>
          </div>

          <!-- KYC & Banking -->
          <div class="glass-card rounded-xl p-3.5 space-y-3">
            <div class="font-bold text-saffron-400 uppercase tracking-wider text-[11px]">3. KYC & Bank Account</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-gray-400 mb-1">Aadhaar UID (12 Digits)</label>
                <input type="text" name="aadhaar" value="${s.aadhaar || ''}" placeholder="1234 5678 9012" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono" />
              </div>
              <div>
                <label class="block text-gray-400 mb-1">PAN Card Number</label>
                <input type="text" name="pan" value="${s.pan || ''}" placeholder="ABCDE1234F" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono uppercase" />
              </div>
              <div>
                <label class="block text-gray-400 mb-1">Bank Name</label>
                <input type="text" name="bankName" value="${s.bankName || ''}" placeholder="State Bank of India" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white" />
              </div>
              <div>
                <label class="block text-gray-400 mb-1">Account Number</label>
                <input type="text" name="accountNumber" value="${s.accountNumber || ''}" placeholder="Bank Account Number" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-gray-400 mb-1">IFSC Code</label>
                <input type="text" name="ifsc" value="${s.ifsc || ''}" placeholder="SBIN0001234" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono uppercase" />
              </div>
            </div>
          </div>

          <!-- Salary Rate & PIN (Owner Protected if Manager) -->
          <div class="glass-card rounded-xl p-3.5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-saffron-400 uppercase tracking-wider text-[11px]">4. Salary & Security PIN</span>
              ${!isOwner() ? '<span class="text-[10px] text-amber-400">Owner Verification Required</span>' : ''}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-gray-400 mb-1">Base Hourly Rate (₹)</label>
                <input type="number" id="edit-staff-rate" name="rate" value="${s.rate || 180}" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono font-bold" />
              </div>
              <div>
                <label class="block text-gray-400 mb-1">System Login PIN (4 Digits)</label>
                <input type="password" name="pin" maxlength="4" value="${s.pin || s.id}" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono font-bold" />
              </div>
            </div>

            <div class="flex items-center gap-6 pt-2 border-t border-white/5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="pfApplicable" ${s.pfApplicable !== false ? 'checked' : ''} class="rounded" />
                <span class="text-gray-300">Provident Fund (PF - 12%)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="esiApplicable" ${s.esiApplicable !== false ? 'checked' : ''} class="rounded" />
                <span class="text-gray-300">ESI Medical Benefit</span>
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button type="button" onclick="toggleStaffProfileEdit('${s.id}')" class="btn-ghost px-4 py-2 rounded-xl text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
              <span>💾 Save Staff Profile</span>
            </button>
          </div>
        </form>
      `;
    } else {
      // READ-ONLY OVERVIEW
      container.innerHTML = `
        <div class="space-y-3.5 text-xs">
          <!-- Identity Card -->
          <div class="glass-card rounded-xl p-4 space-y-2.5">
            <div class="font-bold text-white text-xs uppercase tracking-wider text-saffron-400 flex items-center justify-between">
              <span>KYC & Identity</span>
              <span class="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Verified</span>
            </div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Mobile Phone</span><span class="font-mono text-white font-semibold">${s.phone || '—'}</span></div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Aadhaar UID</span><span class="font-mono text-white">${s.aadhaar || '—'}</span></div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">PAN Card</span><span class="font-mono text-white uppercase">${s.pan || '—'}</span></div>
            <div class="flex justify-between py-1"><span class="text-gray-400">Residential Address</span><span class="text-right max-w-[280px] text-gray-200">${s.address || '—'}</span></div>
          </div>

          <!-- Direct Deposit Banking -->
          <div class="glass-card rounded-xl p-4 space-y-2.5">
            <div class="font-bold text-white text-xs uppercase tracking-wider text-saffron-400">Direct Deposit Banking</div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Bank Name</span><span class="text-white font-semibold">${s.bankName || '—'}</span></div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Account No</span><span class="font-mono text-white">${s.accountNumber ? '•••• ' + String(s.accountNumber).slice(-4) : '—'}</span></div>
            <div class="flex justify-between py-1"><span class="text-gray-400">IFSC Code</span><span class="font-mono text-white uppercase">${s.ifsc || '—'}</span></div>
          </div>

          <!-- Emergency, Shift & Pay Rate -->
          <div class="glass-card rounded-xl p-4 space-y-2.5">
            <div class="font-bold text-white text-xs uppercase tracking-wider text-saffron-400">Employment, Shift & Compensation</div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Emergency Contact</span><span class="text-white">${s.emergencyContact || '—'}</span></div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Shift</span><span class="text-white">${s.shift || 'Morning'} (${s.shiftStart || '10:00 AM'} - ${s.shiftEnd || '06:00 PM'})</span></div>
            <div class="flex justify-between py-1 border-b border-white/5"><span class="text-gray-400">Joining Date</span><span class="text-white font-mono">${s.joiningDate || '—'}</span></div>
            <div class="flex justify-between py-1"><span class="text-gray-400">Base Hourly Rate</span><span class="font-bold text-saffron-400 font-mono">${formatINR(s.rate || 180)}/hr</span></div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex items-center gap-3 pt-2">
            <button onclick="toggleStaffProfileEdit('${s.id}')" class="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold">
              ✏️ Edit Profile Details
            </button>
            <button onclick="showToast('Login PIN: ${s.pin || s.id} sent to employee WhatsApp', 'success')" class="btn-ghost flex-1 py-2.5 rounded-xl text-xs font-semibold">
              Dispatch Login PIN
            </button>
          </div>
        </div>
      `;
    }
  } else if (tab === 'attendance') {
    const year = staffModalCalDate.getFullYear();
    const month = staffModalCalDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startWeekday = new Date(year, month, 1).getDay();
    const monthName = staffModalCalDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().slice(0, 10);
    const ymPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Filter attendance for this staff in this month
    const staffAtt = (STATE.attendance || []).filter(a => String(a.staff_id) === String(s.id) && String(a.date).startsWith(ymPrefix));
    const staffLeaves = (STATE.leaves || []).filter(l => l.status === 'Approved' && String(l.staff_id || l.staffId) === String(s.id));

    let countPresent = 0;
    let countLeaves = 0;
    let countAbsent = 0;

    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = staffAtt.find(a => a.date === dateStr);
      const dayOfWeek = new Date(year, month, d).getDay();

      const isOnApprovedLeave = staffLeaves.some(l => {
        const fromD = l.from || l.from_date;
        const toD = l.to || l.to_date || fromD;
        return dateStr >= fromD && dateStr <= toD;
      });

      let status = 'none';
      let checkInTime = rec?.check_in || '';

      if (rec?.status === 'leave' || isOnApprovedLeave) {
        status = 'leave';
        countLeaves++;
      } else if (rec?.status === 'present') {
        status = rec.is_late ? 'late' : 'present';
        countPresent++;
      } else if (rec?.status === 'absent') {
        status = 'absent';
        countAbsent++;
      } else if (dayOfWeek === 0) {
        status = 'off';
      } else if (dateStr <= todayStr) {
        status = 'absent';
        countAbsent++;
      } else {
        status = 'upcoming';
      }

      days.push({
        day: d,
        date: dateStr,
        status,
        checkIn: checkInTime,
        isToday: dateStr === todayStr
      });
    }

    const payrollThisMonth = calcIndianPayroll(s, ymPrefix);

    container.innerHTML = `
      <div class="space-y-4 text-xs">
        <!-- Month Navigation Bar -->
        <div class="flex items-center justify-between glass-card rounded-xl p-3">
          <div class="flex items-center gap-2">
            <button onclick="prevStaffModalCal('${s.id}')" class="px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white font-bold transition">
              ◀ Prev
            </button>
            <h4 class="text-sm font-extrabold text-saffron-400 font-mono tracking-wide px-2">
              📅 ${monthName}
            </h4>
            <button onclick="nextStaffModalCal('${s.id}')" class="px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white font-bold transition">
              Next ▶
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="todayStaffModalCal('${s.id}')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition">
              Current Month
            </button>
          </div>
        </div>

        <!-- Month Summary Pills -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Present Days</div>
            <div class="text-base font-extrabold text-green-400 mt-0.5">${countPresent}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Approved Leaves</div>
            <div class="text-base font-extrabold text-blue-400 mt-0.5">${countLeaves}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Absences</div>
            <div class="text-base font-extrabold text-red-400 mt-0.5">${countAbsent}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-saffron-500/10 border border-saffron-500/20 text-center">
            <div class="text-[10px] text-gray-400 uppercase font-semibold">Est. Month Pay</div>
            <div class="text-base font-extrabold text-saffron-400 mt-0.5">${formatINR(payrollThisMonth.netPayable)}</div>
          </div>
        </div>

        <!-- 7-day Week Header -->
        <div class="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase text-gray-400">
          <span class="text-red-400">Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <!-- Calendar Days Grid -->
        <div class="grid grid-cols-7 gap-1.5">
          ${Array.from({ length: startWeekday }).map(() => `
            <div class="aspect-square rounded-xl bg-white/[0.02] border border-transparent"></div>
          `).join('')}

          ${days.map(d => {
            const isTodayClass = d.isToday ? 'ring-2 ring-saffron-400 ring-offset-1 ring-offset-dark-900 shadow-lg' : '';
            const color =
              d.status === 'present' ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30' :
              d.status === 'late' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30' :
              d.status === 'leave' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30' :
              d.status === 'absent' ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30' :
              d.status === 'off' ? 'bg-gray-500/10 border-white/5 text-gray-500' :
              'bg-white/5 border-white/5 text-gray-400 hover:border-white/20';

            const statusLabel =
              d.status === 'present' ? (d.checkIn ? d.checkIn : 'Present') :
              d.status === 'late' ? 'Late' :
              d.status === 'leave' ? 'On Leave' :
              d.status === 'absent' ? 'Absent' :
              d.status === 'off' ? 'Off' : '—';

            return `
              <div onclick="openDateAttendanceQuickEdit('${s.id}', '${d.date}', '${d.status}')"
                   class="min-h-[58px] p-1.5 rounded-xl border ${color} ${isTodayClass} cursor-pointer transition flex flex-col justify-between"
                   title="Click to update status for ${d.date}">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-extrabold ${d.isToday ? 'text-saffron-400 underline' : 'text-white'}">${d.day}</span>
                  ${d.isToday ? '<span class="w-1.5 h-1.5 rounded-full bg-saffron-400 animate-pulse"></span>' : ''}
                </div>
                <div class="text-[9px] font-bold truncate leading-tight uppercase mt-1">
                  ${statusLabel}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-gray-400">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-green-500"></span> Present</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-blue-500"></span> On Leave</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-amber-500"></span> Late</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-red-500"></span> Absent</span>
          </div>
          <span class="text-xs text-saffron-400 italic">💡 Click any date to update status</span>
        </div>
      </div>
    `;
  } else if (tab === 'payroll') {
    const currentPayroll = calcIndianPayroll(s);
    container.innerHTML = `
      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="glass-card rounded-xl p-3">
            <span class="text-gray-400 block text-[10px] uppercase font-semibold">Basic + DA</span>
            <span class="text-base font-extrabold text-white mt-1 block">${formatINR(currentPayroll.basic + currentPayroll.da)}</span>
            <span class="text-[10px] text-gray-500">Basic: ${formatINR(currentPayroll.basic)}</span>
          </div>
          <div class="glass-card rounded-xl p-3">
            <span class="text-gray-400 block text-[10px] uppercase font-semibold">HRA Allowance</span>
            <span class="text-base font-extrabold text-white mt-1 block">${formatINR(currentPayroll.hra)}</span>
            <span class="text-[10px] text-green-400">Statutory Compliant</span>
          </div>
          <div class="glass-card rounded-xl p-3">
            <span class="text-gray-400 block text-[10px] uppercase font-semibold">Total Deductions</span>
            <span class="text-base font-extrabold text-red-400 mt-1 block">-${formatINR(currentPayroll.totalDeductions)}</span>
            <span class="text-[10px] text-gray-400">PF: ${formatINR(currentPayroll.pfEmployee)} · ESI: ${formatINR(currentPayroll.esiEmployee)}</span>
          </div>
          <div class="glass-card rounded-xl p-3 border-saffron-500/30 bg-saffron-500/10">
            <span class="text-saffron-400 block text-[10px] uppercase font-bold">Net Payable</span>
            <span class="text-lg font-black text-white mt-1 block">${formatINR(currentPayroll.netPayable)}</span>
            <span class="text-[10px] text-saffron-300">Based on Live Attendance</span>
          </div>
        </div>

        <div class="glass-card rounded-xl overflow-hidden">
          <div class="p-3 bg-white/5 border-b border-white/5 font-bold text-white flex justify-between items-center">
            <span>Attendance & Salary Breakdown</span>
            <span class="text-[11px] text-gray-400 font-mono">Present: ${currentPayroll.presentDays}d · Absent: ${currentPayroll.absentDays}d · OT: ${currentPayroll.otHours}h</span>
          </div>
          <table class="w-full text-left">
            <thead class="text-gray-400 bg-white/[0.02] border-b border-white/5 text-[11px] uppercase">
              <tr>
                <th class="p-2.5">Salary Component</th>
                <th class="p-2.5 text-right">Calculation Rule</th>
                <th class="p-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr><td class="p-2.5 font-semibold text-white">Basic Salary</td><td class="p-2.5 text-right text-gray-400 font-mono">Monthly Rate</td><td class="p-2.5 text-right font-bold text-white">${formatINR(currentPayroll.basic)}</td></tr>
              <tr><td class="p-2.5 font-semibold text-white">Dearness Allowance (DA)</td><td class="p-2.5 text-right text-gray-400 font-mono">15% of Basic</td><td class="p-2.5 text-right font-bold text-white">${formatINR(currentPayroll.da)}</td></tr>
              <tr><td class="p-2.5 font-semibold text-white">House Rent Allowance (HRA)</td><td class="p-2.5 text-right text-gray-400 font-mono">25% of Basic</td><td class="p-2.5 text-right font-bold text-white">${formatINR(currentPayroll.hra)}</td></tr>
              <tr><td class="p-2.5 font-semibold text-white">Overtime (OT) Pay</td><td class="p-2.5 text-right text-gray-400 font-mono">${currentPayroll.otHours} hrs @ 2.0x Indian Law</td><td class="p-2.5 text-right font-bold text-green-400">+${formatINR(currentPayroll.otPay)}</td></tr>
              <tr><td class="p-2.5 font-semibold text-white">Employee PF (12%)</td><td class="p-2.5 text-right text-gray-400 font-mono">Statutory EPFO</td><td class="p-2.5 text-right font-bold text-red-400">-${formatINR(currentPayroll.pfEmployee)}</td></tr>
              <tr><td class="p-2.5 font-semibold text-white">Employee ESIC (0.75%)</td><td class="p-2.5 text-right text-gray-400 font-mono">${currentPayroll.esiEmployee > 0 ? 'Gross <= ₹21,000' : 'Exempt (Gross > ₹21,000)'}</td><td class="p-2.5 text-right font-bold text-red-400">-${formatINR(currentPayroll.esiEmployee)}</td></tr>
              ${currentPayroll.absenceDeduction > 0 ? `
                <tr><td class="p-2.5 font-semibold text-white">Absence Deductions</td><td class="p-2.5 text-right text-gray-400 font-mono">${currentPayroll.absentDays} unapproved days</td><td class="p-2.5 text-right font-bold text-red-400">-${formatINR(currentPayroll.absenceDeduction)}</td></tr>
              ` : ''}
              <tr class="bg-saffron-500/10 font-bold text-saffron-400">
                <td class="p-2.5 text-white">Net Take-Home Pay</td>
                <td class="p-2.5 text-right font-mono">Gross (${formatINR(currentPayroll.gross)}) - Deductions (${formatINR(currentPayroll.totalDeductions)})</td>
                <td class="p-2.5 text-right font-extrabold text-base">${formatINR(currentPayroll.netPayable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    // REQUESTS TAB (Real filtered leaves)
    const staffLeaves = (STATE.leaves || []).filter(l => String(l.staff_id || l.staffId) === String(s.id));
    container.innerHTML = `
      <div class="space-y-3 text-xs">
        ${staffLeaves.length === 0 ? `
          <div class="p-8 text-center text-gray-500 glass-card rounded-2xl">
            <p class="text-2xl mb-1">📝</p>
            <p class="font-bold">No leave or advance requests recorded</p>
            <p class="text-[11px] text-gray-400 mt-1">Leave applications submitted by this employee from the Staff Panel will appear here.</p>
          </div>
        ` : `
          <div class="space-y-2.5">
            ${staffLeaves.map(l => `
              <div class="glass-card rounded-xl p-3.5 border border-white/5 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white">${l.type || 'Casual'} Leave</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${l.status === 'Approved' ? 'bg-green-500/20 text-green-400' : l.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}">
                      ${l.status}
                    </span>
                  </div>
                  <div class="text-xs text-gray-300 mt-1">
                    <strong>${l.from || l.from_date}</strong> to <strong>${l.to || l.to_date}</strong> (${l.days || 1} day${(l.days || 1) > 1 ? 's' : ''})
                  </div>
                  <div class="text-[11px] text-gray-400 mt-0.5">Reason: "${l.reason || 'None provided'}"</div>
                </div>
                ${l.status === 'Pending' ? `
                  <div class="flex items-center gap-2">
                    <button onclick="promptLeaveDecision('${l.id}', 'Approved')" class="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold">
                      Approve
                    </button>
                    <button onclick="promptLeaveDecision('${l.id}', 'Rejected')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      Reject
                    </button>
                  </div>
                ` : `
                  <span class="text-[11px] text-gray-500 uppercase font-semibold">${l.status}</span>
                `}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }
}

let staffModalCalDate = new Date();

function prevStaffModalCal(staffId) {
  staffModalCalDate = new Date(staffModalCalDate.getFullYear(), staffModalCalDate.getMonth() - 1, 1);
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (s) renderStaffModalTabContent(s, 'attendance');
}

function nextStaffModalCal(staffId) {
  staffModalCalDate = new Date(staffModalCalDate.getFullYear(), staffModalCalDate.getMonth() + 1, 1);
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (s) renderStaffModalTabContent(s, 'attendance');
}

function todayStaffModalCal(staffId) {
  staffModalCalDate = new Date();
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (s) renderStaffModalTabContent(s, 'attendance');
}

async function promptStaffRating(staffId) {
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;
  const current = s.rating ? Number(s.rating).toFixed(1) : '4.8';
  const val = prompt(`Rate employee ${s.name} (1.0 to 5.0 stars):`, current);
  if (!val) return;
  const num = Math.max(1, Math.min(5, Number(val)));
  if (isNaN(num)) {
    showToast('Invalid rating. Enter between 1.0 and 5.0', 'error');
    return;
  }
  s.rating = Math.round(num * 10) / 10;
  if (typeof API !== 'undefined' && API.updateStaff) {
    await API.updateStaff(staffId, { rating: s.rating });
  }
  showToast(`Updated rating for ${s.name}: ${s.rating} ★`, 'success');
  renderStaffSubTab();
  renderStaffProfileModalUI(staffId);
}

function openDateAttendanceQuickEdit(staffId, dateStr, currentStatus) {
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  const currentRec = (STATE.attendance || []).find(a => String(a.staff_id) === String(staffId) && a.date === dateStr);
  const currentCheckIn = currentRec?.check_in || '10:00 AM';

  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-bold text-white">Update Attendance — ${s.name}</h3>
        <p class="text-xs text-saffron-400 font-mono">Date: ${dateStr}</p>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form onsubmit="handleDateAttendanceSubmit(event, '${s.id}', '${dateStr}')" class="space-y-4 text-xs">
      <div>
        <label class="block text-gray-400 mb-1 font-semibold">Select Status *</label>
        <select name="status" id="quick-att-status" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-semibold">
          <option value="present" ${currentStatus === 'present' || currentStatus === 'late' ? 'selected' : ''}>✓ Present (Clocked In)</option>
          <option value="leave" ${currentStatus === 'leave' ? 'selected' : ''}>✈ On Leave (Approved)</option>
          <option value="absent" ${currentStatus === 'absent' ? 'selected' : ''}>✕ Absent</option>
          <option value="late" ${currentStatus === 'late' ? 'selected' : ''}>⏰ Late Arrival</option>
        </select>
      </div>

      <div>
        <label class="block text-gray-400 mb-1">Check-in Time (for Present)</label>
        <input type="text" name="checkIn" value="${currentCheckIn}" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white font-mono" />
      </div>

      <div>
        <label class="block text-gray-400 mb-1">Reason / Note</label>
        <input type="text" name="reason" placeholder="e.g. Approved by Floor Manager" class="w-full p-2.5 rounded-lg bg-dark-800 border border-white/10 text-white" />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="btn-ghost px-4 py-2 rounded-lg text-xs">Cancel</button>
        <button type="submit" class="btn-primary px-5 py-2 rounded-lg text-xs font-bold">Save Attendance</button>
      </div>
    </form>
  `, 'max-w-md');
}

async function handleDateAttendanceSubmit(e, staffId, dateStr) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const status = fd.get('status');
  const checkIn = fd.get('checkIn');
  const reason = fd.get('reason') || 'Updated from staff calendar';

  closeModal();

  // Call API
  if (typeof API !== 'undefined' && API.overrideAttendance) {
    await API.overrideAttendance(staffId, status, checkIn, reason, dateStr);
  }

  // Update local STATE.attendance
  STATE.attendance = STATE.attendance || [];
  let att = STATE.attendance.find(a => String(a.staff_id) === String(staffId) && a.date === dateStr);
  if (!att) {
    const s = STATE.staff.find(x => String(x.id) === String(staffId));
    att = {
      id: `a-${staffId}-${dateStr}`,
      staff_id: String(staffId),
      name: s ? s.name : 'Staff',
      date: dateStr,
      check_in: status === 'present' || status === 'late' ? checkIn : null,
      check_out: null,
      breaks: [],
      status: status === 'late' ? 'present' : status,
      is_late: status === 'late'
    };
    STATE.attendance.push(att);
  } else {
    att.status = status === 'late' ? 'present' : status;
    att.is_late = (status === 'late');
    if (status === 'present' || status === 'late') {
      att.check_in = checkIn;
    }
  }

  // If today, also update staff.status
  const todayStr = new Date().toISOString().slice(0, 10);
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (dateStr === todayStr && s) {
    if (status === 'present' || status === 'late') {
      s.status = 'Clocked In';
      s.checkIn = checkIn;
    } else if (status === 'leave') {
      s.status = 'On Leave';
      s.checkIn = '—';
    } else if (status === 'absent') {
      s.status = 'Absent';
      s.checkIn = '—';
    }
  }

  showToast(`Attendance for ${dateStr} updated to ${status.toUpperCase()}`, 'success');
  renderStaffSubTab();
  openStaffProfileModal(staffId);
  switchStaffModalTab(staffId, 'attendance');
}
}

async function handleSaveStaffProfile(e, staffId) {
  e.preventDefault();
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  const fd = new FormData(e.target);
  const newRate = Number(fd.get('rate')) || s.rate || 180;

  // If rate changed and not owner, request owner authorization
  if (newRate !== s.rate && !isOwner()) {
    requestOwnerOverride('Base Salary Rate', () => {
      saveStaffProfileData(staffId, fd, newRate);
    });
    return;
  }

  await saveStaffProfileData(staffId, fd, newRate);
}

async function saveStaffProfileData(staffId, fd, newRate) {
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  const selectedRole = fd.get('role') || s.role;
  const roleLower = selectedRole.toLowerCase();
  let staffRole = 'waiter';
  if (roleLower.includes('kitchen') || roleLower.includes('cook') || roleLower.includes('chef')) {
    staffRole = 'kitchen';
  } else if (roleLower.includes('cashier') || roleLower.includes('accountant')) {
    staffRole = 'accountant';
  }

  const updatedFields = {
    name: fd.get('name') || s.name,
    phone: fd.get('phone') || s.phone,
    emergencyContact: fd.get('emergencyContact') || s.emergencyContact,
    address: fd.get('address') || s.address,
    role: selectedRole,
    staffRole: staffRole,
    shift: fd.get('shift') || s.shift,
    status: fd.get('status') || s.status,
    aadhaar: fd.get('aadhaar') || s.aadhaar,
    pan: fd.get('pan') || s.pan,
    bankName: fd.get('bankName') || s.bankName,
    accountNumber: fd.get('accountNumber') || s.accountNumber,
    ifsc: fd.get('ifsc') || s.ifsc,
    rate: newRate,
    otRate: newRate * 2,
    rating: fd.get('rating') ? Number(fd.get('rating')) : (s.rating || 4.8),
    pfApplicable: fd.get('pfApplicable') !== null,
    esiApplicable: fd.get('esiApplicable') !== null,
    pin: fd.get('pin') || s.pin || s.id
  };

  // Update locally
  Object.assign(s, updatedFields);

  // Sync to backend API (PUT /api/staff/:id)
  if (typeof API !== 'undefined' && API.updateStaff) {
    const res = await API.updateStaff(staffId, updatedFields);
    if (res && res.staff) {
      console.log('Staff synced to server:', res.staff);
    }
  }

  isStaffProfileEditing = false;
  renderStaffSubTab();
  renderStaffProfileModalUI(staffId);
  showToast(`Staff profile updated for ${s.name}`, 'success');
}

// ===================================================================
// 5.4 💰 INDIAN STATUTORY PAYROLL ENGINE
// ===================================================================
function renderPayrollEngine(el) {
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  STATE.staff.forEach(s => {
    const p = calcIndianPayroll(s);
    totalGross += p.gross;
    totalDeductions += p.totalDeductions;
    totalNet += p.netPayable;
  });

  el.innerHTML = `
    <div class="space-y-5">
      <!-- Statutory Compliance Overview Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-card rounded-2xl p-4">
          <div class="text-xs text-gray-400 font-semibold uppercase">Total Monthly Gross</div>
          <div class="text-2xl font-extrabold text-white mt-1">${formatINR(totalGross)}</div>
        </div>

        <div class="glass-card rounded-2xl p-4">
          <div class="text-xs text-gray-400 font-semibold uppercase">Statutory Deductions (PF+ESI+TDS)</div>
          <div class="text-2xl font-extrabold text-red-400 mt-1">-${formatINR(totalDeductions)}</div>
        </div>

        <div class="glass-card rounded-2xl p-4 border border-green-500/30">
          <div class="text-xs text-gray-400 font-semibold uppercase">Net Bank Payout</div>
          <div class="text-2xl font-extrabold text-green-400 mt-1">${formatINR(totalNet)}</div>
        </div>
      </div>

      <!-- Action & Month Bar -->
      <div class="flex items-center justify-between bg-dark-800/80 p-3.5 rounded-2xl border border-white/5">
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400">Processing Cycle:</span>
          <select class="text-xs font-bold text-white bg-dark-700 rounded-lg px-3 py-1.5 border-0">
            <option>May 2024 (Active Cycle)</option>
            <option>April 2024 (Archived)</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          ${STATE.payrollLocked ? `
            <span class="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1.5">
              ✓ Cycle Frozen & Payslips Ready
            </span>
          ` : `
            <button onclick="lockAndGenerateCycle()" class="btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
              <span>Lock & Generate Payslips (WhatsApp)</span>
            </button>
          `}
        </div>
      </div>

      <!-- Indian Law Payroll Table -->
      <div class="glass-card rounded-2xl overflow-hidden ${STATE.payrollLocked ? 'border border-green-500/40' : ''}">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="text-[11px] text-gray-400 border-b border-white/5 bg-white/5 uppercase">
              <tr>
                <th class="py-3 px-4 text-left">Staff Name</th>
                <th class="py-3 px-3 text-right">Basic + DA</th>
                <th class="py-3 px-3 text-right">OT (2× Law)</th>
                <th class="py-3 px-3 text-right">Gross Pay</th>
                <th class="py-3 px-3 text-right">PF (12%)</th>
                <th class="py-3 px-3 text-right">ESI (0.75%)</th>
                <th class="py-3 px-3 text-right">Absence</th>
                <th class="py-3 px-3 text-right">Net Payable</th>
                <th class="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${STATE.staff.map(s => {
                const p = calcIndianPayroll(s);
                return `
                  <tr class="table-row">
                    <td class="py-3 px-4 text-left">
                      <div class="font-bold text-white">${s.name}</div>
                      <div class="text-[10px] text-gray-400">${s.role} · ${s.id}</div>
                    </td>
                    <td class="py-3 px-3 text-right font-medium">
                      ${formatINR(p.pfWageBase)}
                      ${!p.basicCompliant ? '<span class="text-red-400 text-xs ml-1 font-bold" title="Basic < 50% of gross! Statutory risk!">⚠</span>' : ''}
                    </td>
                    <td class="py-3 px-3 text-right text-amber-400 font-semibold">${formatINR(p.otPay)} <span class="text-[10px] text-gray-400 font-normal">(${p.otHours}h)</span></td>
                    <td class="py-3 px-3 text-right font-bold text-white">${formatINR(p.gross)}</td>
                    <td class="py-3 px-3 text-right text-red-400">-${formatINR(p.pfEmployee)}</td>
                    <td class="py-3 px-3 text-right text-red-400">
                      ${p.esiEmployee > 0 ? `-${formatINR(p.esiEmployee)}` : '<span class="text-gray-600 font-mono">— (Gross>21k)</span>'}
                    </td>
                    <td class="py-3 px-3 text-right text-red-400">
                      ${p.absenceDeduction > 0 ? `-${formatINR(p.absenceDeduction)}` : '0'}
                    </td>
                    <td class="py-3 px-3 text-right font-extrabold text-green-400 text-sm">${formatINR(p.netPayable)}</td>
                    <td class="py-3 px-4 text-center">
                      <button onclick="generateIndividualPayslip('${s.id}')" class="text-saffron-400 hover:underline font-semibold">
                        Payslip
                      </button>
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

function lockAndGenerateCycle() {
  if (!confirm('Lock this payroll cycle? Attendance, overtime, and salary rates will be frozen for May 2024.')) return;

  STATE.payrollLocked = true;
  renderStaffSubTab();
  showToast('May 2024 Payroll Cycle Locked. 6 PDF Payslips generated & WhatsApp alerts queued.', 'success');
}

function generateIndividualPayslip(staffId) {
  const s = STATE.staff.find(x => x.id === staffId);
  if (!s) return;

  const p = calcIndianPayroll(s);

  openModal(`
    <div class="text-center pb-4 border-b border-white/10 mb-4">
      <div class="text-xs uppercase font-extrabold text-saffron-400 tracking-wider">QR DINE RESTAURANT ENTERPRISE</div>
      <h3 class="text-lg font-bold text-white mt-1">Salary Slip — May 2024</h3>
      <div class="text-xs text-gray-400">Employee ID: ${s.id} · Role: ${s.role}</div>
    </div>

    <div class="space-y-3 text-xs">
      <div class="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
        <div><span class="text-gray-400">Employee Name:</span> <strong class="text-white">${s.name}</strong></div>
        <div><span class="text-gray-400">PAN Card:</span> <strong class="text-white font-mono">${s.pan}</strong></div>
        <div><span class="text-gray-400">Aadhaar UID:</span> <strong class="text-white font-mono">${s.aadhaar}</strong></div>
        <div><span class="text-gray-400">Bank IFSC:</span> <strong class="text-white font-mono">${s.ifsc}</strong></div>
      </div>

      <!-- Earnings & Deductions Breakdown -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Earnings -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-green-400 uppercase">Earnings</div>
          <div class="flex justify-between"><span class="text-gray-400">Basic Pay</span><span>${formatINR(p.basic)}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Dearness Allowance (DA)</span><span>${formatINR(p.da)}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">House Rent Allowance</span><span>${formatINR(p.hra)}</span></div>
          <div class="flex justify-between text-amber-400"><span class="font-medium">Overtime (2× Indian Law)</span><span>+${formatINR(p.otPay)}</span></div>
          <div class="flex justify-between pt-2 border-t border-white/10 font-bold text-white"><span>Gross Earnings</span><span>${formatINR(p.gross)}</span></div>
        </div>

        <!-- Deductions -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-red-400 uppercase">Statutory Deductions</div>
          <div class="flex justify-between text-red-400"><span>PF (Employee 12%)</span><span>-${formatINR(p.pfEmployee)}</span></div>
          <div class="flex justify-between text-red-400"><span>ESI (Employee 0.75%)</span><span>-${formatINR(p.esiEmployee)}</span></div>
          <div class="flex justify-between text-red-400"><span>TDS (Income Tax)</span><span>-${formatINR(p.tds)}</span></div>
          <div class="flex justify-between text-red-400"><span>Unapproved Absences</span><span>-${formatINR(p.absenceDeduction)}</span></div>
          <div class="flex justify-between pt-2 border-t border-white/10 font-bold text-red-400"><span>Total Deductions</span><span>-${formatINR(p.totalDeductions)}</span></div>
        </div>
      </div>

      <!-- Net Bank Amount -->
      <div class="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between text-sm mt-3">
        <span class="font-bold text-white">Net Salary Deposited:</span>
        <span class="text-lg font-extrabold text-green-400">${formatINR(p.netPayable)}</span>
      </div>

      <div class="text-[10px] text-gray-500 text-center pt-2">
        Employer PF Contribution: ${formatINR(p.pfEmployer)} · Employer ESI: ${formatINR(p.esiEmployer)}<br>
        Digitally signed and generated by QR Dine Enterprise Payroll Engine.
      </div>

      <div class="flex gap-2 pt-2">
        <button onclick="closeModal()" class="btn-ghost flex-1 py-2 rounded-lg text-xs font-semibold">Close</button>
        <button onclick="showToast('Payslip PDF downloaded to device', 'success')" class="btn-primary flex-1 py-2 rounded-lg text-xs font-bold">Download PDF</button>
      </div>
    </div>
  `);
}
