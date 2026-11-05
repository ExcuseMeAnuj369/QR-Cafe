/**
 * ===================================================================
 * QR DINE — SECTION 6: ATTENDANCE & LEAVE PANEL (MERGED) [BOTH]
 * 6.1 Live Roster (Avatar Grid, Clock Status, Audit-Reason Override)
 * 6.2 Leave Approvals (Balance Check, Understaffed Warning, Manager PIN)
 * 6.3 Shift Roster Planner (Mon-Sun, Double-Shift Conflict Validation)
 * ===================================================================
 */

let activeAttendanceSubTab = 'roster'; // 'roster', 'calendar', 'leaves', 'shifts'
let mainAttendanceCalDate = new Date();
let selectedCalendarStaffId = '';

function renderAttendance(el) {
  if (!selectedCalendarStaffId && STATE.staff.length > 0) {
    selectedCalendarStaffId = STATE.staff[0].id;
  }

  const presentCount = STATE.staff.filter(s => s.status === 'Clocked In' || s.status === 'On Break').length;
  const leaveCount = STATE.staff.filter(s => s.status === 'On Leave').length;
  const pendingLeavesCount = STATE.leaves.filter(l => l.status === 'Pending').length;

  el.innerHTML = `
    <div class="p-6 fade-in space-y-5">
      ${pageHeader('Attendance & Leave Management', 'Real-time floor check-ins, supervisor audit overrides, leave approvals, and shift scheduling.',
        `<div class="flex items-center gap-2">
          <button onclick="switchAttendanceTab('roster')" id="att-tab-roster"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeAttendanceSubTab === 'roster' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            Floor Live Roster (${presentCount} Present)
          </button>
          <button onclick="switchAttendanceTab('calendar')" id="att-tab-calendar"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeAttendanceSubTab === 'calendar' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            📅 Monthly Calendar
          </button>
          <button onclick="switchAttendanceTab('leaves')" id="att-tab-leaves"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeAttendanceSubTab === 'leaves' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            Leave Approvals (${pendingLeavesCount})
          </button>
          <button onclick="switchAttendanceTab('shifts')" id="att-tab-shifts"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeAttendanceSubTab === 'shifts' ? 'bg-saffron-500 text-black shadow-md' : 'text-gray-400 hover:text-white bg-dark-700/50'}">
            Weekly Shifts
          </button>
        </div>`)}

      <!-- Active Sub-tab View Container -->
      <div id="attendance-content-container"></div>
    </div>
  `;

  renderAttendanceSubTabContent();
}

