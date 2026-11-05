import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  Staff, Theme, Toast, Table, Order, MenuItem, CustomerRequest,
  Group, Bill, AttendanceRecord, LeaveRequest, PettyCash, OrderStatus,
  NotificationQueueItem, WastageRecord, ReceiptVerificationResult,
  DayCloseRecord, TableTransferRequest, Role
} from '../types';
import {
  STAFF, TABLES, ORDERS, MENU, REQUESTS, GROUPS, BILLS,
  ATTENDANCE, LEAVE_REQUESTS, PETTY_CASH
} from '../data/mock';
import { playSound } from '../utils/sound';

interface AppContextType {
  user: Staff | null;
  theme: Theme;
  soundEnabled: boolean;
  toasts: Toast[];
  tables: Table[];
  orders: Order[];
  menu: MenuItem[];
  requests: CustomerRequest[];
  groups: Group[];
  bills: Bill[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  pettyCash: PettyCash[];
  notificationQueue: NotificationQueueItem[];
  wastageLogs: WastageRecord[];
  transferRequests: TableTransferRequest[];
  dayCloseRecords: DayCloseRecord[];

  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  setPettyCash: React.Dispatch<React.SetStateAction<PettyCash[]>>;
  setDayCloseRecords: React.Dispatch<React.SetStateAction<DayCloseRecord[]>>;

  login: (staffId: string, pin: string, role: Staff['role']) => boolean;
  logout: () => void;
  setTheme: (t: Theme) => void;
  toggleSound: () => void;
  addToast: (type: Toast['type'], message: string) => void;
  pushNotification: (eventType: string, payload: any, targetRole?: Role | 'manager') => void;
  overrideAttendance: (staffId: string, status: string, checkIn?: string, reason?: string) => Promise<void>;

  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemId: string, status: OrderStatus) => void;
  toggleRush: (orderId: string) => void;

  claimTable: (tableId: string) => void;
  freeTable: (tableId: string) => void;
  requestTableTransfer: (tableId: string, toWaiterId: string) => void;
  respondTableTransfer: (requestId: string, accept: boolean) => void;

  acceptRequest: (reqId: string) => void;
  doneRequest: (reqId: string) => void;

  updateStock: (menuId: string, stock: number) => void;
  toggleSoldOut: (menuId: string) => void;
  logWastage: (menuId: string, qty: number, reason: WastageRecord['reason']) => void;

  payBill: (billId: string, method: string, phone?: string) => void;
  checkIn: () => void;
  checkOut: () => void;
  breakIn: () => void;
  breakOut: () => void;

  submitLeave: (data: Omit<LeaveRequest, 'id' | 'staff_id' | 'status' | 'created_at'>) => void;
  cannotMake: (orderId: string, itemId: string, reason: string) => void;

  addOrderItem: (tableId: string, item: { menu_id: string; name: string; qty: number; price: number; seat_no: number; station: string }) => void;
  cancelOrderItem: (orderId: string, itemId: string, reason?: string) => Promise<boolean>;
  linkTables: (tableIds: string[], primaryId: string, billingPref: 'separate' | 'combined') => void;
  unlinkGroup: (groupId: string) => void;
  staffList: Staff[];
}

const AppContext = createContext<AppContextType | null>(null);

export const API_BASE = typeof window !== 'undefined' && window.location.port === '3000'
  ? `${window.location.origin}/api`
  : 'http://localhost:3000/api';
const STORAGE_PREFIX = 'QR-Cafe_ops_v1_';

