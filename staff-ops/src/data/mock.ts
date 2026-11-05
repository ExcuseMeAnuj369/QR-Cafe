import type {
  Staff, Table, Order, MenuItem, CustomerRequest, Group, Bill,
  AttendanceRecord, LeaveRequest, PettyCash
} from '../types';

export const STAFF: Staff[] = [
  { id: '1001', name: 'Arjun Mehta', role: 'kitchen', pin: '1001', zone: 'A' },
  { id: '2002', name: 'Priya Sharma', role: 'waiter', pin: '2002', zone: 'A' },
  { id: '3003', name: 'Rahul Verma', role: 'accountant', pin: '3003' },
  { id: '2004', name: 'Sneha Patel', role: 'waiter', pin: '2004', zone: 'B' },
  { id: '1005', name: 'Vikram Singh', role: 'kitchen', pin: '1005', zone: 'B' },
];

export const TABLES: Table[] = [
  { id: 't1', table_number: 'T-01', max_seats: 4, current_token: 38, current_session_id: null, assigned_waiter_id: null, zone: 'A', group_id: null, status: 'free' },
  { id: 't2', table_number: 'T-02', max_seats: 4, current_token: 42, current_session_id: 'sess-2', assigned_waiter_id: '2002', zone: 'A', group_id: null, status: 'occupied' },
  { id: 't3', table_number: 'T-03', max_seats: 6, current_token: 31, current_session_id: null, assigned_waiter_id: null, zone: 'A', group_id: null, status: 'free' },
  { id: 't4', table_number: 'T-04', max_seats: 4, current_token: 44, current_session_id: 'sess-4', assigned_waiter_id: '2002', zone: 'A', group_id: 'g77', status: 'occupied' },
  { id: 't5', table_number: 'T-05', max_seats: 2, current_token: 22, current_session_id: null, assigned_waiter_id: null, zone: 'B', group_id: null, status: 'free' },
  { id: 't6', table_number: 'T-06', max_seats: 6, current_token: 15, current_session_id: null, assigned_waiter_id: null, zone: 'B', group_id: null, status: 'cleaning' },
  { id: 't7', table_number: 'T-07', max_seats: 4, current_token: 47, current_session_id: 'sess-7', assigned_waiter_id: '2002', zone: 'A', group_id: 'g77', status: 'occupied' },
  { id: 't8', table_number: 'T-08', max_seats: 4, current_token: 19, current_session_id: null, assigned_waiter_id: null, zone: 'B', group_id: null, status: 'free' },
  { id: 't9', table_number: 'T-09', max_seats: 6, current_token: 49, current_session_id: 'sess-9', assigned_waiter_id: '2004', zone: 'B', group_id: null, status: 'occupied' },
  { id: 't10', table_number: 'T-10', max_seats: 4, current_token: 12, current_session_id: null, assigned_waiter_id: null, zone: 'B', group_id: null, status: 'reserved' },
];

export const MENU: MenuItem[] = [
  { id: 'm1', name: 'Paneer Butter Masala', category: 'Main', price: 280, stock: 18, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 18, station: 'Grill', spice_options: true, addons: ['Extra Gravy'], allergens: ['Dairy'], is_veg: true, is_jain: false },
  { id: 'm2', name: 'Butter Naan', category: 'Bread', price: 60, stock: 45, low_stock_threshold: 10, sold_out: false, available: true, prep_minutes: 8, station: 'Tandoor', spice_options: false, addons: [], allergens: ['Gluten'], is_veg: true, is_jain: true },
  { id: 'm3', name: 'Chicken Biryani', category: 'Rice', price: 320, stock: 12, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 25, station: 'Grill', spice_options: true, addons: ['Raita', 'Salad'], allergens: [], is_veg: false, is_jain: false },
  { id: 'm4', name: 'Veg Biryani', category: 'Rice', price: 260, stock: 8, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 22, station: 'Grill', spice_options: true, addons: ['Raita'], allergens: [], is_veg: true, is_jain: false },
  { id: 'm5', name: 'Garlic Naan', category: 'Bread', price: 70, stock: 30, low_stock_threshold: 8, sold_out: false, available: true, prep_minutes: 8, station: 'Tandoor', spice_options: false, addons: [], allergens: ['Gluten'], is_veg: true, is_jain: false },
  { id: 'm6', name: 'Mango Lassi', category: 'Beverage', price: 90, stock: 20, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 3, station: 'Bar', spice_options: false, addons: [], allergens: ['Dairy'], is_veg: true, is_jain: true },
  { id: 'm7', name: 'Dal Makhani', category: 'Main', price: 220, stock: 15, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 15, station: 'Grill', spice_options: true, addons: [], allergens: ['Dairy'], is_veg: true, is_jain: false },
  { id: 'm8', name: 'Kadhai Paneer', category: 'Main', price: 290, stock: 10, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 16, station: 'Grill', spice_options: true, addons: [], allergens: ['Dairy'], is_veg: true, is_jain: false },
  { id: 'm9', name: 'Jeera Rice', category: 'Rice', price: 120, stock: 25, low_stock_threshold: 8, sold_out: false, available: true, prep_minutes: 12, station: 'Grill', spice_options: false, addons: [], allergens: [], is_veg: true, is_jain: true },
  { id: 'm10', name: 'Gulab Jamun', category: 'Dessert', price: 80, stock: 3, low_stock_threshold: 5, sold_out: false, available: true, prep_minutes: 2, station: 'Dessert', spice_options: false, addons: [], allergens: ['Dairy'], is_veg: true, is_jain: false },
  { id: 'm11', name: 'Tandoori Chicken', category: 'Starter', price: 350, stock: 0, low_stock_threshold: 5, sold_out: true, available: false, prep_minutes: 30, station: 'Tandoor', spice_options: true, addons: [], allergens: [], is_veg: false, is_jain: false },
  { id: 'm12', name: 'Masala Chai', category: 'Beverage', price: 40, stock: 50, low_stock_threshold: 10, sold_out: false, available: true, prep_minutes: 5, station: 'Bar', spice_options: false, addons: [], allergens: ['Dairy'], is_veg: true, is_jain: true },
];

