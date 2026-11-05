/**
 * ===================================================================
 * QR DINE — APPLICATION CORE ROUTER & NAVIGATION
 * Manages 9 Master Sections, Role Permissions & Live Shift Timers
 * ===================================================================
 */

const PAGES = {
  dashboard: (el) => typeof renderDashboard === 'function' && renderDashboard(el),
  live: (el) => typeof renderLive === 'function' && renderLive(el),
  staff: (el) => typeof renderStaff === 'function' && renderStaff(el),
  attendance: (el) => typeof renderAttendance === 'function' && renderAttendance(el),
  inventory: (el) => typeof renderInventory === 'function' && renderInventory(el),
  menu: (el) => typeof renderMenu === 'function' && renderMenu(el),
  tables: (el) => typeof renderTables === 'function' && renderTables(el),
  financials: (el) => typeof renderFinancials === 'function' && renderFinancials(el),
  settings: (el) => typeof renderSettings === 'function' && renderSettings(el),
};

function renderSidebar() {
  const nav = $('#sidebar-nav');
  if (!nav || !STATE.user) return;

  const role = STATE.user.role;

  nav.innerHTML = NAV_ITEMS.map(item => {
    const badge = item.badge ? item.badge() : 0;
    const isActive = STATE.currentPage === item.id;
    const isOwnerRestricted = item.access === 'OWNER_ONLY' && role !== 'owner' && !isOwner();

    return `
      <button onclick="handleNavClick('${item.id}', '${item.access}')"
              class="sidebar-item w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-400 transition ${isActive ? 'active' : ''}"
              data-page="${item.id}">
        <span class="shrink-0">${icon(item.icon)}</span>
        <span class="flex-1 truncate">${item.label}</span>
        ${isOwnerRestricted ? `<span title="Owner Only - Requires PIN">${icon('lock')}</span>` : ''}
        ${badge > 0 ? `<span class="badge-count">${badge}</span>` : ''}
      </button>
    `;
  }).join('');
}

function handleNavClick(pageId, access) {
  if (access === 'OWNER_ONLY' && STATE.user.role !== 'owner' && !isOwner()) {
    requestOwnerOverride(`Section: ${pageId.toUpperCase()}`, () => {
      navigate(pageId);
    });
    return;
  }
  navigate(pageId);
}

function navigate(page) {
  STATE.currentPage = page;
  renderSidebar();

  const main = $('#main-content');
  if (!main) return;

  main.innerHTML = '';

  if (PAGES[page]) {
    PAGES[page](main);
  } else {
    main.innerHTML = `<div class="p-8 text-gray-500">Page under construction: ${page}</div>`;
  }
}

// Shift Countdown & Override Expiry Timer
let countdownInterval = null;
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  let secs = 4 * 3600 + 12 * 60 + 36;
  countdownInterval = setInterval(() => {
    secs--;
    if (secs < 0) secs = 0;
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    const el = $('#shift-countdown');
    if (el) el.textContent = `${h}:${m}:${s}`;

    // Check active Owner Override expiry
    const badge = $('#top-override-badge');
    if (badge) {
      if (STATE.ownerOverrideUntil && Date.now() < STATE.ownerOverrideUntil) {
        const remainingSec = Math.ceil((STATE.ownerOverrideUntil - Date.now()) / 1000);
        const remMin = Math.floor(remainingSec / 60);
        const remSec = remainingSec % 60;
        badge.classList.remove('hidden');
        badge.textContent = `🔓 Override Active (${remMin}:${String(remSec).padStart(2, '0')})`;
      } else {
        badge.classList.add('hidden');
        STATE.ownerOverrideUntil = null;
      }
    }
  }, 1000);
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', login);
  }
  if (typeof initAuthSession === 'function') {
    initAuthSession();
  }
  if (typeof API !== 'undefined' && API.startLiveSync) {
    API.startLiveSync();
  }
});
