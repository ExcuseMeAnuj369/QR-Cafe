/**
 * ===================================================================
 * QR DINE — UTILITIES, SECURITY OVERRIDE & STATUTORY ENGINES
 * Includes:
 * 1. Owner Override Protocol (Floating 4-digit PIN card, 5m timer, Audit Log)
 * 2. Right-side Slide-Over Drawers & Centered Modals
 * 3. Bottom-Right Toast Notifications
 * 4. Theme & Role Switchers
 * 5. Indian Statutory Payroll Engine (Strict PF on Basic, ESI <= 21k, OT 2x)
 * 6. BCG Menu Engineering Matrix & Food Cost Formula
 * ===================================================================
 */

// DOM Selector Shortcuts
function $(sel) {
  return document.querySelector(sel);
}

function $$(sel) {
  return document.querySelectorAll(sel);
}

// Currency Formatter (Indian Rupees format e.g. ₹47,850)
function formatINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

// Current Date formatted for Indian restaurant ops
function todayStr() {
  const d = new Date();
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMin % 60}m ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// ===================================================================
// 1. THE "OWNER OVERRIDE" PROTOCOL (Section 1.2)
// ===================================================================

let pendingOverrideAction = null;

function isOwner() {
  if (STATE.user && STATE.user.role === 'owner') return true;
  if (STATE.ownerOverrideUntil && STATE.ownerOverrideUntil > Date.now()) return true;
  return false;
}

/**
 * Triggered when a restricted field or action is clicked by a Manager.
 * Opens the Glassmorphism Floating Card sliding up from bottom center.
 */
function requestOwnerOverride(fieldName, actionCallback) {
  // If already Owner or within active 5-minute override session, execute immediately
  if (isOwner()) {
    actionCallback();
    return;
  }

  pendingOverrideAction = actionCallback;

  const card = $('#override-card');
  const targetLabel = $('#override-target-label');
  const pinInput = $('#override-pin-input');

  if (targetLabel) targetLabel.textContent = fieldName || 'Restricted Field';
  if (pinInput) {
    pinInput.value = '';
    pinInput.classList.remove('is-invalid');
  }

  if (card) {
    card.classList.add('open');
    setTimeout(() => pinInput && pinInput.focus(), 150);
  }
}

function cancelOwnerOverride() {
  pendingOverrideAction = null;
  const card = $('#override-card');
  if (card) card.classList.remove('open');
}

function confirmOwnerOverride() {
  const pinInput = $('#override-pin-input');
  const pin = pinInput ? pinInput.value.trim() : '';
  const card = $('#override-card');

  if (pin === STATE.ownerPin) {
    // 5-minute unlock window
    STATE.ownerOverrideUntil = Date.now() + 5 * 60 * 1000;
    
    // Log to audit logs table
    const target = $('#override-target-label')?.textContent || 'Restricted Field';
    STATE.audit_logs.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      actor: `${STATE.user.name} (${STATE.user.role})`,
      action: 'Owner Override Authorized',
      detail: `Used Owner PIN to authorize edits on "${target}"`
    });

    if (card) card.classList.remove('open');
    showToast('Owner Authorization Granted (Active for 5 minutes)', 'success');

    if (typeof pendingOverrideAction === 'function') {
      const cb = pendingOverrideAction;
      pendingOverrideAction = null;
      cb();
    }
  } else {
    if (pinInput) {
      pinInput.classList.add('is-invalid');
      pinInput.value = '';
    }
    showToast('Invalid Owner PIN. Access Denied.', 'error');
  }
}

// ===================================================================
// 2. SLIDE-OVER PANELS & MODALS (Section 1.3)
// ===================================================================

/**
 * Opens Slide-Over from right (for viewing details without losing place)
 */
function openSlideOver(title, bodyHtml, footerHtml = '') {
  const backdrop = $('#slideover-backdrop');
  const panel = $('#slideover-panel');
  const titleEl = $('#slideover-title');
  const bodyEl = $('#slideover-body');
  const footerEl = $('#slideover-footer');

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;
  if (footerEl) {
    footerEl.innerHTML = footerHtml;
    footerEl.style.display = footerHtml ? 'flex' : 'none';
  }

  if (backdrop && panel) {
    backdrop.classList.remove('hidden');
    setTimeout(() => panel.classList.add('open'), 10);
  }
}

function closeSlideOver() {
  const backdrop = $('#slideover-backdrop');
  const panel = $('#slideover-panel');
  if (panel) panel.classList.remove('open');
  setTimeout(() => {
    if (backdrop) backdrop.classList.add('hidden');
  }, 300);
}

// Centered Modal Helpers
function openModal(html, maxWidthClass = 'max-w-xl') {
  const modalBox = $('#modal-box');
  const modalRoot = $('#modal-root');
  if (modalBox && modalRoot) {
    modalBox.className = `glass-card rounded-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto p-6 fade-in`;
    modalBox.innerHTML = html;
    modalRoot.classList.remove('hidden');
  }
}

