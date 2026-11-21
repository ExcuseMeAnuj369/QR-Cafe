// Hand-written mirrors of the models for QR CAFE.
// Includes Host & Guest dining, 20% advance kitchen deposits, and Group Table Merging.

export type Lang = "en" | "hi" | "mr";
export type MenuCategory = "starters" | "mains" | "breads" | "drinks" | "desserts" | "kids";
export type SpiceLevel = "mild" | "medium" | "hot" | "extrahot";
export type OrderStatus = "placed" | "preparing" | "ready" | "served";
export type ServiceType = "water" | "napkin" | "bowl" | "spoon" | "waiter" | "highchair" | "clean";

export interface LocalizedText {
  en: string;
  hi: string;
  mr: string;
}

export interface Addon {
  id: string;
  name: LocalizedText;
  price: number; // paise
}

export interface MenuItem {
  id: string;
  name: LocalizedText;
  desc: LocalizedText;
  price: number; // paise
  category: MenuCategory;
  veg: boolean;
  image: string;
  stock: number | null;
  sold_out: boolean;
  spice_allowed: boolean;
  tags: string[];
  addons: Addon[];
}

export interface QRDSession {
  id: string;
  code: string;
  table_id: string;
  group_id: string | null; // e.g. "GRP-8812" if merged with another table
  linked_table_id?: string | null; // e.g. "T-05"
  party_size: number; // e.g. 1, 2, 3, 4
  is_host: boolean; // Current user device is the Host
  host_seat: number; // 1 (Me)
  guest_seats: number[]; // [2, 3] etc.
  seats_count: number; // e.g. 3
  language: Lang;
  status: string; // active | paid | expired
  advance_paid?: number; // total advance deposit paid in paise
  chair_id?: number; // primary chair of this device (e.g. 1)
  claimed_chairs?: number[]; // chairs claimed by this device (e.g. [1, 2])
  user_name?: string; // diner's custom display name e.g. "Host", "Rahul"
  group_code?: string; // 4-digit PIN for pairing e.g. "4812"
  checkout_enabled?: boolean; // Controlled by Cashier: enabled after meal / at counter
  meal_status?: "preparing" | "dining" | "finished";
  cashier_discount?: number; // Discount applied by Cashier in paise
  cashier_discount_reason?: string;
  linked_members?: { table_id: string; chairs: number[]; name?: string }[];
  created_at: string;
  expires_at: string;
}

export interface ChairState {
  chair_id: number;
  label: string;
  is_occupied: boolean;
  occupied_by?: string;
  is_mine?: boolean;
}

export interface GroupPairRequest {
  session_id: string;
  group_code: string; // 4-digit code e.g. "4812"
}

export interface OrderItem {
  item_id: string;
  name: LocalizedText;
  qty: number;
  price: number; // unit paise, add-ons included
  spice: SpiceLevel | null;
  addons: string[];
  notes: string | null;
  seat: number;
  line_total: number;
}

export interface StatusEvent {
  status: string;
  at: string;
}

export interface RejectedItem {
  item_id: string;
  name: string;
  reason: string;
}

export interface Order {
  id: string;
  kot_number: string;
  session_id: string;
  table_id: string;
  group_id: string | null;
  items: OrderItem[];
  subtotal: number;
  advance_required: number; // 20% advance deposit in paise
  advance_paid: number; // amount paid before sending to kitchen
  advance_payment_id?: string;
  status: OrderStatus;
  status_history: StatusEvent[];
  prep_seconds: number;
  warnings: string[];
  rejected: RejectedItem[];
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  session_id: string;
  table_id: string;
  type: ServiceType;
  status: "pending" | "acknowledged" | "resolved";
  sla_deadline: string;
  created_at: string;
}

export interface BillLine {
  kot_number: string;
  table_id?: string;
  item_id: string;
  name: LocalizedText;
  qty: number;
  price: number;
  line_total: number;
  seat: number;
  spice: string | null;
  addons: string[];
  notes: string | null;
}

export interface SeatLine {
  seat: number;
  label: string; // e.g. "Seat 1 (Host - Me)" or "Seat 2 (Guest)"
  subtotal: number;
  gst: number;
  total: number;
  paid_amount: number; // previous completed payments for this seat
  pending_amount: number; // remaining unpaid balance for this seat
  paid: boolean; // true if pending_amount <= 0 && total > 0
  paid_at?: string;
}

export interface EqualPlan {
  shares: number;
  shares_paid: number;
  share_amount: number;
}

export interface Receipt {
  id: string;
  code: string;
  session_id: string;
  table_id: string;
  amount: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  advance_deducted?: number;
  items_count: number;
  whatsapp_number: string;
  whatsapp_status: string;
  created_at: string;
}

export interface Bill {
  session_id: string;
  table_id: string;
  group_id: string | null;
  linked_table_id?: string | null;
  lines: BillLine[];
  subtotal: number;
  discount_amount?: number; // Cashier applied discount in paise
  discount_reason?: string | null; // e.g. "Manager PIN Approved Courtesy"
  discount_by?: string | null; // "Cashier Counter"
  cgst: number;
  sgst: number;
  grand_total: number;
  advance_deducted: number; // 20% advances credited
  paid_amount: number;
  balance: number;
  status: "unpaid" | "partial" | "paid";
  checkout_enabled?: boolean; // Enabled by Cashier when meal is finished
  meal_status?: "preparing" | "dining" | "finished"; // Stage of dining
  seats: SeatLine[];
  equal: EqualPlan | null;
  receipt: Receipt | null;
  // Table Merging / Cross-Table Multi-Group Scenario
  group_total?: number;
  group_subtotal?: number;
  group_lines?: BillLine[];
  linked_table_subtotal?: number;
}

export interface Payment {
  id: string;
  session_id: string;
  mode: "equal" | "by_seat" | "group_total" | "advance_deposit" | "my_table" | "custom";
  seat: number | null;
  share_index: number | null;
  shares_total: number | null;
  amount: number;
  status: string;
  payment_method?: string; // UPI, Razorpay, Card
  created_at: string;
}

export interface PaymentResult {
  payment: Payment;
  bill: Bill;
  receipt: Receipt | null;
  complete: boolean;
}

export interface VerifyResult {
  valid: boolean;
  table_id: string;
  amount: number;
  items_count: number;
  paid_at: string;
}

export interface ScanRequest {
  table_id: string;
  token: string;
  language: Lang;
  party_size?: number; // 1, 2, 3, 4, etc.
  chair_id?: number;
  claimed_chairs?: number[];
  join_existing_session?: boolean;
}

export interface OrderItemIn {
  item_id: string;
  qty: number;
  spice: SpiceLevel | null;
  addon_ids: string[];
  notes: string | null;
  seat: number;
}

export interface OrderCreate {
  session_id: string;
  idempotency_key: string;
  items: OrderItemIn[];
  advance_paid: number; // 20% advance in paise
  advance_payment_id: string;
}

export interface SplitPaymentCreate {
  session_id: string;
  mode: "equal" | "by_seat" | "group_total" | "my_table" | "custom";
  seat: number | null;
  shares: number | null;
  share_index: number | null;
  amount?: number;
}

export interface CartLine {
  key: string;
  item: MenuItem;
  qty: number;
  spice: SpiceLevel | null;
  addon_ids: string[];
  notes: string | null;
  seat: number;
  unit: number; // paise per unit at add-time
}
