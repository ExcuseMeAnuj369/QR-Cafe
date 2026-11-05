/**
 * ===================================================================
 * QR DINE — CENTRAL API CLIENT & REAL-TIME STATE SYNCHRONIZER
 * Connects Owner Console with Unified Backend & Staff Operations
 * ===================================================================
 */

const API = {
  baseUrl: window.location.origin,

  async fetchState() {
    try {
      const res = await fetch(`${this.baseUrl}/api/state`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('API fetchState warning:', err);
      return null;
    }
  },

  async addStaff(staffData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      return await res.json();
    } catch (err) {
      console.error('API addStaff error:', err);
      return { success: false, error: err.message };
    }
  },

  async updateStaff(staffId, staffData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      return await res.json();
    } catch (err) {
      console.error('API updateStaff error:', err);
      return { success: false, error: err.message };
    }
  },

  async cancelOrderItem(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/cancel-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('API cancelOrderItem error:', err);
      return { success: false, error: err.message };
    }
  },

  async overrideAttendance(staffId, status, checkIn, reason, date) {
    try {
      const res = await fetch(`${this.baseUrl}/api/attendance/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, status, checkIn, reason, date })
      });
      return await res.json();
    } catch (err) {
      console.error('API overrideAttendance error:', err);
      return { success: false, error: err.message };
    }
  },

  async updateLeave(leaveId, status) {
    try {
      const res = await fetch(`${this.baseUrl}/api/leaves/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      console.error('API updateLeave error:', err);
      return { success: false, error: err.message };
    }
  },

  async payBill(billData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });
      return await res.json();
    } catch (err) {
      console.error('API payBill error:', err);
      return { success: false, error: err.message };
    }
  },

  async addPettyCash(entry) {
    try {
      const res = await fetch(`${this.baseUrl}/api/petty-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return await res.json();
    } catch (err) {
      console.error('API addPettyCash error:', err);
      return { success: false, error: err.message };
    }
  },

  async deletePettyCash(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/petty-cash/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('API deletePettyCash error:', err);
      return { success: false, error: err.message };
    }
  },

  async updateApproval(id, status) {
    try {
      const res = await fetch(`${this.baseUrl}/api/approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      console.error('API updateApproval error:', err);
      return { success: false, error: err.message };
    }
  },

  // Map backend orders into STATE.kitchenOrders format
  mapOrdersToKitchen(orders) {
    if (!Array.isArray(orders)) return [];
    return orders.map(o => {
      const elapsedMin = Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000));
      const formattedStatus = o.status === 'new' ? 'New' :
                              o.status === 'preparing' ? 'Preparing' :
                              o.status === 'ready' ? 'Ready' :
                              (o.status.charAt(0).toUpperCase() + o.status.slice(1));
      const itemStrings = (o.items || []).map(i => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`);
      return {
        id: o.id,
        table: o.table_number || `T-${o.token}`,
        items: itemStrings,
        status: formattedStatus,
        timeElapsedMin: elapsedMin,
        source: o.waiter_name ? `Waiter (${o.waiter_name})` : (o.is_rush ? 'Rush KOT' : 'Staff Ops Waiter')
      };
    });
  },

  // Map backend requests into STATE.waiterRequests format
  mapRequests(requests) {
    if (!Array.isArray(requests)) return [];
    return requests.map(r => {
      const elapsedMin = Math.max(0, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000));
      const isFood = !!r.is_food;
      let reqTitle = r.type || 'Service Request';
      if (isFood && Array.isArray(r.food_items) && r.food_items.length > 0) {
        const itemSummary = r.food_items.map(i => `${i.qty}× ${i.name}`).join(', ');
        reqTitle = `🍽️ Food Re-Order: ${itemSummary}${r.total ? ` (₹${r.total})` : ''}`;
      }
      return {
        id: r.id,
        table: r.table_number || r.table_id || 'Table',
        request: reqTitle,
        time: `${elapsedMin} min ago`,
        waiter: r.waiter || 'Assigned Staff',
        status: r.status,
        is_food: isFood,
        food_items: r.food_items || []
      };
    });
  },

  // Apply state snapshot to STATE
  applyState(data) {
    if (!data) return;

    if (Array.isArray(data.staff) && data.staff.length > 0) {
      STATE.staff = data.staff;
    }

    if (Array.isArray(data.orders)) {
      STATE.kitchenOrders = this.mapOrdersToKitchen(data.orders);
    }

    if (Array.isArray(data.requests)) {
      STATE.waiterRequests = this.mapRequests(data.requests);
    }

    if (Array.isArray(data.tables)) {
      STATE.tables = data.tables.map(t => {
        const rawStatus = (t.status || 'free').toLowerCase();
        let normalizedStatus = 'Free';
        if (rawStatus === 'occupied') normalizedStatus = 'Occupied';
        else if (rawStatus === 'billing-pending' || rawStatus === 'billing pending') normalizedStatus = 'Billing Pending';
        else if (rawStatus === 'cleaning') normalizedStatus = 'Cleaning';
        return {
          ...t,
          status: normalizedStatus
        };
      });
    }

    if (Array.isArray(data.leaves)) {
      STATE.leaves = data.leaves;
    }

    if (Array.isArray(data.attendance)) {
      STATE.attendance = data.attendance;
    }

    if (Array.isArray(data.bills)) {
      STATE.bills = data.bills;
    }

    if (Array.isArray(data.pettyCash)) {
      STATE.pettyCash = data.pettyCash;
    }

    if (Array.isArray(data.approvals)) {
      STATE.approvals = data.approvals;
    }

    if (data.financials) {
      STATE.financials.todayRevenue = data.financials.todayRevenue || STATE.financials.todayRevenue;
      if (data.financials.collections) {
        STATE.financials.collections = data.financials.collections;
      }
      if (data.financials.expectedCash !== undefined) {
        STATE.financials.expectedCash = data.financials.expectedCash;
      }
      if (data.financials.actualDrawerCash !== undefined) {
        STATE.financials.actualDrawerCash = data.financials.actualDrawerCash;
      }
    }
  },

  // Start real-time background sync loop (every 2.5s)
  syncInterval: null,
  startLiveSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Initial fetch
    this.fetchState().then(data => {
      if (data) {
        this.applyState(data);
        renderSidebar();
        if (typeof renderStaffSubTab === 'function' && STATE.currentPage === 'staff') {
          renderStaffSubTab();
        }
        if (typeof renderActiveLiveTab === 'function' && STATE.currentPage === 'live') {
          renderActiveLiveTab();
        }
        if (typeof renderAttendanceSubTabContent === 'function' && STATE.currentPage === 'attendance') {
          renderAttendanceSubTabContent();
        }
        if (typeof renderFinancialsSubTabContent === 'function' && STATE.currentPage === 'financials') {
          renderFinancialsSubTabContent();
        }
      }
    });

    this.syncInterval = setInterval(async () => {
      const data = await this.fetchState();
      if (!data) return;

      this.applyState(data);

      // Only refresh DOM if user is viewing that specific section and modal is not open
      const modal = document.getElementById('modal-container');
      const isModalOpen = modal && !modal.classList.contains('hidden');

      if (!isModalOpen) {
        if (STATE.currentPage === 'live' && typeof renderActiveLiveTab === 'function') {
          renderActiveLiveTab();
        } else if (STATE.currentPage === 'staff' && typeof renderStaffSubTab === 'function') {
          const searchInput = document.getElementById('staff-search-input');
          if (!searchInput || searchInput !== document.activeElement) {
            renderStaffSubTab();
          }
        } else if (STATE.currentPage === 'attendance' && typeof renderAttendanceSubTabContent === 'function') {
          const badge = document.querySelector('#att-tab-leaves');
          if (badge) {
            badge.textContent = `Leave Approvals (${STATE.leaves.filter(l => l.status === 'Pending').length})`;
          }
        } else if (STATE.currentPage === 'financials' && typeof renderFinancialsSubTabContent === 'function') {
          renderFinancialsSubTabContent();
        }
      }
    }, 2500);
  }
};