function closeModal() {
  const modalRoot = $('#modal-root');
  if (modalRoot) {
    modalRoot.classList.add('hidden');
  }
}

// ===================================================================
// 3. TOAST NOTIFICATIONS SYSTEM
// ===================================================================

function showToast(message, type = 'success') {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg =
    type === 'success' ? `<svg class="w-4 h-4 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>` :
    type === 'error' ? `<svg class="w-4 h-4 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>` :
    `<svg class="w-4 h-4 shrink-0 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 text-sm font-medium leading-snug">${message}</div>
    <button class="text-white/60 hover:text-white shrink-0 ml-2" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===================================================================
// 4. THEME & ROLE SWITCHERS
// ===================================================================

function setTheme(theme) {
  STATE.theme = theme;
  document.body.classList.remove('theme-amoled', 'theme-light');
  if (theme === 'amoled') document.body.classList.add('theme-amoled');
  if (theme === 'light') document.body.classList.add('theme-light');
  showToast(`Switched to ${theme.toUpperCase()} theme`, 'success');
}

function switchRole(role) {
  STATE.user.role = role;
  STATE.user.name = role === 'owner' ? 'Anika Rao' : 'Rajesh Kumar';
  STATE.user.initials = role === 'owner' ? 'AR' : 'RK';
  STATE.user.email = role === 'owner' ? 'owner@qrdine.demo' : 'manager@qrdine.demo';

  // Update top bar labels
  $('#user-name').textContent = STATE.user.name;
  $('#user-role').textContent = STATE.user.role;
  $('#user-avatar').textContent = STATE.user.initials;
  $('#sidebar-avatar').textContent = STATE.user.initials[0];
  $('#sidebar-name').textContent = role === 'owner' ? 'Owner Desk' : 'Manager Desk';
  $('#top-role-label').textContent = role === 'owner' ? 'Owner Desk (Full Access)' : 'Manager Desk (Ops & Approvals)';

  renderSidebar();
  navigate(STATE.currentPage);

  showToast(`Active Role: ${role === 'owner' ? '👑 Owner (Super Admin)' : '👔 Manager (Operations Admin)'}`, 'warning');
}

// ===================================================================
// 5. INDIAN STATUTORY PAYROLL ENGINE (Zero-Bug Section 5.4 & 12.1)
// ===================================================================

/**
 * Zero-Bug Indian Payroll Rules:
 * 1. PF calculated strictly on Basic + DA (12%). Basic must be >= 50% of gross!
 * 2. ESI applies strictly when monthly gross <= ₹21,000 (0.75% EE, 3.25% ER).
 * 3. Overtime: Mandatory 2x multiplier: (Basic / 26 / 8) * OT Hours * 2.0
 * 4. Absence deduction: (Basic / 26) * Unapproved Absent Days
 */
function calcIndianPayroll(staff, yearMonth) {
  if (!staff) {
    return { basic: 0, da: 0, hra: 0, gross: 0, otHours: 0, otPay: 0, basicCompliant: true, pfWageBase: 0, pfEmployee: 0, pfEmployer: 0, esiEmployee: 0, esiEmployer: 0, tds: 0, absenceDeduction: 0, totalDeductions: 0, netPayable: 0, presentDays: 0, leaveDays: 0, absentDays: 0, totalHoursWorked: 0 };
  }
  const basic = Number(staff.basicMonthly) || (Number(staff.rate || 180) * 26 * 8) || 12000;
  const da = Number(staff.daMonthly) || Math.round(basic * 0.15);
  const hra = Number(staff.hraMonthly) || Math.round(basic * 0.25);
  
  // Calculate attendance metrics from real attendance records
  const ym = yearMonth || new Date().toISOString().slice(0, 7);
  let attList = [];
  if (typeof STATE !== 'undefined' && Array.isArray(STATE.attendance)) {
    attList = STATE.attendance.filter(a => String(a.staff_id) === String(staff.id) && String(a.date).startsWith(ym));
  }

  let presentDays = 0;
  let leaveDays = 0;
  let absentDays = 0;
  let totalHoursWorked = 0;
  let computedOtHours = Number(staff.otHours) || 0;

  if (attList.length > 0) {
    absentDays = 0;
    attList.forEach(a => {
      if (a.status === 'present') {
        presentDays++;
        totalHoursWorked += 8;
      } else if (a.status === 'leave') {
        leaveDays++;
      } else if (a.status === 'absent') {
        absentDays++;
      }
    });
  } else {
    absentDays = Number(staff.unapprovedAbsences) || 0;
    presentDays = Math.max(0, 26 - absentDays);
    totalHoursWorked = Number(staff.hoursWorked) || (presentDays * 8);
  }

  // Statutory wage base:
  const pfWageBase = basic + da;
  
  // Overtime at 2x rate
  const otHours = computedOtHours;
  const hourlyBase = (basic / 26 / 8);
  const otPay = Math.round(hourlyBase * otHours * 2.0); // 2.0x mandatory in India

  // Gross Pay
  const gross = basic + da + hra + otPay;

  // Basic >= 50% of gross compliance check
  const basicCompliant = (basic + da) >= (gross * 0.5);

  // PF Deduction (12% of Basic + DA)
  const pfEmployee = staff.pfApplicable !== false ? Math.round(pfWageBase * 0.12) : 0;
  const pfEmployer = staff.pfApplicable !== false ? Math.round(pfWageBase * 0.12) : 0;

  // ESI Deduction: Strict ceiling check: if gross > ₹21,000, ESI = ₹0
  let esiEmployee = 0;
  let esiEmployer = 0;
  if (staff.esiApplicable !== false && gross <= 21000) {
    esiEmployee = Math.round(gross * 0.0075);
    esiEmployer = Math.round(gross * 0.0325);
  }

  // Absence deductions calculated from real absent days (or unapproved absences)
  const absenceDeduction = Math.round((basic / 26) * absentDays);

  // TDS projected estimate
  const annualGross = gross * 12;
  let tds = 0;
  if (annualGross > 300000) {
    tds = Math.round((annualGross - 300000) * 0.05 / 12);
  }

  const totalDeductions = pfEmployee + esiEmployee + tds + absenceDeduction;
  const netPayable = Math.max(0, gross - totalDeductions);

  return {
    basic,
    da,
    hra,
    gross,
    otHours,
    otPay,
    basicCompliant,
    pfWageBase,
    pfEmployee,
    pfEmployer,
    esiEmployee,
    esiEmployer,
    tds,
    absenceDeduction,
    totalDeductions,
    netPayable,
    presentDays,
    leaveDays,
    absentDays,
    totalHoursWorked
  };
}

// ===================================================================
// 6. BCG MENU ENGINEERING MATRIX (Section 8.2)
// ===================================================================

function calcMenuBCG(item) {
  const margin = item.dineIn - item.cost;
  const marginPct = Number(((margin / item.dineIn) * 100).toFixed(1));
  const foodCostPct = Number(((item.cost / item.dineIn) * 100).toFixed(1));

  const isPopular = item.sales30 >= 350;
  const isHighMargin = marginPct >= 65;

  let quadrant = 'Dog';
  let badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
  let advice = 'Low Profit, Low Sales. Consider removing or reformulating.';

  if (isPopular && isHighMargin) {
    quadrant = 'Star';
    badgeColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    advice = 'High Profit, High Sales. Keep prominent on menu and maintain standard recipe.';
  } else if (isPopular && !isHighMargin) {
    quadrant = 'Plowhorse';
    badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    advice = 'Low Profit, High Sales. High food cost! Renegotiate raw materials or increase price slightly.';
  } else if (!isPopular && isHighMargin) {
    quadrant = 'Puzzle';
    badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    advice = 'High Profit, Low Sales. Good margin! Needs better placement, waiter recommendations, or photography.';
  }

  return {
    quadrant,
    margin,
    marginPct,
    foodCostPct,
    badgeColor,
    advice,
    isPopular,
    isHighMargin
  };
}

// ===================================================================
// 7. COMMON PAGE HEADER & SVG ICONS
// ===================================================================

function pageHeader(title, subtitle, actions = '') {
  return `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div class="text-[11px] font-semibold text-saffron-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span>QR DINE ENTERPRISE OPS</span>
          <span class="text-gray-600">/</span>
          <span class="text-gray-400">${STATE.user.role.toUpperCase()} CONSOLE</span>
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">${title}</h1>
        <p class="text-xs text-gray-400 mt-1">${subtitle}</p>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap">${actions}</div>
    </div>
  `;
}

function icon(name) {
  const icons = {
    grid: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    live: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    users: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
    calendar: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    box: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
    menu: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
    table: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    recon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    settings: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    lock: `<svg class="w-3.5 h-3.5 inline text-amber-400 ml-1 cursor-pointer hover:scale-110 transition" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>`
  };
  return icons[name] || '';
}

// Initial backdrop listeners
document.addEventListener('DOMContentLoaded', () => {
  const modalRoot = $('#modal-root');
  if (modalRoot) {
    modalRoot.addEventListener('click', e => {
      if (e.target.id === 'modal-root') closeModal();
    });
  }

  const slideBackdrop = $('#slideover-backdrop');
  if (slideBackdrop) {
    slideBackdrop.addEventListener('click', e => {
      if (e.target.id === 'slideover-backdrop') closeSlideOver();
    });
  }
});