function switchAttendanceTab(tab) {
  activeAttendanceSubTab = tab;
  renderAttendanceSubTabContent();

  ['roster', 'calendar', 'leaves', 'shifts'].forEach(t => {
    const btn = document.getElementById(`att-tab-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-saffron-500 text-black shadow-md';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-gray-400 hover:text-white bg-dark-700/50';
      }
    }
  });
}

function renderAttendanceSubTabContent() {
  const container = document.getElementById('attendance-content-container');
  if (!container) return;

  if (activeAttendanceSubTab === 'roster') {
    renderLiveRosterView(container);
  } else if (activeAttendanceSubTab === 'calendar') {
    renderAttendanceCalendarView(container);
  } else if (activeAttendanceSubTab === 'leaves') {
    renderLeaveApprovalsView(container);
  } else {
    renderShiftPlannerView(container);
  }
}

// ===================================================================
// 6.1 LIVE ROSTER (DEFAULT VIEW)
// ===================================================================
function renderLiveRosterView(el) {
  const totalStaff = STATE.staff.length;
  const presentCount = STATE.staff.filter(s => s.status === 'Clocked In').length;
  const onBreakCount = STATE.staff.filter(s => s.status === 'On Break').length;
  const onLeaveCount = STATE.staff.filter(s => s.status === 'On Leave').length;
  const absentCount = STATE.staff.filter(s => s.status === 'Absent').length;

  el.innerHTML = `
    <div class="space-y-4">
      <!-- Quick Floor Summary Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="glass-card rounded-xl p-3 border border-white/5">
          <div class="text-[10px] text-gray-400 uppercase font-semibold">Total Staff</div>
          <div class="text-xl font-extrabold text-white mt-1">${totalStaff}</div>
        </div>
        <div class="glass-card rounded-xl p-3 border border-green-500/20 bg-green-500/5">
          <div class="text-[10px] text-green-400 uppercase font-bold">Present Today</div>
          <div class="text-xl font-extrabold text-green-400 mt-1">${presentCount}</div>
        </div>
        <div class="glass-card rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
          <div class="text-[10px] text-blue-400 uppercase font-bold">On Leave</div>
          <div class="text-xl font-extrabold text-blue-400 mt-1">${onLeaveCount}</div>
        </div>
        <div class="glass-card rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
          <div class="text-[10px] text-amber-400 uppercase font-bold">On Break</div>
          <div class="text-xl font-extrabold text-amber-400 mt-1">${onBreakCount}</div>
        </div>
        <div class="glass-card rounded-xl p-3 border border-red-500/20 bg-red-500/5">
          <div class="text-[10px] text-red-400 uppercase font-bold">Absent</div>
          <div class="text-xl font-extrabold text-red-400 mt-1">${absentCount}</div>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-gray-400">
        <p>
          Quick actions update today's status immediately. Click <strong>Override ✎</strong> for detailed audit logging.
        </p>
        <span class="text-saffron-400 font-mono">Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      <!-- Avatar Grid with Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${STATE.staff.map(s => {
          const statusDot =
            s.status === 'Clocked In' ? 'status-live' :
            s.status === 'On Break' ? 'status-break' :
            s.status === 'On Leave' ? 'bg-blue-500' :
            s.status === 'Absent' ? 'status-absent' : 'bg-gray-500';

          const badgeColor =
            s.status === 'Clocked In' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            s.status === 'On Break' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            s.status === 'On Leave' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            s.status === 'Absent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-gray-500/20 text-gray-400 border border-gray-500/30';

          return `
            <div class="glass-card rounded-2xl p-4 border border-white/5 hover:border-saffron-500/30 transition flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-saffron-500/30 to-amber-600/40 text-saffron-400 font-extrabold text-sm flex items-center justify-center">
                        ${s.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span class="status-dot ${statusDot} absolute bottom-0 right-0 border-2 border-dark-900"></span>
                    </div>
                    <div>
                      <div class="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>${s.name}</span>
                        <span class="text-[10px] text-amber-400 font-normal">★ ${s.rating ? Number(s.rating).toFixed(1) : '4.8'}</span>
                      </div>
                      <div class="text-[11px] text-gray-400">${s.role} · ID: ${s.id}</div>
                      <div class="text-[10px] text-gray-500 mt-0.5">Shift: ${s.shift} (${s.checkIn || '—'})</div>
                    </div>
                  </div>
                  <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${badgeColor}">
                    ${s.status || 'Clocked In'}
                  </span>
                </div>
              </div>

              <!-- Quick Status Buttons -->
              <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-1.5 text-[11px]">
                <div class="flex items-center gap-1">
                  <button onclick="quickMarkFloorStatus('${s.id}', 'Clocked In')"
                          class="px-2 py-1 rounded-md font-semibold transition ${s.status === 'Clocked In' ? 'bg-green-500 text-black' : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'}"
                          title="Mark Present Today">
                    ✓ Present
                  </button>
                  <button onclick="quickMarkFloorStatus('${s.id}', 'On Leave')"
                          class="px-2 py-1 rounded-md font-semibold transition ${s.status === 'On Leave' ? 'bg-blue-500 text-white' : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'}"
                          title="Mark On Leave Today">
                    ✈ Leave
                  </button>
                  <button onclick="quickMarkFloorStatus('${s.id}', 'Absent')"
                          class="px-2 py-1 rounded-md font-semibold transition ${s.status === 'Absent' ? 'bg-red-500 text-white' : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'}"
                          title="Mark Absent Today">
                    ✕ Absent
                  </button>
                </div>
                <button onclick="openAttendanceOverrideModal('${s.id}')"
                        class="text-[10px] text-saffron-400 hover:underline font-bold px-1 py-1">
                  Override ✎
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function quickMarkFloorStatus(staffId, newStatus) {
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const checkInVal = newStatus === 'Clocked In' ? (s.checkIn && s.checkIn !== '—' ? s.checkIn : nowTime) : '—';

  s.status = newStatus;
  s.checkIn = checkInVal;

  // Update attendance record locally
  STATE.attendance = STATE.attendance || [];
  let att = STATE.attendance.find(a => String(a.staff_id) === String(staffId) && a.date === todayStr);

  const mappedRecStatus =
    newStatus === 'Clocked In' ? 'present' :
    newStatus === 'On Leave' ? 'leave' :
    newStatus === 'Absent' ? 'absent' : 'present';

  if (!att) {
    att = {
      id: `a-${staffId}-${todayStr}`,
      staff_id: String(staffId),
      name: s.name,
      date: todayStr,
      check_in: newStatus === 'Clocked In' ? checkInVal : null,
      check_out: null,
      breaks: [],
      status: mappedRecStatus,
      is_late: false
    };
    STATE.attendance.push(att);
  } else {
    att.status = mappedRecStatus;
    if (newStatus === 'Clocked In') {
      att.check_in = checkInVal;
    }
  }

  showToast(`${s.name} marked as ${newStatus}`, 'success');
  renderAttendanceSubTabContent();

  // Sync to Backend
  if (typeof API !== 'undefined' && API.overrideAttendance) {
    await API.overrideAttendance(staffId, newStatus, checkInVal, `Quick status set from Floor Roster`, todayStr);
  }
}

function openAttendanceOverrideModal(staffId) {
  const s = STATE.staff.find(x => x.id === staffId);
  if (!s) return;

  openModal(`
    <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
      <div>
        <h3 class="text-base font-bold text-white">Attendance Override — ${s.name}</h3>
        <p class="text-xs text-amber-400 font-medium">Mandatory Audit Log Entry Required</p>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-white">✕</button>
    </div>

    <form onsubmit="handleAttendanceOverrideSubmit(event, '${s.id}')" class="space-y-4 text-xs">
      <div class="p-3 rounded-xl bg-dark-700/50 border border-white/5 space-y-1">
        <div class="flex justify-between text-gray-300"><span>Employee:</span> <strong class="text-white">${s.name} (${s.id})</strong></div>
        <div class="flex justify-between text-gray-300"><span>Current Status:</span> <strong class="text-amber-400">${s.status}</strong></div>
        <div class="flex justify-between text-gray-300"><span>Recorded Check-In:</span> <span>${s.checkIn}</span></div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-gray-400 mb-1">New Status *</label>
          <select name="status" class="w-full p-2.5 rounded-lg text-xs bg-dark-800 border border-white/10 text-white font-semibold">
            <option value="Clocked In" ${s.status === 'Clocked In' ? 'selected' : ''}>Clocked In (Present)</option>
            <option value="On Break" ${s.status === 'On Break' ? 'selected' : ''}>On Break</option>
            <option value="On Leave" ${s.status === 'On Leave' ? 'selected' : ''}>On Leave (Approved)</option>
            <option value="Absent" ${s.status === 'Absent' ? 'selected' : ''}>Absent</option>
            <option value="Shift Ended" ${s.status === 'Shift Ended' ? 'selected' : ''}>Shift Ended</option>
          </select>
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Adjusted Check-In Time</label>
          <input type="text" name="checkIn" value="${s.checkIn === '—' ? '10:00 AM' : s.checkIn}" class="w-full p-2.5 rounded-lg text-xs" />
        </div>
      </div>

      <div>
        <label class="block text-gray-400 mb-1 font-semibold text-white">Reason for Override (Mandatory) *</label>
        <textarea name="reason" required rows="3" placeholder="e.g. Metro delay on Purple Line; supervisor verified arrival at 10:05 AM"
                  class="w-full p-3 rounded-lg text-xs"></textarea>
      </div>

      <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
        Notice: Overriding attendance updates hours worked in the Indian Statutory Payroll engine. This action is permanently stamped in the audit logs table under your name.
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button type="button" onclick="closeModal()" class="btn-ghost px-4 py-2 rounded-lg text-xs">Cancel</button>
        <button type="submit" class="btn-primary px-5 py-2 rounded-lg text-xs font-bold">Save Override & Log</button>
      </div>
    </form>
  `);
}

async function handleAttendanceOverrideSubmit(e, staffId) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const s = STATE.staff.find(x => String(x.id) === String(staffId));
  if (!s) return;

  const oldStatus = s.status;
  s.status = fd.get('status');
  s.checkIn = fd.get('checkIn');
  const reason = fd.get('reason');

  // Push audit log
  STATE.audit_logs.unshift({
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    actor: `${STATE.user.name} (${STATE.user.role})`,
    action: 'Attendance Override',
    detail: `${s.name} (${s.id}) status altered from "${oldStatus}" to "${s.status}". Reason: ${reason}`
  });

  closeModal();
  renderAttendanceSubTabContent();
  showToast(`Attendance overridden for ${s.name}. Audit log recorded.`, 'success');

  // Sync to Backend
  if (typeof API !== 'undefined' && API.overrideAttendance) {
    await API.overrideAttendance(s.id, s.status, s.checkIn, reason);
  }
}

// ===================================================================
// 6.2 LEAVE APPROVALS (UNDERSTAFFED WARNING & PIN CHECK)
// ===================================================================
function renderLeaveApprovalsView(el) {
  const pendingLeaves = STATE.leaves.filter(l => l.status === 'Pending');

  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider">Pending Leave Applications (${pendingLeaves.length})</h3>
        <span class="text-xs text-gray-400">All actions require Manager/Owner PIN verification.</span>
      </div>

      <div class="space-y-3">
        ${STATE.leaves.map(l => `
          <div class="glass-card rounded-2xl p-4 border ${l.warning ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'}">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">${l.name}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-gray-300">${l.role}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${l.type === 'Sick' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}">${l.type} Leave</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${l.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' : l.status === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${l.status}</span>
                </div>
                <div class="text-xs text-gray-300 mt-1">
                  <strong>${l.from || l.from_date}</strong> to <strong>${l.to || l.to_date}</strong> (${l.days || 1} day${(l.days || 1) > 1 ? 's' : ''})
                </div>
                <div class="text-xs text-gray-400 mt-0.5">Reason: "${l.reason}" · Remaining Balance: <strong>${l.remainingBalance || 5} days</strong></div>
              </div>

              ${l.status === 'Pending' ? `
                <div class="flex items-center gap-2 shrink-0">
                  <button onclick="promptLeaveDecision('${l.id}', 'Rejected')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition">
                    Reject
                  </button>
                  <button onclick="promptLeaveDecision('${l.id}', 'Approved')" class="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold shadow-md">
                    Approve
                  </button>
                </div>
              ` : `
                <span class="text-xs text-gray-500 font-semibold uppercase">${l.status}</span>
              `}
            </div>

            <!-- System Warning Banner (Section 6.2) -->
            ${l.warning && l.status === 'Pending' ? `
              <div class="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>System Warning: ${l.warning}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function promptLeaveDecision(leaveId, decision) {
  const l = STATE.leaves.find(x => String(x.id) === String(leaveId));
  if (!l) return;

  const pin = prompt(`Enter PIN to confirm ${decision.toUpperCase()} for ${l.name}'s leave:\n(Manager PIN: 1234 or Owner PIN: 9999)`);
  if (!pin) return;

  if (pin === STATE.managerPin || pin === STATE.ownerPin) {
    l.status = decision;
    if (decision === 'Approved') {
      l.remainingBalance = Math.max(0, (l.remainingBalance || 5) - (l.days || 1));

      // AUTOMATICALLY populate attendance records for the entire leave date range!
      const fromDateStr = l.from || l.from_date;
      const toDateStr = l.to || l.to_date || fromDateStr;
      const todayStr = new Date().toISOString().slice(0, 10);
      const staffMember = STATE.staff.find(s => String(s.id) === String(l.staff_id || l.staffId));

      if (fromDateStr) {
        const start = new Date(fromDateStr);
        const end = new Date(toDateStr);
        let curr = new Date(start);
        STATE.attendance = STATE.attendance || [];

        let count = 0;
        while (curr <= end && count < 60) {
          const dStr = curr.toISOString().slice(0, 10);
          let att = STATE.attendance.find(a => String(a.staff_id) === String(l.staff_id || l.staffId) && a.date === dStr);
          if (!att) {
            att = {
              id: `a-leave-${l.staff_id || l.staffId}-${dStr}`,
              staff_id: String(l.staff_id || l.staffId),
              name: l.name,
              date: dStr,
              check_in: null,
              check_out: null,
              breaks: [],
              status: 'leave',
              is_late: false,
              leave_id: l.id,
              leave_type: l.type
            };
            STATE.attendance.push(att);
          } else {
            att.status = 'leave';
            att.leave_id = l.id;
            att.leave_type = l.type;
          }

          if (dStr === todayStr && staffMember) {
            staffMember.status = 'On Leave';
            staffMember.checkIn = '—';
          }

          curr.setDate(curr.getDate() + 1);
          count++;
        }
      }
    }

    renderLeaveApprovalsView(document.getElementById('attendance-content-container'));
    renderSidebar();
    showToast(`Leave request ${decision.toLowerCase()} for ${l.name}${decision === 'Approved' ? ' & attendance marked On Leave' : ''}`, decision === 'Approved' ? 'success' : 'error');

    // Sync to Backend
    if (typeof API !== 'undefined' && API.updateLeave) {
      await API.updateLeave(l.id, decision);
    }
  } else {
    showToast('Invalid PIN. Authorization failed.', 'error');
  }
}

// ===================================================================
// 6.25 📅 DEDICATED MONTHLY ATTENDANCE CALENDAR SUITE
// ===================================================================
function changeCalendarStaff(staffId) {
  selectedCalendarStaffId = staffId;
  const container = document.getElementById('attendance-content-container');
  if (container) renderAttendanceCalendarView(container);
}

function prevMainAttCal() {
  mainAttendanceCalDate = new Date(mainAttendanceCalDate.getFullYear(), mainAttendanceCalDate.getMonth() - 1, 1);
  const container = document.getElementById('attendance-content-container');
  if (container) renderAttendanceCalendarView(container);
}

function nextMainAttCal() {
  mainAttendanceCalDate = new Date(mainAttendanceCalDate.getFullYear(), mainAttendanceCalDate.getMonth() + 1, 1);
  const container = document.getElementById('attendance-content-container');
  if (container) renderAttendanceCalendarView(container);
}

function todayMainAttCal() {
  mainAttendanceCalDate = new Date();
  const container = document.getElementById('attendance-content-container');
  if (container) renderAttendanceCalendarView(container);
}

function renderAttendanceCalendarView(el) {
  const staff = STATE.staff.find(s => String(s.id) === String(selectedCalendarStaffId)) || STATE.staff[0];
  if (!staff) {
    el.innerHTML = `<div class="p-8 text-center text-gray-500">No staff members found.</div>`;
    return;
  }

  const year = mainAttendanceCalDate.getFullYear();
  const month = mainAttendanceCalDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const monthName = mainAttendanceCalDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().slice(0, 10);
  const ymPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const staffAtt = (STATE.attendance || []).filter(a => String(a.staff_id) === String(staff.id) && String(a.date).startsWith(ymPrefix));
  const staffLeaves = (STATE.leaves || []).filter(l => l.status === 'Approved' && String(l.staff_id || l.staffId) === String(staff.id));

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

  const payroll = calcIndianPayroll(staff, ymPrefix);

  el.innerHTML = `
    <div class="space-y-4">
      <!-- Top Control Bar: Staff Selector + Month Controls -->
      <div class="glass-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Staff Picker -->
        <div class="flex items-center gap-3">
          <label class="text-xs text-gray-400 font-bold uppercase tracking-wider shrink-0">Staff Member:</label>
          <select onchange="changeCalendarStaff(this.value)" class="p-2.5 rounded-xl bg-dark-800 border border-white/10 text-white font-bold text-xs min-w-[220px]">
            ${STATE.staff.map(s => `
              <option value="${s.id}" ${String(s.id) === String(staff.id) ? 'selected' : ''}>
                ${s.name} (${s.role} · ID: ${s.id})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Month Navigator -->
        <div class="flex items-center gap-2">
          <button onclick="prevMainAttCal()" class="px-3.5 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs transition">
            ◀ Prev Month
          </button>
          <div class="px-4 py-2 rounded-xl bg-dark-800 border border-saffron-500/30 text-saffron-400 font-mono font-extrabold text-sm text-center min-w-[170px]">
            ${monthName}
          </div>
          <button onclick="nextMainAttCal()" class="px-3.5 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs transition">
            Next Month ▶
          </button>
          <button onclick="todayMainAttCal()" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition ml-1">
            Current
          </button>
        </div>
      </div>

      <!-- Month Summary Analytics -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="glass-card rounded-xl p-3 border border-white/5">
          <span class="text-[10px] text-gray-400 uppercase font-semibold">Total Days in Month</span>
          <span class="text-xl font-extrabold text-white mt-1 block">${totalDays} Days</span>
        </div>
        <div class="glass-card rounded-xl p-3 border border-green-500/20 bg-green-500/5">
          <span class="text-[10px] text-green-400 uppercase font-bold">Present Days</span>
          <span class="text-xl font-extrabold text-green-400 mt-1 block">${countPresent}</span>
        </div>
        <div class="glass-card rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
          <span class="text-[10px] text-blue-400 uppercase font-bold">Approved Leaves</span>
          <span class="text-xl font-extrabold text-blue-400 mt-1 block">${countLeaves}</span>
        </div>
        <div class="glass-card rounded-xl p-3 border border-red-500/20 bg-red-500/5">
          <span class="text-[10px] text-red-400 uppercase font-bold">Unapproved Absences</span>
          <span class="text-xl font-extrabold text-red-400 mt-1 block">${countAbsent}</span>
        </div>
        <div class="glass-card rounded-xl p-3 border border-saffron-500/30 bg-saffron-500/10">
          <span class="text-[10px] text-saffron-400 uppercase font-bold">Calculated Monthly Pay</span>
          <span class="text-xl font-black text-white mt-1 block">${formatINR(payroll.netPayable)}</span>
        </div>
      </div>

      <!-- 7-Day Week Header -->
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-gray-400 px-1">
        <span class="text-red-400">Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      <!-- Monthly Calendar Grid -->
      <div class="grid grid-cols-7 gap-2">
        ${Array.from({ length: startWeekday }).map(() => `
          <div class="min-h-[72px] rounded-2xl bg-white/[0.01] border border-transparent"></div>
        `).join('')}

        ${days.map(d => {
          const isTodayClass = d.isToday ? 'ring-2 ring-saffron-400 ring-offset-2 ring-offset-dark-900 shadow-xl' : '';
          const color =
            d.status === 'present' ? 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25' :
            d.status === 'late' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25' :
            d.status === 'leave' ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 hover:bg-blue-500/25' :
            d.status === 'absent' ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25' :
            d.status === 'off' ? 'bg-gray-500/10 border-white/5 text-gray-500' :
            'bg-white/5 border-white/5 text-gray-400 hover:border-white/20';

          const label =
            d.status === 'present' ? (d.checkIn || 'Present') :
            d.status === 'late' ? 'Late' :
            d.status === 'leave' ? '✈ On Leave' :
            d.status === 'absent' ? '✕ Absent' :
            d.status === 'off' ? 'Weekly Off' : '—';

          return `
            <div onclick="openDateAttendanceQuickEdit('${staff.id}', '${d.date}', '${d.status}')"
                 class="min-h-[72px] p-2.5 rounded-2xl border ${color} ${isTodayClass} cursor-pointer transition flex flex-col justify-between"
                 title="Click to update status for ${d.date}">
              <div class="flex items-center justify-between">
                <span class="text-sm font-extrabold ${d.isToday ? 'text-saffron-400 underline' : 'text-white'}">${d.day}</span>
                ${d.isToday ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-saffron-500 text-black uppercase">Today</span>' : ''}
              </div>
              <div class="text-[10px] font-bold truncate mt-1 uppercase">
                ${label}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer Legend & Instructions -->
      <div class="p-3.5 rounded-xl glass-card border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Present</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Approved Leave</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500"></span> Late</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500"></span> Absent</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-gray-500/40"></span> Weekly Off</span>
        </div>
        <span class="text-saffron-400 font-semibold">💡 Click on any date above to mark Present, On Leave, or Absent</span>
      </div>
    </div>
  `;
}

// ===================================================================
// 6.3 SHIFT ROSTER PLANNER (MON-SUN WITH DOUBLE SHIFT CONFLICT CHECK)
// ===================================================================
function renderShiftPlannerView(el) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Check for any double-shift conflicts in the roster
  let conflictMsg = null;
  daysOfWeek.forEach(day => {
    const morning = STATE.shiftRoster[day]?.Morning || [];
    const evening = STATE.shiftRoster[day]?.Evening || [];
    const overlap = morning.filter(id => evening.includes(id));
    if (overlap.length > 0) {
      const s = STATE.staff.find(x => x.id === overlap[0]);
      conflictMsg = `Double Shift Conflict Detected! ${s ? s.name : overlap[0]} is assigned to BOTH Morning and Evening shifts on ${day}.`;
    }
  });

  el.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Weekly Workforce Shift Roster</h3>
          <p class="text-xs text-gray-400">Drag or assign staff to Morning (10 AM - 6 PM) or Evening (2 PM - 11 PM) slots.</p>
        </div>
        <button onclick="triggerShiftConflictDemo()" class="text-xs text-saffron-400 hover:underline">
          Test Double-Shift Validation
        </button>
      </div>

      <!-- Double Shift Warning Banner (Section 6.3) -->
      ${conflictMsg ? `
        <div class="p-3.5 rounded-xl bg-red-500/20 border border-red-500 text-red-300 text-xs font-bold flex items-center justify-between animate-pulse">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>${conflictMsg}</span>
          </div>
          <button onclick="resolveShiftConflict()" class="px-2.5 py-1 rounded bg-red-500 text-white text-[11px] font-bold">Auto-Fix</button>
        </div>
      ` : ''}

      <!-- Mon - Sun Calendar Table -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-white/5 border-b border-white/10 text-[11px] text-gray-400 uppercase">
              <tr>
                <th class="p-3 w-32">Day</th>
                <th class="p-3">Morning Shift (10 AM — 06 PM)</th>
                <th class="p-3">Evening Shift (02 PM — 11 PM)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${daysOfWeek.map(day => {
                const morningStaff = (STATE.shiftRoster[day]?.Morning || []).map(id => STATE.staff.find(s => s.id === id)).filter(Boolean);
                const eveningStaff = (STATE.shiftRoster[day]?.Evening || []).map(id => STATE.staff.find(s => s.id === id)).filter(Boolean);

                return `
                  <tr class="table-row">
                    <td class="p-3 font-bold text-white">${day}</td>
                    <td class="p-3">
                      <div class="flex flex-wrap gap-1.5">
                        ${morningStaff.map(s => `
                          <span class="px-2.5 py-1 rounded-lg bg-dark-700 border border-white/10 text-gray-200 text-xs flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-saffron-400"></span>
                            ${s.name} (${s.role})
                          </span>
                        `).join('')}
                      </div>
                    </td>
                    <td class="p-3">
                      <div class="flex flex-wrap gap-1.5">
                        ${eveningStaff.map(s => `
                          <span class="px-2.5 py-1 rounded-lg bg-dark-700 border border-white/10 text-gray-200 text-xs flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            ${s.name} (${s.role})
                          </span>
                        `).join('')}
                      </div>
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

function triggerShiftConflictDemo() {
  // Purposefully assign Priya Sharma to Evening as well on Saturday to test conflict validation
  if (!STATE.shiftRoster['Saturday'].Evening.includes('ST-104')) {
    STATE.shiftRoster['Saturday'].Evening.push('ST-104');
  }
  renderShiftPlannerView(document.getElementById('attendance-content-container'));
  showToast('Validation triggered: Priya Sharma assigned double shift on Saturday', 'error');
}

function resolveShiftConflict() {
  STATE.shiftRoster['Saturday'].Evening = STATE.shiftRoster['Saturday'].Evening.filter(id => id !== 'ST-104');
  renderShiftPlannerView(document.getElementById('attendance-content-container'));
  showToast('Shift conflict resolved. Double shift removed.', 'success');
}
