export type Role = 'kitchen' | 'waiter' | 'accountant';
export type Theme = 'dark' | 'night' | 'light';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'void_requested' | 'voided';
export type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';
export type BillingStatus = 'open' | 'paid' | 'closed';
export type RequestStatus = 'pending' | 'accepted' | 'done';
export type LeaveType = 'casual' | 'sick' | 'paid' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'split';

export interface Staff {
  id: string;
  name: string;
  role: Role;
  pin: string;
  zone?: string;
  avatar?: string;
  phone?: string;
  emergencyContact?: string;
  aadhaar?: string;
  pan?: string;
  address?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  shift?: string;
  shiftStart?: string;
  shiftEnd?: string;
  joiningDate?: string;
  status?: string;
  checkIn?: string;
  rate?: number;
  otRate?: number;
  rating?: number;
  hoursWorked?: number;
  basicMonthly?: number;
  pfApplicable?: boolean;
  esiApplicable?: boolean;
}

export interface Table {
  id: string;
  table_number: string;
  max_seats: number;
  current_token: number;
  current_session_id: string | null;
  assigned_waiter_id: string | null;
  zone: string;
  group_id: string | null;
  status: TableStatus;
}

export interface Session {
  id: string;
  table_id: string;
  opened_at: string;
  closed_at: string | null;
  customer_phone?: string;
  primary_waiter_id: string | null;
  billing_status: BillingStatus;
}

export interface OrderItem {
  id: string;
  menu_id: string;
  name: string;
  qty: number;
  price: number;
  seat_no: number;
  spice_level?: number;
  addons?: string[];
  notes?: string;
  status: OrderStatus;
  station: string;
  cannot_make?: boolean;
  cannot_make_reason?: string;
}

export interface Order {
  id: string;
  session_id: string;
  table_id: string;
  table_number: string;
  token: number;
  group_id: string | null;
  status: OrderStatus;
  items: OrderItem[];
  is_rush: boolean;
  is_vip?: boolean;
  is_parcel?: boolean;
  created_at: string;
  total: number;
  waiter_id?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  sold_out: boolean;
  available: boolean;
  prep_minutes: number;
  station: string;
  spice_options: boolean;
  addons: string[];
  allergens: string[];
  is_veg: boolean;
  is_jain: boolean;
  image?: string;
}

export interface CustomerRequest {
  id: string;
  table_id: string;
  table_number: string;
  type: string;
  status: RequestStatus;
  created_at: string;
  waiter_id?: string;
  waiter?: string;
  notes?: string;
  is_food?: boolean;
  food_items?: {
    menu_id?: string;
    name: string;
    qty: number;
    price: number;
    station?: string;
  }[];
  total?: number;
}

export interface Group {
  id: string;
  group_code: string;
  table_ids: string[];
  primary_table_id: string;
  billing_pref: 'separate' | 'combined';
  created_at: string;
  waiter_id: string;
}

export interface Bill {
  id: string;
  session_id: string;
  table_id: string;
  table_number: string;
  token: number;
  group_id: string | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'void';
  method?: PaymentMethod;
  receipt_code?: string;
  verify_code?: string;
  created_at: string;
  paid_at?: string;
  customer_phone?: string;
  scan_count: number;
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  breaks: { in: string; out?: string }[];
  status: 'present' | 'absent' | 'late' | 'half' | 'leave';
  is_late: boolean;
}

export interface LeaveRequest {
  id: string;
  staff_id: string;
  from_date: string;
  to_date: string;
  type: LeaveType;
  reason: string;
  half_day: boolean;
  status: LeaveStatus;
  manager_note?: string;
  created_at: string;
}

export interface PettyCash {
  id: string;
  purpose: string;
  paid_to: string;
  amount: number;
  category: string;
  created_at: string;
  created_by: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface NotificationQueueItem {
  id: string;
  event_type: string;
  payload: any;
  target_role?: Role | 'manager';
  created_at: string;
  status: 'pending' | 'consumed';
}

export interface WastageRecord {
  id: string;
  menu_id: string;
  item_name: string;
  qty: number;
  reason: 'burnt' | 'spilled' | 'expired' | 'customer-return' | 'quality-reject';
  logged_by: string;
  created_at: string;
}

export interface ReceiptVerificationResult {
  receipt_code: string;
  status: 'valid' | 'invalid' | 'tampered';
  bill?: Bill;
  scan_count: number;
  fraud_flag: boolean;
  reason?: string;
  timestamp: string;
}

export interface DayCloseRecord {
  id: string;
  date: string;
  total_sales: number;
  cash_sales: number;
  upi_sales: number;
  card_sales: number;
  tips: number;
  petty_cash_spent: number;
  refunds: number;
  net_earnings: number;
  bill_count: number;
  avg_bill_value: number;
  expected_cash: number;
  actual_cash: number;
  cash_variance: number;
  closed_by: string;
  closed_at: string;
  top_waiter: string;
}

export interface TableTransferRequest {
  id: string;
  table_id: string;
  table_number: string;
  from_waiter_id: string;
  from_waiter_name: string;
  to_waiter_id: string;
  to_waiter_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface AppState {
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
}

