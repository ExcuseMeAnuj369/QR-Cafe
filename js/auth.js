/**
 * ===================================================================
 * QR-Cafe — AUTHENTICATION & SESSION MANAGEMENT
 * Super Admin (Owner) vs Operations Admin (Manager)
 * ===================================================================
 */

function selectDemoAccount(role) {
  const emailInput = $('#login-email');
  const passInput = $('#login-password');
  const ownerBtn = $('#login-role-owner-btn');
  const mgrBtn = $('#login-role-manager-btn');

  if (role === 'owner') {
    if (emailInput) emailInput.value = 'owner@qr-cafe.demo';
    if (passInput) passInput.value = 'owner123';
    if (ownerBtn) {
      ownerBtn.className = 'py-2.5 px-3 rounded-lg border border-saffron-500/40 bg-saffron-500/10 text-saffron-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition';
    }
    if (mgrBtn) {
      mgrBtn.className = 'py-2.5 px-3 rounded-lg border border-white/10 bg-dark-700/50 text-gray-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:text-white';
    }
  } else {
    if (emailInput) emailInput.value = 'manager@qr-cafe.demo';
    if (passInput) passInput.value = 'manager123';
    if (mgrBtn) {
      mgrBtn.className = 'py-2.5 px-3 rounded-lg border border-saffron-500/40 bg-saffron-500/10 text-saffron-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition';
    }
    if (ownerBtn) {
      ownerBtn.className = 'py-2.5 px-3 rounded-lg border border-white/10 bg-dark-700/50 text-gray-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:text-white';
    }
  }
}

function applyUserSession(user, skipToast = false) {
  STATE.user = user;

  // Toggle screens
  const loginScr = $('#login-screen');
  const appScr = $('#app');
  if (loginScr) loginScr.classList.add('hidden');
  if (appScr) appScr.classList.remove('hidden');

  // Update header & badges
  const userNameEl = $('#user-name');
  if (userNameEl) userNameEl.textContent = user.name;
  const userRoleEl = $('#user-role');
  if (userRoleEl) userRoleEl.textContent = user.role;
  const userAvatarEl = $('#user-avatar');
  if (userAvatarEl) userAvatarEl.textContent = user.initials;
  const sideAvatarEl = $('#sidebar-avatar');
  if (sideAvatarEl) sideAvatarEl.textContent = user.initials[0];
  const sideNameEl = $('#sidebar-name');
  if (sideNameEl) sideNameEl.textContent = user.role === 'owner' ? 'Owner Desk' : 'Manager Desk';
  const topRoleEl = $('#top-role-label');
  if (topRoleEl) topRoleEl.textContent = user.role === 'owner' ? 'Owner Desk (Full Access)' : 'Manager Desk (Ops & Approvals)';
  const topDateEl = $('#top-date');
  if (topDateEl && typeof todayStr === 'function') topDateEl.textContent = todayStr();

  // Highlight active role in top switcher
  const ownerBtn = $('#role-btn-owner');
  const mgrBtn = $('#role-btn-manager');
  if (user.role === 'owner') {
    if (ownerBtn) ownerBtn.className = 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-saffron-500 text-black transition';
    if (mgrBtn) mgrBtn.className = 'px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-400 hover:text-white transition';
  } else {
    if (mgrBtn) mgrBtn.className = 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-saffron-500 text-black transition';
    if (ownerBtn) ownerBtn.className = 'px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-400 hover:text-white transition';
  }

  if (typeof renderSidebar === 'function') renderSidebar();
  if (typeof navigate === 'function') navigate(STATE.currentPage || 'dashboard');
  if (typeof startCountdown === 'function') startCountdown();

  if (!skipToast && typeof showToast === 'function') {
    showToast(`Signed in as ${user.name} (${user.role.toUpperCase()})`, 'success');
  }
}

function switchRole(role) {
  let user = null;
  if (role === 'owner') {
    user = { name: 'Anika Rao', role: 'owner', initials: 'AR', email: 'owner@qr-cafe.demo' };
  } else {
    user = { name: 'Rajesh Kumar', role: 'manager', initials: 'RK', email: 'manager@qr-cafe.demo' };
  }
  applyUserSession(user);
}

function initAuthSession() {
  // Always show the secure login screen on initial application load
  const loginScr = $('#login-screen');
  const appScr = $('#app');
  if (loginScr) loginScr.classList.remove('hidden');
  if (appScr) appScr.classList.add('hidden');
}

function login(e) {
  if (e) e.preventDefault();

  const emailInput = $('#login-email');
  const passInput = $('#login-password');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const pass = passInput ? passInput.value : '';

  let user = null;
  if (email === 'owner@qr-cafe.demo' && pass === 'owner123') {
    user = { name: 'Anika Rao', role: 'owner', initials: 'AR', email };
  } else if (email === 'manager@qr-cafe.demo' && pass === 'manager123') {
    user = { name: 'Rajesh Kumar', role: 'manager', initials: 'RK', email };
  } else {
    showToast('Invalid credentials. Please enter correct password or click Owner/Manager demo options.', 'error');
    return;
  }

  applyUserSession(user);
}

function logout() {
  STATE.user = null;
  const appScr = $('#app');
  const loginScr = $('#login-screen');
  if (appScr) appScr.classList.add('hidden');
  if (loginScr) loginScr.classList.remove('hidden');
  
  const passInput = $('#login-password');
  if (passInput) passInput.value = '';
  
  showToast('Logged out of session', 'warning');
}