export const ORDERS: Order[] = [
  {
    id: 'ORD-8421',
    session_id: 'sess-4',
    table_id: 't4',
    table_number: 'T-04',
    token: 44,
    group_id: 'g77',
    status: 'preparing',
    is_rush: true,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    total: 398,
    waiter_id: '2002',
    items: [
      { id: 'oi1', menu_id: 'm1', name: 'Paneer Butter Masala', qty: 1, price: 280, seat_no: 2, status: 'ready', station: 'Grill', spice_level: 2 },
      { id: 'oi2', menu_id: 'm2', name: 'Butter Naan', qty: 2, price: 60, seat_no: 2, status: 'preparing', station: 'Tandoor' },
    ],
  },
  {
    id: 'ORD-8422',
    session_id: 'sess-7',
    table_id: 't7',
    table_number: 'T-07',
    token: 47,
    group_id: 'g77',
    status: 'new',
    is_rush: false,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    total: 800,
    waiter_id: '2002',
    items: [
      { id: 'oi3', menu_id: 'm4', name: 'Veg Biryani', qty: 2, price: 260, seat_no: 0, status: 'new', station: 'Grill' },
      { id: 'oi4', menu_id: 'm6', name: 'Mango Lassi', qty: 2, price: 90, seat_no: 0, status: 'new', station: 'Bar' },
    ],
  },
  {
    id: 'ORD-8418',
    session_id: 'sess-2',
    table_id: 't2',
    table_number: 'T-02',
    token: 42,
    group_id: null,
    status: 'ready',
    is_rush: false,
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    total: 415,
    waiter_id: '2002',
    items: [
      { id: 'oi5', menu_id: 'm3', name: 'Chicken Biryani', qty: 1, price: 320, seat_no: 4, status: 'ready', station: 'Grill' },
      { id: 'oi6', menu_id: 'm5', name: 'Garlic Naan', qty: 1, price: 70, seat_no: 4, status: 'preparing', station: 'Tandoor' },
    ],
  },
  {
    id: 'ORD-8415',
    session_id: 'sess-9',
    table_id: 't9',
    table_number: 'T-09',
    token: 49,
    group_id: null,
    status: 'new',
    is_rush: false,
    created_at: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    total: 450,
    waiter_id: '2004',
    items: [
      { id: 'oi7', menu_id: 'm8', name: 'Kadhai Paneer', qty: 1, price: 290, seat_no: 1, status: 'new', station: 'Grill' },
      { id: 'oi8', menu_id: 'm9', name: 'Jeera Rice', qty: 1, price: 120, seat_no: 1, status: 'new', station: 'Grill' },
    ],
  },
];

export const REQUESTS: CustomerRequest[] = [
  { id: 'r1', table_id: 't4', table_number: 'T-04', type: 'water', status: 'pending', created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(), waiter_id: '2002' },
  { id: 'r2', table_id: 't2', table_number: 'T-02', type: 'napkin', status: 'accepted', created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), waiter_id: '2002' },
  { id: 'r3', table_id: 't7', table_number: 'T-07', type: 'call_waiter', status: 'pending', created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), waiter_id: '2002' },
];

export const GROUPS: Group[] = [
  { id: 'g77', group_code: 'G-77', table_ids: ['t4', 't7'], primary_table_id: 't4', billing_pref: 'separate', created_at: new Date().toISOString(), waiter_id: '2002' },
];

export const BILLS: Bill[] = [
  {
    id: 'b1',
    session_id: 'sess-2',
    table_id: 't2',
    table_number: 'T-02',
    token: 42,
    group_id: null,
    subtotal: 390,
    cgst: 9.75,
    sgst: 9.75,
    discount: 0,
    total: 415,
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    scan_count: 0,
  },
  {
    id: 'b2',
    session_id: 'sess-old',
    table_id: 't1',
    table_number: 'T-01',
    token: 37,
    group_id: null,
    subtotal: 560,
    cgst: 14,
    sgst: 14,
    discount: 50,
    total: 538,
    status: 'paid',
    method: 'upi',
    receipt_code: 'RCP-20260514-0042',
    verify_code: 'XK7M2P9Q',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    customer_phone: '9876543210',
    scan_count: 1,
  },
];

export const ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    staff_id: '1001',
    date: new Date().toISOString().slice(0, 10),
    check_in: '10:05',
    breaks: [],
    status: 'present',
    is_late: false,
  },
  {
    id: 'a2',
    staff_id: '2002',
    date: new Date().toISOString().slice(0, 10),
    check_in: '09:50',
    breaks: [{ in: '13:00', out: '13:30' }],
    status: 'present',
    is_late: false,
  },
];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'l1',
    staff_id: '2002',
    from_date: '2026-06-01',
    to_date: '2026-06-02',
    type: 'casual',
    reason: 'Family function in hometown',
    half_day: false,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
];

export const PETTY_CASH: PettyCash[] = [
  { id: 'pc1', purpose: 'Gas cylinder refill', paid_to: 'Local supplier', amount: 1200, category: 'Utilities', created_at: new Date().toISOString(), created_by: '3003' },
];
