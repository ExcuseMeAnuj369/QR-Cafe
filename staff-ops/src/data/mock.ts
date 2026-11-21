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
  {
    id: 't1', table_number: 'T-01', max_seats: 4, current_token: 38, current_session_id: null, assigned_waiter_id: null, zone: 'A', group_id: null, status: 'free',
    seats: [
      { seat_no: 1, label: 'Seat 1 (Host)', phone_active: false },
      { seat_no: 2, label: 'Seat 2 (Guest)', phone_active: false },
      { seat_no: 3, label: 'Seat 3 (Guest)', phone_active: false },
      { seat_no: 4, label: 'Seat 4 (Guest)', phone_active: false },
    ]
  },
  {
    id: 't2', table_number: 'T-02', max_seats: 4, current_token: 42, current_session_id: 'sess-2', assigned_waiter_id: '2002', zone: 'A', group_id: null, status: 'occupied',
    seats: [
      { seat_no: 1, label: 'Chair 1 (Host)', phone_active: true },
      { seat_no: 2, label: 'Chair 2: Guest of Host (Chair 1) [Senior - No Phone]', is_direct_claim: true, claimed_by_seat: 1, phone_active: false },
      { seat_no: 3, label: 'Chair 3: Guest of Host (Chair 1) [Kid - No Phone]', is_direct_claim: true, claimed_by_seat: 1, phone_active: false },
      { seat_no: 4, label: 'Chair 4: Diner (Phone Connected)', phone_active: true },
    ]
  },
  {
    id: 't3', table_number: 'T-03', max_seats: 6, current_token: 31, current_session_id: null, assigned_waiter_id: null, zone: 'A', group_id: null, status: 'free'
  },
  {
    id: 't4', table_number: 'T-04', max_seats: 4, current_token: 44, current_session_id: 'sess-4', assigned_waiter_id: '2002', zone: 'A', group_id: 'GRP-8812', linked_tables: ['T-04', 'T-05'], status: 'occupied',
    seats: [
      { seat_no: 1, label: 'Chair 1 (Host)', phone_active: true },
      { seat_no: 2, label: 'Chair 2: Guest of Host [Senior - No Phone]', is_direct_claim: true, claimed_by_seat: 1, phone_active: false },
      { seat_no: 3, label: 'Chair 3: Diner', phone_active: true },
      { seat_no: 4, label: 'Chair 4: Empty', phone_active: false },
    ]
  },
  {
    id: 't5', table_number: 'T-05', max_seats: 2, current_token: 22, current_session_id: 'sess-5', assigned_waiter_id: '2002', zone: 'B', group_id: 'GRP-8812', linked_tables: ['T-04', 'T-05'], status: 'occupied',
    seats: [
      { seat_no: 1, label: 'Chair 1: Friend (Linked Group)', phone_active: true },
      { seat_no: 2, label: 'Chair 2: Friend (Linked Group)', phone_active: true },
    ]
  },
  { id: 't6', table_number: 'T-06', max_seats: 6, current_token: 15, current_session_id: null, assigned_waiter_id: null, zone: 'B', group_id: null, status: 'cleaning' },
  { id: 't7', table_number: 'T-07', max_seats: 4, current_token: 47, current_session_id: 'sess-7', assigned_waiter_id: '2002', zone: 'A', group_id: null, status: 'occupied' },
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
    group_id: 'GRP-8812',
    status: 'preparing',
    is_rush: true,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    total: 400,
    advance_required: 80,
    advance_paid: true,
    advance_txn_id: 'UPI-ADV-9921',
    waiter_id: '2002',
    items: [
      { id: 'oi1', menu_id: 'm1', name: 'Butter Chicken (Medium Spicy)', qty: 1, price: 280, seat_no: 1, seat_label: 'Seat 1 (Host)', status: 'ready', station: 'Grill', spice_level: 2 },
      { id: 'oi2', menu_id: 'm2', name: 'Butter Naan', qty: 2, price: 60, seat_no: 2, seat_label: 'Seat 2 (Guest - No Phone)', status: 'preparing', station: 'Tandoor' },
    ],
  },
  {
    id: 'ORD-8425',
    session_id: 'sess-4',
    table_id: 't4',
    table_number: 'T-04',
    token: 44,
    group_id: 'GRP-8812',
    status: 'awaiting_advance',
    is_rush: false,
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    total: 580,
    advance_required: 116,
    advance_paid: false,
    waiter_id: '2002',
    items: [
      { id: 'oi9', menu_id: 'm3', name: 'Chicken Biryani', qty: 1, price: 320, seat_no: 1, seat_label: 'Seat 1 (Host)', status: 'awaiting_advance', station: 'Grill' },
      { id: 'oi10', menu_id: 'm4', name: 'Veg Biryani', qty: 1, price: 260, seat_no: 2, seat_label: 'Seat 2 (Guest - No Phone)', status: 'awaiting_advance', station: 'Grill' },
    ],
  },
  {
    id: 'ORD-8422',
    session_id: 'sess-7',
    table_id: 't7',
    table_number: 'T-07',
    token: 47,
    group_id: null,
    status: 'new',
    is_rush: false,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    total: 800,
    advance_required: 160,
    advance_paid: true,
    advance_txn_id: 'UPI-ADV-9922',
    waiter_id: '2002',
    items: [
      { id: 'oi3', menu_id: 'm4', name: 'Veg Biryani', qty: 2, price: 260, seat_no: 1, seat_label: 'Seat 1 (Host)', status: 'new', station: 'Grill' },
      { id: 'oi4', menu_id: 'm6', name: 'Mango Lassi', qty: 2, price: 90, seat_no: 2, seat_label: 'Seat 2 (Diner)', status: 'new', station: 'Bar' },
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
    advance_required: 83,
    advance_paid: true,
    advance_txn_id: 'UPI-ADV-9918',
    waiter_id: '2002',
    items: [
      { id: 'oi5', menu_id: 'm3', name: 'Chicken Biryani', qty: 1, price: 320, seat_no: 1, seat_label: 'Seat 1 (Host)', status: 'ready', station: 'Grill' },
      { id: 'oi6', menu_id: 'm5', name: 'Garlic Naan', qty: 1, price: 70, seat_no: 2, seat_label: 'Seat 2 (Guest - No Phone)', status: 'ready', station: 'Tandoor' },
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
    advance_required: 90,
    advance_paid: true,
    waiter_id: '2004',
    items: [
      { id: 'oi7', menu_id: 'm8', name: 'Kadhai Paneer', qty: 1, price: 290, seat_no: 1, seat_label: 'Seat 1', status: 'new', station: 'Grill' },
      { id: 'oi8', menu_id: 'm9', name: 'Jeera Rice', qty: 1, price: 120, seat_no: 1, seat_label: 'Seat 1', status: 'new', station: 'Grill' },
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
    session_id: 'sess-4',
    table_id: 't4',
    table_number: 'T-04',
    token: 44,
    group_id: 'GRP-8812',
    linked_tables: ['T-04', 'T-05'],
    subtotal: 1000,
    cgst: 25,
    sgst: 25,
    discount: 0,
    total: 1050,
    advance_deducted: 200,
    paid_amount: 504,
    balance_due: 346,
    status: 'pending',
    counter_checkout_requested: true,
    counter_cash_lock: false,
    seats: [
      {
        seat: 1,
        label: 'T-04 · Chair 1 (Host)',
        original_share: 500,
        adjusted_share: 600,
        rebalance_note: '*Custom Rebalanced by Diners (absorbed ₹100 from Chair 2)',
        advance_credited: 120,
        pending_amount: 0,
        paid: true,
        paid_method: 'online_upi',
        txn_id: 'UPI-98218-HDF'
      },
      {
        seat: 2,
        label: 'T-04 · Chair 2: Guest of Host [Senior - No Phone]',
        original_share: 500,
        adjusted_share: 400,
        rebalance_note: '*Chair 1 paid ₹100 of this share',
        advance_credited: 80,
        pending_amount: 346,
        paid: false,
        paid_method: null
      }
    ],
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    scan_count: 2,
  },
  {
    id: 'b2',
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
    advance_deducted: 83,
    paid_amount: 0,
    balance_due: 332,
    status: 'pending',
    counter_checkout_requested: false,
    counter_cash_lock: false,
    seats: [
      {
        seat: 1,
        label: 'Chair 1 (Host)',
        original_share: 415,
        adjusted_share: 415,
        advance_credited: 83,
        pending_amount: 332,
        paid: false,
        paid_method: null
      }
    ],
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    scan_count: 1,
  },
  {
    id: 'b3',
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
    advance_deducted: 100,
    paid_amount: 438,
    balance_due: 0,
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