export function normalizeStaffRole(rawRole?: string, staffRole?: string): Role {
  const sRole = (staffRole || '').toLowerCase();
  if (sRole === 'kitchen' || sRole === 'waiter' || sRole === 'accountant') {
    return sRole as Role;
  }
  const combined = (sRole + ' ' + (rawRole || '')).toLowerCase();
  if (combined.includes('kitchen') || combined.includes('cook') || combined.includes('chef') || combined.includes('pantry')) return 'kitchen';
  if (combined.includes('waiter') || combined.includes('server') || combined.includes('captain') || combined.includes('steward')) return 'waiter';
  if (combined.includes('accountant') || combined.includes('cashier') || combined.includes('bill') || combined.includes('accounts')) return 'accountant';
  return 'waiter';
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(() => loadStorage('user', null));
  const [staffList, setStaffList] = useState<Staff[]>(() => loadStorage('staffList', STAFF));
  const [theme, setThemeState] = useState<Theme>(() => loadStorage('theme', 'dark'));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadStorage('sound', true));
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [tables, setTables] = useState<Table[]>(() => loadStorage('tables', TABLES));
  const [orders, setOrders] = useState<Order[]>(() => loadStorage('orders', ORDERS));
  const [menu, setMenu] = useState<MenuItem[]>(() => loadStorage('menu', MENU));
  const [requests, setRequests] = useState<CustomerRequest[]>(() => loadStorage('requests', REQUESTS));
  const [groups, setGroups] = useState<Group[]>(() => loadStorage('groups', GROUPS));
  const [bills, setBills] = useState<Bill[]>(() => loadStorage('bills', BILLS));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStorage('attendance', ATTENDANCE));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadStorage('leave', LEAVE_REQUESTS));
  const [pettyCash, setPettyCash] = useState<PettyCash[]>(() => loadStorage('pettyCash', PETTY_CASH));

  const [notificationQueue, setNotificationQueue] = useState<NotificationQueueItem[]>(() => loadStorage('notifQueue', []));
  const [wastageLogs, setWastageLogs] = useState<WastageRecord[]>(() => loadStorage('wastage', []));
  const [transferRequests, setTransferRequests] = useState<TableTransferRequest[]>(() => loadStorage('transfers', []));
  const [dayCloseRecords, setDayCloseRecords] = useState<DayCloseRecord[]>(() => loadStorage('dayClose', []));

  // Auto-sync storage
  useEffect(() => saveStorage('user', user), [user]);
  useEffect(() => saveStorage('theme', theme), [theme]);
  useEffect(() => saveStorage('sound', soundEnabled), [soundEnabled]);
  useEffect(() => saveStorage('tables', tables), [tables]);
  useEffect(() => saveStorage('orders', orders), [orders]);
  useEffect(() => saveStorage('menu', menu), [menu]);
  useEffect(() => saveStorage('requests', requests), [requests]);
  useEffect(() => saveStorage('groups', groups), [groups]);
  useEffect(() => saveStorage('bills', bills), [bills]);
  useEffect(() => saveStorage('attendance', attendance), [attendance]);
  useEffect(() => saveStorage('leave', leaveRequests), [leaveRequests]);
  useEffect(() => saveStorage('pettyCash', pettyCash), [pettyCash]);
  useEffect(() => saveStorage('staffList', staffList), [staffList]);
  useEffect(() => saveStorage('notifQueue', notificationQueue), [notificationQueue]);
  useEffect(() => saveStorage('wastage', wastageLogs), [wastageLogs]);
  useEffect(() => saveStorage('transfers', transferRequests), [transferRequests]);
  useEffect(() => saveStorage('dayClose', dayCloseRecords), [dayCloseRecords]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Real-time synchronization with Owner/Manager Central Backend
  useEffect(() => {
    const fetchRemoteState = async () => {
      try {
        const res = await fetch(`${API_BASE}/state`);
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.staff) && data.staff.length > 0) {
          setStaffList(data.staff);
          setUser(prev => {
            if (!prev) return null;
            const updated = data.staff.find((s: any) => String(s.id) === String(prev.id));
            if (!updated) return prev;
            // CRITICAL: Preserve and enforce strict lowercase role enum ('kitchen' | 'waiter' | 'accountant')
            // Do NOT allow uppercase or title strings from db.json like 'Waiter' or 'Kitchen' to break Sidebar routing
            const enforcedRole = normalizeStaffRole(updated.role, (updated as any).staffRole || prev.role);
            return {
              ...prev,
              ...updated,
              role: enforcedRole
            };
          });
        }
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
        if (Array.isArray(data.requests)) {
          setRequests(data.requests);
        }
        if (Array.isArray(data.tables)) {
          setTables(data.tables);
        }
        if (Array.isArray(data.attendance)) {
          setAttendance(data.attendance);
        }
        if (Array.isArray(data.leaves)) {
          setLeaveRequests(data.leaves);
        }
        if (Array.isArray(data.bills)) {
          setBills(data.bills);
        }
        if (Array.isArray(data.pettyCash)) {
          setPettyCash(data.pettyCash);
        }
      } catch (err) {
        // Fallback gracefully to local mock if server offline
      }
    };

    fetchRemoteState();
    const interval = setInterval(fetchRemoteState, 2500);
    return () => clearInterval(interval);
  }, []);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const pushNotification = useCallback((eventType: string, payload: any, targetRole: Role | 'manager' = 'manager') => {
    const item: NotificationQueueItem = {
      id: `nq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event_type: eventType,
      payload,
      target_role: targetRole,
      created_at: new Date().toISOString(),
      status: 'pending',
    };
    setNotificationQueue(prev => [item, ...prev]);
  }, []);

  // Manager override attendance API helper
  const overrideAttendance = async (staffId: string, status: string, checkIn?: string, reason?: string, date?: string) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, status, check_in: checkIn, reason, date }),
      });
      if (!res.ok) throw new Error('Attendance override failed');
      addToast('success', 'Attendance overridden');
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to override attendance');
    }
  };

  const login = useCallback((staffId: string, pin: string, preferredRole?: Staff['role']) => {
    const pool = [...staffList, ...STAFF];
    // Find staff member by ID and PIN
    const staff = pool.find(s => String(s.id).trim() === String(staffId).trim() && String(s.pin).trim() === String(pin).trim());

    if (staff) {
      const normalizedRole = normalizeStaffRole(staff.role, (staff as any).staffRole || preferredRole);
      const normalizedUser: Staff = {
        ...(staff as any),
        id: String(staff.id),
        name: staff.name,
        role: normalizedRole,
        pin: String(staff.pin),
        zone: staff.zone || 'A',
        rating: (staff as any).rating || 4.8
      };
      setUser(normalizedUser);
      addToast('success', `Welcome, ${staff.name} (${normalizedRole.toUpperCase()})`);
      return true;
    }
    addToast('error', 'Invalid Staff ID or PIN');
    return false;
  }, [staffList, addToast]);

  const logout = useCallback(() => {
    setUser(null);
    addToast('info', 'Logged out');
  }, [addToast]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleSound = useCallback(() => setSoundEnabled(s => !s), []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    // Sync status to backend
    fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map(i => ({ ...i, status }));
      return { ...o, status, items: updatedItems };
    }));

    const targetOrder = orders.find(o => o.id === orderId);

    if (status === 'ready') {
      addToast('success', `Order ${orderId} ready for pickup`);
      if (soundEnabled) playSound('order_ready');
      pushNotification('order_ready', { orderId }, 'waiter');
    } else if (status === 'preparing') {
      addToast('info', `Order ${orderId} preparation started`);
    } else if (status === 'served' && targetOrder) {
      addToast('success', `Order ${orderId} served`);
      pushNotification('order_served', { orderId, tableId: targetOrder.table_id }, 'accountant');

      // Auto-create bill if not already existing for this session
      setBills(prev => {
        const existing = prev.find(b => b.session_id === targetOrder.session_id);
        if (existing) return prev;

        const subtotal = targetOrder.total;
        const cgst = Number((subtotal * 0.025).toFixed(2));
        const sgst = Number((subtotal * 0.025).toFixed(2));
        const newBill: Bill = {
          id: `b-${Date.now()}`,
          session_id: targetOrder.session_id,
          table_id: targetOrder.table_id,
          table_number: targetOrder.table_number,
          token: targetOrder.token,
          group_id: targetOrder.group_id,
          subtotal,
          cgst,
          sgst,
          discount: 0,
          total: subtotal + cgst + sgst,
          status: 'pending',
          created_at: new Date().toISOString(),
          scan_count: 0,
        };
        return [newBill, ...prev];
      });
    }
  }, [addToast, soundEnabled, pushNotification, orders]);

  const updateItemStatus = useCallback((orderId: string, itemId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const items = o.items.map(i => i.id === itemId ? { ...i, status } : i);
      const allReady = items.every(i => i.status === 'ready' || i.status === 'served');
      return { ...o, items, status: allReady ? 'ready' : o.status };
    }));
  }, []);

  const toggleRush = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_rush: !o.is_rush } : o));
    pushNotification('rush_toggled', { orderId }, 'kitchen');
  }, [pushNotification]);

  const claimTable = useCallback((tableId: string) => {
    if (!user) return;
    const userTablesCount = tables.filter(t => t.assigned_waiter_id === user.id).length;
    if (userTablesCount >= 8) {
      addToast('error', 'Max 8 tables per waiter limit reached');
      return;
    }

    setTables(prev => prev.map(t => {
      if (t.id !== tableId && t.table_number !== tableId) return t;
      if (t.assigned_waiter_id && t.assigned_waiter_id !== user.id) {
        addToast('error', 'Table already claimed by another waiter');
        return t;
      }
      return {
        ...t,
        assigned_waiter_id: user.id,
        status: 'occupied' as const,
        current_session_id: t.current_session_id || `sess-${Date.now()}`
      };
    }));

    // Real-time backend sync so Owner Panel and DB immediately see assigned waiter
    fetch(`${API_BASE}/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', waiter_id: user.id, waiter_name: user.name })
    }).catch(err => console.warn('Table claim sync warning:', err));

    addToast('success', 'Table claimed successfully');
    pushNotification('table_claimed', { tableId, waiterId: user.id }, 'manager');
  }, [user, tables, addToast, pushNotification]);

  const freeTable = useCallback((tableId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId && t.table_number !== tableId) return t;
      const nextToken = t.current_token >= 999 ? 1 : t.current_token + 1;
      return {
        ...t,
        status: 'free' as const,
        assigned_waiter_id: null,
        current_session_id: null,
        current_token: nextToken,
        group_id: null,
      };
    }));

    // Real-time backend sync so Owner Panel and DB immediately see table released
    fetch(`${API_BASE}/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'free' })
    }).catch(err => console.warn('Table free sync warning:', err));

    addToast('success', 'Table freed and reset for next session');
    pushNotification('table_freed', { tableId }, 'manager');
  }, [addToast, pushNotification]);

  const requestTableTransfer = useCallback((tableId: string, toWaiterId: string) => {
    if (!user) return;
    const table = tables.find(t => t.id === tableId || t.table_number === tableId);
    const toStaff = [...staffList, ...STAFF].find(s => String(s.id) === String(toWaiterId));
    if (!table || !toStaff) return;

    const req: TableTransferRequest = {
      id: `tr-${Date.now()}`,
      table_id: table.id,
      table_number: table.table_number,
      from_waiter_id: user.id,
      from_waiter_name: user.name,
      to_waiter_id: toWaiterId,
      to_waiter_name: toStaff.name,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setTransferRequests(prev => [req, ...prev]);
    addToast('info', `Transfer request sent to ${toStaff.name}`);
    pushNotification('table_transfer_requested', { tableId: table.id, from: user.id, to: toWaiterId }, 'waiter');
  }, [user, tables, staffList, addToast, pushNotification]);

  const respondTableTransfer = useCallback((requestId: string, accept: boolean) => {
    const req = transferRequests.find(r => r.id === requestId);
    if (!req) return;

    if (accept) {
      setTables(prev => prev.map(t => (t.id === req.table_id || t.table_number === req.table_number) ? { ...t, assigned_waiter_id: req.to_waiter_id } : t));

      fetch(`${API_BASE}/tables/${req.table_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transfer', to_waiter_id: req.to_waiter_id, to_waiter_name: req.to_waiter_name })
      }).catch(err => console.warn('Table transfer sync warning:', err));

      addToast('success', `Accepted transfer for ${req.table_number}`);
    } else {
      addToast('info', `Rejected transfer for ${req.table_number}`);
    }

    setTransferRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: accept ? 'accepted' : 'rejected' } : r));
  }, [transferRequests, addToast]);

  const acceptRequest = useCallback((reqId: string) => {
    const targetReq = requests.find(r => r.id === reqId);
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'accepted' as const, waiter: user?.name, waiter_id: user?.id } : r));

    // If customer re-ordered food mid-meal, automatically generate KOT ticket for kitchen & update order
    if (targetReq && targetReq.is_food && targetReq.food_items && targetReq.food_items.length > 0) {
      const orderId = `ORD-${Math.floor(8400 + Math.random() * 100)}`;
      const table = tables.find(t => t.id === targetReq.table_id || t.table_number === targetReq.table_number);
      const newOrder: Order = {
        id: orderId,
        session_id: table?.current_session_id || `sess-${Date.now()}`,
        table_id: targetReq.table_id,
        table_number: targetReq.table_number,
        token: table?.current_token || 1,
        group_id: table?.group_id || null,
        status: 'new',
        is_rush: false,
        created_at: new Date().toISOString(),
        total: targetReq.total || targetReq.food_items.reduce((s, it) => s + (it.price * it.qty), 0),
        waiter_id: user?.id,
        items: targetReq.food_items.map((it, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          menu_id: it.menu_id || `m-${idx}`,
          name: it.name,
          qty: it.qty,
          price: it.price,
          seat_no: 0,
          status: 'new',
          station: it.station || 'Grill'
        }))
      };

      setOrders(prev => [newOrder, ...prev]);

      // Post to backend so it shows in Owner Panel Kitchen Kanban and updates DB
      fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(err => console.warn('Order sync warning:', err));

      if (soundEnabled) playSound('new_order');
      addToast('success', `Food order for ${targetReq.table_number} accepted & dispatched to Kitchen!`);
      pushNotification('kitchen_new_order', { orderId: newOrder.id, table: targetReq.table_number }, 'kitchen');
    } else {
      addToast('success', 'Service request accepted');
    }

    // Sync request status to backend
    fetch(`${API_BASE}/requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', waiter: user?.name, waiter_id: user?.id })
    }).catch(err => console.warn('Request sync warning:', err));
  }, [requests, tables, user, soundEnabled, addToast, pushNotification]);

  const doneRequest = useCallback((reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'done' as const } : r));

    fetch(`${API_BASE}/requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' })
    }).catch(err => console.warn('Request sync warning:', err));

    addToast('success', 'Request marked completed');
  }, [addToast]);

  const updateStock = useCallback((menuId: string, stock: number) => {
    setMenu(prev => prev.map(m => m.id === menuId ? { ...m, stock: Math.max(0, stock), sold_out: stock === 0, available: stock > 0 } : m));
    if (stock <= 5) {
      pushNotification('stock_low', { menuId, stock }, 'kitchen');
    }
  }, [pushNotification]);

  const toggleSoldOut = useCallback((menuId: string) => {
    setMenu(prev => prev.map(m => {
      if (m.id !== menuId) return m;
      const nextSoldOut = !m.sold_out;
      return { ...m, sold_out: nextSoldOut, available: !nextSoldOut };
    }));
    pushNotification('sold_out_toggle', { menuId }, 'manager');
  }, [pushNotification]);

  const logWastage = useCallback((menuId: string, qty: number, reason: WastageRecord['reason']) => {
    if (!user) return;
    const menuItem = menu.find(m => m.id === menuId);
    if (!menuItem) return;

    // Deduct stock
    setMenu(prev => prev.map(m => m.id === menuId ? { ...m, stock: Math.max(0, m.stock - qty) } : m));

    const record: WastageRecord = {
      id: `w-${Date.now()}`,
      menu_id: menuId,
      item_name: menuItem.name,
      qty,
      reason,
      logged_by: user.name,
      created_at: new Date().toISOString(),
    };

    setWastageLogs(prev => [record, ...prev]);
    addToast('warning', `Wastage logged for ${qty}x ${menuItem.name}`);
    pushNotification('wastage_logged', record, 'manager');
  }, [user, menu, addToast, pushNotification]);

  const payBill = useCallback((billId: string, method: string, phone?: string) => {
    let targetBill: Bill | undefined;
    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      targetBill = b;
      const receiptCode = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      const verifyCode = Math.random().toString(36).slice(2, 10).toUpperCase();
      return {
        ...b,
        status: 'paid' as const,
        method: method as any,
        paid_at: new Date().toISOString(),
        receipt_code: receiptCode,
        verify_code: verifyCode,
        customer_phone: phone,
      };
    }));

    if (soundEnabled) playSound('payment_success');
    addToast('success', 'Payment collected · Receipt generated');
    pushNotification('bill_paid', { billId, method }, 'manager');

    // Sync payment and table release with Owner/Manager backend
    try {
      fetch(`${API_BASE}/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          tableId: targetBill?.table_id,
          table_number: targetBill?.table_number,
          method,
          total: targetBill?.total || 0,
          customer_phone: phone
        })
      }).catch(err => console.warn('Sync payBill error:', err));
    } catch (e) {}
  }, [addToast, soundEnabled, pushNotification]);

  const checkIn = useCallback(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const existing = attendance.find(a => a.staff_id === user.id && a.date === today);
    if (existing?.check_in) {
      addToast('error', 'Already checked in today');
      return;
    }
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setAttendance(prev => [...prev.filter(a => !(a.staff_id === user.id && a.date === today)), {
      id: `a-${Date.now()}`,
      staff_id: user.id,
      date: today,
      check_in: now,
      breaks: [],
      status: 'present',
      is_late: false,
    }]);
    addToast('success', `Checked in at ${now}`);
  }, [user, attendance, addToast]);

  const checkOut = useCallback(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setAttendance(prev => prev.map(a => a.staff_id === user.id && a.date === today ? { ...a, check_out: now } : a));
    addToast('success', `Checked out at ${now}`);
  }, [user, addToast]);

  const breakIn = useCallback(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setAttendance(prev => prev.map(a => {
      if (a.staff_id !== user.id || a.date !== today) return a;
      return { ...a, breaks: [...a.breaks, { in: now }] };
    }));
    addToast('info', 'Break started');
  }, [user, addToast]);

  const breakOut = useCallback(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setAttendance(prev => prev.map(a => {
      if (a.staff_id !== user.id || a.date !== today) return a;
      const breaks = [...a.breaks];
      if (breaks.length && !breaks[breaks.length - 1].out) {
        breaks[breaks.length - 1] = { ...breaks[breaks.length - 1], out: now };
      }
      return { ...a, breaks };
    }));
    addToast('info', 'Break ended');
  }, [user, addToast]);

  const submitLeave = useCallback((data: Omit<LeaveRequest, 'id' | 'staff_id' | 'status' | 'created_at'>) => {
    if (!user) return;
    const newLeave: LeaveRequest = {
      ...data,
      id: `l-${Date.now()}`,
      staff_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setLeaveRequests(prev => [...prev, newLeave]);
    fetch(`${API_BASE}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, staff_id: user.id, name: user.name })
    }).catch(() => {});
    addToast('success', 'Leave request submitted');
    pushNotification('leave_request_submitted', newLeave, 'manager');
  }, [user, addToast, pushNotification]);

  const cannotMake = useCallback((orderId: string, itemId: string, reason: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        items: o.items.map(i => i.id === itemId ? { ...i, cannot_make: true, cannot_make_reason: reason, status: 'cancelled' as const } : i),
      };
    }));
    addToast('warning', 'Cannot-make flag raised · Waiter notified');
    pushNotification('cannot_make_flagged', { orderId, itemId, reason }, 'waiter');
  }, [addToast, pushNotification]);

  const addOrderItem = useCallback((tableId: string, item: { menu_id: string; name: string; qty: number; price: number; seat_no: number; station: string }) => {
    const table = tables.find(t => t.id === tableId || t.table_number === tableId);
    if (!table) return;
    const sessionId = table.current_session_id || `sess-${Date.now()}`;
    const newOrder: Order = {
      id: `ORD-${8400 + Math.floor(Math.random() * 100)}`,
      session_id: sessionId,
      table_id: table.id,
      table_number: table.table_number,
      token: table.current_token || 1,
      group_id: table.group_id,
      status: 'new',
      is_rush: false,
      created_at: new Date().toISOString(),
      total: item.price * item.qty,
      waiter_id: user?.id,
      items: [{
        id: `oi-${Date.now()}`,
        menu_id: item.menu_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        seat_no: item.seat_no,
        status: 'new',
        station: item.station,
      }],
    };
    setOrders(prev => [newOrder, ...prev]);

    // Send POST to server so it persists to db.json and shows in Owner Panel live operations!
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.warn('Order sync warning:', err));

    if (soundEnabled) playSound('new_order');
    addToast('success', 'Mid-order item added · New ticket sent to kitchen');
    pushNotification('mid_order_addition', { tableId: table.id, orderId: newOrder.id }, 'kitchen');
  }, [tables, user, soundEnabled, addToast, pushNotification]);

  const cancelOrderItem = useCallback(async (orderId: string, itemId: string, reason?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;
    const item = order.items.find(i => i.id === itemId);
    if (!item) return false;

    const isCookedOrReady = item.status === 'preparing' || item.status === 'ready' || order.status === 'preparing' || order.status === 'ready';

    try {
      const res = await fetch(`${API_BASE}/orders/cancel-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          itemId,
          reason: reason || 'Customer requested item cancellation',
          isCookedOrReady,
          waiterId: user?.id,
          waiterName: user?.name
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('error', data.error || 'Failed to cancel item');
        return false;
      }

      if (data.requiresApproval) {
        // Food is cooking or ready: supervisor approval requested!
        setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            items: o.items.map(it => it.id === itemId ? { ...it, status: 'void_requested' as any } : it)
          };
        }));
        logWastage(item.menu_id, item.qty, 'spoilage');
        pushNotification('item_void_requested', { orderId, itemId, reason }, 'manager');
        addToast('info', 'Item is in preparation. Supervisor void approval requested.');
      } else {
        // Item is cancelled directly before cooking
        setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          const updatedItems = o.items.map(it => it.id === itemId ? { ...it, status: 'cancelled' as any } : it);
          const active = updatedItems.filter(it => it.status !== 'cancelled');
          return {
            ...o,
            items: updatedItems,
            total: Math.max(0, o.total - (item.price * item.qty)),
            status: active.length === 0 ? 'cancelled' : o.status
          };
        }));

        setTables(prev => prev.map(t => {
          if (t.id !== order.table_id && t.table_number !== order.table_number) return t;
          return {
            ...t,
            billAmount: Math.max(0, ((t as any).billAmount || 0) - (item.price * item.qty))
          };
        }));

        addToast('success', `Cancelled ${item.name}. Running table bill updated (-₹${item.price * item.qty})`);
      }
      return true;
    } catch (err) {
      console.warn('cancelOrderItem error:', err);
      addToast('error', 'Network error cancelling item');
      return false;
    }
  }, [orders, user, addToast, pushNotification, logWastage]);

  const linkTables = useCallback((tableIds: string[], primaryId: string, billingPref: 'separate' | 'combined') => {
    if (!user) return;
    const groupId = `g${Math.floor(Math.random() * 900 + 100)}`;
    const groupCode = `G-${Math.floor(Math.random() * 90 + 10)}`;
    setGroups(prev => [...prev, {
      id: groupId,
      group_code: groupCode,
      table_ids: tableIds,
      primary_table_id: primaryId,
      billing_pref: billingPref,
      created_at: new Date().toISOString(),
      waiter_id: user.id,
    }]);
    setTables(prev => prev.map(t => tableIds.includes(t.id) ? { ...t, group_id: groupId } : t));
    addToast('success', `Tables linked as ${groupCode}`);
    pushNotification('tables_linked', { groupId, tableIds }, 'manager');
  }, [user, addToast, pushNotification]);

  const unlinkGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setTables(prev => prev.map(t => t.group_id === groupId ? { ...t, group_id: null } : t));
    addToast('info', 'Group unlinked');
    pushNotification('tables_unlinked', { groupId }, 'manager');
  }, [addToast, pushNotification]);

  return (
    <AppContext.Provider value={{
      user, theme, soundEnabled, toasts, tables, orders, menu, requests, groups, bills,
      attendance, leaveRequests, pettyCash, notificationQueue, wastageLogs, transferRequests, dayCloseRecords,
      setTables, setOrders, setMenu, setBills, setPettyCash, setDayCloseRecords,
      login, logout, setTheme, toggleSound, addToast, pushNotification,
      updateOrderStatus, updateItemStatus, toggleRush,
      claimTable, freeTable, requestTableTransfer, respondTableTransfer,
      acceptRequest, doneRequest,
      updateStock, toggleSoldOut, logWastage,
      payBill, checkIn, checkOut, breakIn, breakOut,
      submitLeave, cannotMake, addOrderItem, cancelOrderItem, linkTables, unlinkGroup,
      staffList, overrideAttendance,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
