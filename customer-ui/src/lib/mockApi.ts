import type {
  Bill,
  BillLine,
  ChairState,
  EqualPlan,
  GroupPairRequest,
  Lang,
  MenuItem,
  Order,
  OrderCreate,
  OrderItem,
  Payment,
  PaymentResult,
  QRDSession,
  Receipt,
  ScanRequest,
  SeatLine,
  ServiceRequest,
  ServiceType,
  VerifyResult,
} from './types';
import { INITIAL_MENU } from './mockData';

// Persistent storage keys
const SESSIONS_KEY = "qrdine_mock_sessions";
const ORDERS_KEY = "qrdine_mock_orders";
const SERVICE_KEY = "qrdine_mock_service";
const PAYMENTS_KEY = "qrdine_mock_payments";
const RECEIPTS_KEY = "qrdine_mock_receipts";
const MENU_KEY = "qrdine_mock_menu";

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

let menuState: MenuItem[] = loadStorage(MENU_KEY, INITIAL_MENU);

export function handleMockRequest<T>(method: string, path: string, body?: any): T {
  const url = path.split('?')[0];

  // 1. POST /session/scan (with Host & Guest party size setup)
  if (method === "POST" && url === "/session/scan") {
    const req = body as ScanRequest;
    const now = new Date();
    const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const code = `SES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const id = `ses-${req.table_id || "T-04"}-${Date.now().toString(36)}`;
    const partySize = req.party_size && req.party_size > 0 ? req.party_size : 3;

    const guestSeats = partySize > 1
      ? Array.from({ length: partySize - 1 }, (_, i) => i + 2)
      : [];

    const chairId = req.chair_id || 1;
    const claimedChairs = req.claimed_chairs && req.claimed_chairs.length > 0
      ? req.claimed_chairs
      : (partySize > 1 ? Array.from({ length: partySize }, (_, i) => i + 1) : [chairId]);

    const session: QRDSession = {
      id,
      code,
      table_id: req.table_id || "T-04",
      group_id: "GRP-8812", // Linked group demo
      linked_table_id: "T-05", // Linked with Table T-05 for multi-table group scenario
      party_size: claimedChairs.length,
      is_host: chairId === 1,
      host_seat: 1,
      guest_seats: claimedChairs.filter((c) => c !== chairId),
      seats_count: claimedChairs.length,
      chair_id: chairId,
      claimed_chairs: claimedChairs,
      group_code: "4812",
      linked_members: [
        { table_id: req.table_id || "T-04", chairs: claimedChairs, name: "Your Table" },
        { table_id: "T-05", chairs: [1, 2], name: "Rohan & Family" },
      ],
      language: req.language || "en",
      status: "active",
      advance_paid: 0,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    sessions[id] = session;
    saveStorage(SESSIONS_KEY, sessions);
    return session as unknown as T;
  }

  // 2. GET /session/:id
  const sessionGetMatch = url.match(/^\/session\/([^/]+)$/);
  if (method === "GET" && sessionGetMatch) {
    const id = sessionGetMatch[1];
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[id] || {
      id,
      code: "SES-DEMO",
      table_id: "T-04",
      group_id: "GRP-8812",
      linked_table_id: "T-05",
      party_size: 3,
      is_host: true,
      host_seat: 1,
      guest_seats: [2, 3],
      seats_count: 3,
      language: "en" as Lang,
      status: "active",
      advance_paid: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    };
    return session as unknown as T;
  }

  // 3. PATCH /session/:id
  if (method === "PATCH" && sessionGetMatch) {
    const id = sessionGetMatch[1];
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[id] || {
      id,
      code: "SES-DEMO",
      table_id: "T-04",
      group_id: "GRP-8812",
      linked_table_id: "T-05",
      party_size: 3,
      is_host: true,
      host_seat: 1,
      guest_seats: [2, 3],
      seats_count: 3,
      language: "en" as Lang,
      status: "active",
      advance_paid: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    };

    if (body?.language) session.language = body.language;
    if (typeof body?.party_size === 'number') {
      session.party_size = body.party_size;
      session.seats_count = body.party_size;
      session.guest_seats = body.party_size > 1
        ? Array.from({ length: body.party_size - 1 }, (_, i) => i + 2)
        : [];
    }
    if (body?.group_id !== undefined) session.group_id = body.group_id;
    if (body?.linked_table_id !== undefined) session.linked_table_id = body.linked_table_id;

    sessions[id] = session;
    saveStorage(SESSIONS_KEY, sessions);
    return session as unknown as T;
  }

  // 4. GET /menu
  if (method === "GET" && url === "/menu") {
    return menuState as unknown as T;
  }

  // 5. POST /order (with 20% Advance Payment verification)
  if (method === "POST" && url === "/order") {
    const req = body as OrderCreate;
    const orders = loadStorage<Order[]>(ORDERS_KEY, []);
    const existing = orders.find(o => (o as any).idempotency_key === req.idempotency_key);
    if (existing) return existing as unknown as T;

    const count = orders.filter(o => o.session_id === req.session_id).length;
    const kot_number = `KOT-${String(count + 1).padStart(2, '0')}`;
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemIn of req.items) {
      const menu = menuState.find(m => m.id === itemIn.item_id);
      if (!menu) continue;

      let addonsCost = 0;
      const addonNames: string[] = [];
      for (const aid of itemIn.addon_ids || []) {
        const found = menu.addons?.find(a => a.id === aid);
        if (found) {
          addonsCost += found.price;
          addonNames.push(found.name.en);
        }
      }

      const unitPrice = menu.price + addonsCost;
      const lineTotal = unitPrice * itemIn.qty;
      subtotal += lineTotal;

      orderItems.push({
        item_id: itemIn.item_id,
        name: menu.name,
        qty: itemIn.qty,
        price: unitPrice,
        spice: itemIn.spice,
        addons: addonNames,
        notes: itemIn.notes,
        seat: itemIn.seat || 1,
        line_total: lineTotal,
      });

      if (menu.stock !== null) {
        menu.stock = Math.max(0, menu.stock - itemIn.qty);
      }
    }

    saveStorage(MENU_KEY, menuState);

    // Calculate 20% advance required (subtotal + 5% gst) * 0.20
    const grandOrderTotal = Math.round(subtotal * 1.05);
    const advanceRequired = Math.round(grandOrderTotal * 0.20);
    const advancePaid = req.advance_paid || advanceRequired;

    const now = new Date().toISOString();
    const order: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kot_number,
      session_id: req.session_id,
      table_id: "T-04",
      group_id: "GRP-8812",
      items: orderItems,
      subtotal,
      advance_required: advanceRequired,
      advance_paid: advancePaid,
      advance_payment_id: req.advance_payment_id || `pay_adv_${Date.now()}`,
      status: "placed",
      status_history: [{ status: "placed", at: now }],
      prep_seconds: 480,
      warnings: [],
      rejected: [],
      created_at: now,
    };

    (order as any).idempotency_key = req.idempotency_key;
    orders.push(order);
    saveStorage(ORDERS_KEY, orders);

    // Record the 20% advance payment in payments ledger so bill automatically credits it!
    if (advancePaid > 0) {
      const payments = loadStorage<Payment[]>(PAYMENTS_KEY, []);
      payments.push({
        id: req.advance_payment_id || `adv-${Date.now()}`,
        session_id: req.session_id,
        mode: "advance_deposit",
        seat: null,
        share_index: null,
        shares_total: null,
        amount: advancePaid,
        status: "completed",
        payment_method: "Razorpay / UPI Advance",
        created_at: now,
      });
      saveStorage(PAYMENTS_KEY, payments);

      // Also update session advance_paid total
      const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
      if (sessions[req.session_id]) {
        sessions[req.session_id].advance_paid = (sessions[req.session_id].advance_paid || 0) + advancePaid;
        saveStorage(SESSIONS_KEY, sessions);
      }
    }

    return order as unknown as T;
  }

  // 6. GET /orders/:session_id
  const ordersMatch = url.match(/^\/orders\/([^/]+)$/);
  if (method === "GET" && ordersMatch) {
    const sessionId = ordersMatch[1];
    const orders = loadStorage<Order[]>(ORDERS_KEY, []);
    const matching = orders.filter(o => o.session_id === sessionId);

    // Cooking progression simulation
    const now = Date.now();
    for (const o of matching) {
      const created = new Date(o.created_at).getTime();
      const elapsedSec = (now - created) / 1000;
      if (elapsedSec > 40 && o.status !== "served") {
        o.status = "ready";
      } else if (elapsedSec > 15 && o.status === "placed") {
        o.status = "preparing";
      }
    }
    saveStorage(ORDERS_KEY, orders);
    return matching as unknown as T;
  }

  // 7. POST /service-request
  if (method === "POST" && url === "/service-request") {
    const req = body as { session_id: string; type: ServiceType };
    const requests = loadStorage<ServiceRequest[]>(SERVICE_KEY, []);
    const now = new Date();
    const deadline = new Date(now.getTime() + 180 * 1000);

    const serviceReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      session_id: req.session_id,
      table_id: "T-04",
      type: req.type,
      status: "pending",
      sla_deadline: deadline.toISOString(),
      created_at: now.toISOString(),
    };

    requests.push(serviceReq);
    saveStorage(SERVICE_KEY, requests);
    return serviceReq as unknown as T;
  }

  // 8. GET /service-requests/:session_id
  const serviceMatch = url.match(/^\/service-requests\/([^/]+)$/);
  if (method === "GET" && serviceMatch) {
    const sessionId = serviceMatch[1];
    const requests = loadStorage<ServiceRequest[]>(SERVICE_KEY, []);
    const matching = requests.filter(r => r.session_id === sessionId);
    return matching as unknown as T;
  }

  // 9. GET /bill/:session_id (With Dynamic Incremental Calculation & Group Table Merging)
  const billMatch = url.match(/^\/bill\/([^/]+)$/);
  if (method === "GET" && billMatch) {
    const sessionId = billMatch[1];
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[sessionId];

    const orders = loadStorage<Order[]>(ORDERS_KEY, []).filter(o => o.session_id === sessionId);
    const payments = loadStorage<Payment[]>(PAYMENTS_KEY, []).filter(p => p.session_id === sessionId);

    const lines: BillLine[] = [];
    let subtotal = 0;
    const seatsMap: Record<number, number> = {};

    for (const ord of orders) {
      for (const it of ord.items) {
        lines.push({
          kot_number: ord.kot_number,
          table_id: "T-04",
          item_id: it.item_id,
          name: it.name,
          qty: it.qty,
          price: it.price,
          line_total: it.line_total,
          seat: it.seat,
          spice: it.spice,
          addons: it.addons,
          notes: it.notes,
        });
        subtotal += it.line_total;
        seatsMap[it.seat] = (seatsMap[it.seat] || 0) + it.line_total;
      }
    }

    // Cashier Applied Discount (Configured by Cashier / Manager at POS terminal)
    const discountAmount = session?.cashier_discount ?? 0;
    const discountReason = session?.cashier_discount_reason ?? (discountAmount > 0 ? "Special Courtesy Discount (Manager PIN #4812 Approved)" : null);

    const cgst = Math.round(subtotal * 0.025);
    const sgst = Math.round(subtotal * 0.025);
    const grand_total = Math.max(0, subtotal + cgst + sgst - discountAmount);

    // Advance deposits already paid
    const advanceDeducted = payments
      .filter(p => p.mode === "advance_deposit")
      .reduce((acc, p) => acc + p.amount, 0);

    // Non-advance checkout payments (by seat, equal shares, full bill)
    const checkoutPaidAmount = payments
      .filter(p => p.mode !== "advance_deposit")
      .reduce((acc, p) => acc + p.amount, 0);

    const totalPaidEver = advanceDeducted + checkoutPaidAmount;
    const balance = Math.max(0, grand_total - totalPaidEver);

    // CRITICAL BUG-PREVENTION: Dynamic Seat-Wise Billing
    // Each seat's past payments are recorded per seat. If Seat 1 pays, their payment is credited.
    // If Seat 2 later orders more, Seat 1 stays Paid. If Seat 1 later orders more, only the new difference is pending!
    const seatPaymentsMap: Record<number, { amount: number; latestAt?: string }> = {};
    for (const p of payments) {
      if (p.mode === "by_seat" && p.seat !== null) {
        if (!seatPaymentsMap[p.seat]) seatPaymentsMap[p.seat] = { amount: 0 };
        seatPaymentsMap[p.seat].amount += p.amount;
        seatPaymentsMap[p.seat].latestAt = p.created_at;
      }
    }

    // Party size & seat labels
    const partySize = session?.party_size || 3;
    const allSeatIds = Array.from(
      new Set([...Object.keys(seatsMap).map(Number), ...Array.from({ length: partySize }, (_, i) => i + 1)])
    ).sort((a, b) => a - b);

    const seatLines: SeatLine[] = allSeatIds.map((s) => {
      const sSub = seatsMap[s] || 0;
      const sGst = Math.round(sSub * 0.05);
      const sTotal = sSub + sGst;

      const sPaidRecord = seatPaymentsMap[s] || { amount: 0 };
      const sPaidAmount = sPaidRecord.amount;

      // Pending is what remains after past seat payments
      // If table has paid full balance (e.g. Pay Group or Pay Full Bill), all seats are paid
      const isFullTablePaid = balance === 0 && grand_total > 0;
      const pendingAmount = isFullTablePaid
        ? 0
        : Math.max(0, sTotal - sPaidAmount);

      const isPaid = (sTotal > 0 && pendingAmount === 0) || isFullTablePaid;

      const label = s === 1 ? "Seat 1 (Host - Me)" : `Seat ${s} (Guest)`;

      return {
        seat: s,
        label,
        subtotal: sSub,
        gst: sGst,
        total: sTotal,
        paid_amount: sPaidAmount,
        pending_amount: pendingAmount,
        paid: isPaid,
        paid_at: sPaidRecord.latestAt,
      };
    });

    const status = balance === 0 && grand_total > 0 ? "paid" : totalPaidEver > 0 ? "partial" : "unpaid";

    // Table Merging / Cross-Table Multi-Group Scenario:
    // Simulated Linked Table (Table T-05) in group GRP-8812
    const linkedTableId = session?.linked_table_id || "T-05";
    const linkedTableLines: BillLine[] = [
      {
        kot_number: "KOT-01 (T-05)",
        table_id: "T-05",
        item_id: "item-paneer-tikka",
        name: { en: "Tandoori Paneer Tikka", hi: "तंदूरी पनीर टिक्का", mr: "तंदुरी पनीर टिक्का" },
        qty: 1,
        price: 28000,
        line_total: 28000,
        seat: 1,
        spice: "medium",
        addons: [],
        notes: "Linked Table T-05 Order",
      },
      {
        kot_number: "KOT-01 (T-05)",
        table_id: "T-05",
        item_id: "item-mango-lassi",
        name: { en: "Royal Alphonso Mango Lassi", hi: "शाही अल्फांसो मैंगो लस्सी", mr: "अल्फान्सो मँगो लस्सी" },
        qty: 2,
        price: 12000,
        line_total: 24000,
        seat: 2,
        spice: null,
        addons: [],
        notes: null,
      },
    ];

    const linkedSubtotal = linkedTableLines.reduce((s, l) => s + l.line_total, 0);
    const linkedGst = Math.round(linkedSubtotal * 0.05);
    const linkedTotal = linkedSubtotal + linkedGst;

    const groupSubtotal = subtotal + linkedSubtotal;
    const groupGrandTotal = grand_total + linkedTotal;

    // Receipt generation
    let receipt: Receipt | null = null;
    const receipts = loadStorage<Record<string, Receipt>>(RECEIPTS_KEY, {});
    if (status === "paid") {
      if (receipts[sessionId]) {
        receipt = receipts[sessionId];
      } else {
        const receiptCode = `VX-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        receipt = {
          id: `rcpt-${Date.now()}`,
          code: receiptCode,
          session_id: sessionId,
          table_id: session?.table_id || "T-04",
          amount: grand_total,
          subtotal,
          cgst,
          sgst,
          advance_deducted: advanceDeducted,
          items_count: lines.length,
          whatsapp_number: "+91 98765 43210",
          whatsapp_status: "sent",
          created_at: new Date().toISOString(),
        };
        receipts[sessionId] = receipt;
        saveStorage(RECEIPTS_KEY, receipts);
      }
    }

    const bill: Bill = {
      session_id: sessionId,
      table_id: session?.table_id || "T-04",
      group_id: session?.group_id || "GRP-8812",
      linked_table_id: linkedTableId,
      lines,
      subtotal,
      discount_amount: discountAmount,
      discount_reason: discountReason,
      discount_by: discountAmount > 0 ? "Cashier Counter (Manager PIN Approved)" : null,
      cgst,
      sgst,
      grand_total,
      advance_deducted: advanceDeducted,
      paid_amount: totalPaidEver,
      balance,
      status,
      checkout_enabled: session?.checkout_enabled ?? false,
      meal_status: session?.meal_status ?? (session?.checkout_enabled ? "finished" : "dining"),
      seats: seatLines,
      equal: {
        shares: 2,
        shares_paid: payments.filter(p => p.mode === "equal").length,
        share_amount: Math.round(grand_total / 2),
      },
      receipt,
      group_total: groupGrandTotal,
      group_subtotal: groupSubtotal,
      group_lines: [...lines, ...linkedTableLines],
      linked_table_subtotal: linkedSubtotal,
    };

    return bill as unknown as T;
  }

  // 10. POST /split-payment
  if (method === "POST" && url === "/split-payment") {
    const req = body as any;
    const payments = loadStorage<Payment[]>(PAYMENTS_KEY, []);

    // Resolve amount if not explicitly given
    let payAmount = req.amount;
    if (typeof payAmount !== "number" || isNaN(payAmount) || payAmount <= 0) {
      const currentBill = handleMockRequest<Bill>("GET", `/bill/${req.session_id}`);
      if (req.mode === "by_seat" && req.seat) {
        const seatLine = currentBill.seats.find((s) => s.seat === req.seat);
        payAmount = seatLine?.pending_amount || seatLine?.total || 0;
      } else if (req.mode === "equal" && req.shares && req.share_index !== null) {
        payAmount = currentBill.equal?.share_amount || Math.round(currentBill.balance / req.shares);
      } else if (req.mode === "group_total") {
        payAmount = currentBill.group_total || currentBill.balance;
      } else {
        payAmount = currentBill.balance;
      }
    }

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      session_id: req.session_id,
      mode: req.mode || "by_seat",
      seat: req.seat ?? null,
      share_index: req.share_index ?? null,
      shares_total: req.shares_total ?? null,
      amount: Math.round(payAmount),
      status: "completed",
      payment_method: "Razorpay / UPI Instant",
      created_at: new Date().toISOString(),
    };
    payments.push(payment);
    saveStorage(PAYMENTS_KEY, payments);

    const bill = handleMockRequest<Bill>("GET", `/bill/${req.session_id}`);
    const result: PaymentResult = {
      payment,
      bill,
      receipt: bill.receipt,
      complete: bill.status === "paid",
    };
    return result as unknown as T;
  }

  // 11. GET /verify/:code
  const verifyMatch = url.match(/^\/verify\/([^/]+)$/);
  if (method === "GET" && verifyMatch) {
    const code = verifyMatch[1];
    const receipts = loadStorage<Record<string, Receipt>>(RECEIPTS_KEY, {});
    const r = Object.values(receipts).find(rec => rec.code.toUpperCase() === code.toUpperCase());
    const res: VerifyResult = {
      valid: !!r,
      table_id: r?.table_id || "T-04",
      amount: r?.amount || 0,
      items_count: r?.items_count || 0,
      paid_at: r?.created_at || new Date().toISOString(),
    };
    return res as unknown as T;
  }

  // 12. GET /table/:table_id/chairs
  const tableChairsMatch = url.match(/^\/table\/([^/]+)\/chairs$/);
  if (method === "GET" && tableChairsMatch) {
    const tid = tableChairsMatch[1];
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const existing = Object.values(sessions).find((s) => s.table_id === tid && s.status === "active");

    const chairs: ChairState[] = [
      {
        chair_id: 1,
        label: "Chair 1 (Host)",
        is_occupied: !!existing,
        occupied_by: existing ? "Host (Active Session)" : undefined,
      },
      {
        chair_id: 2,
        label: "Chair 2 (Guest)",
        is_occupied: !!existing && (existing.claimed_chairs?.includes(2) ?? false),
        occupied_by: existing && existing.claimed_chairs?.includes(2) ? "Claimed by Host" : undefined,
      },
      {
        chair_id: 3,
        label: "Chair 3",
        is_occupied: false,
      },
      {
        chair_id: 4,
        label: "Chair 4",
        is_occupied: false,
      },
    ];
    return chairs as unknown as T;
  }

  // 13. POST /group/pair (Join by 4-digit PIN or QR code)
  if (method === "POST" && url === "/group/pair") {
    const req = body as GroupPairRequest;
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[req.session_id] || (Object.values(sessions)[0] as QRDSession | undefined);

    if (session) {
      session.group_id = `GRP-${req.group_code || "4812"}`;
      session.linked_table_id = "T-05";
      session.linked_members = [
        { table_id: session.table_id, chairs: session.claimed_chairs || [1], name: "Your Table" },
        { table_id: "T-05", chairs: [1, 2], name: "Rohan & Family (Linked)" },
      ];
      sessions[session.id] = session;
      saveStorage(SESSIONS_KEY, sessions);
      return session as unknown as T;
    }
    return { ok: true } as unknown as T;
  }

  // 14. POST /group/leave
  if (method === "POST" && url === "/group/leave") {
    const req = body as { session_id: string };
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[req.session_id];
    if (session) {
      session.group_id = null;
      session.linked_table_id = null;
      session.linked_members = [];
      sessions[session.id] = session;
      saveStorage(SESSIONS_KEY, sessions);
      return session as unknown as T;
    }
    return { ok: true } as unknown as T;
  }

  // 15. POST /auth/logout
  if (method === "POST" && url === "/auth/logout") {
    return { ok: true } as unknown as T;
  }

  // 16. POST /bill/:session_id/enable-checkout (Triggered by Cashier or Diner requesting bill)
  const enableCheckoutMatch = url.match(/^\/bill\/([^/]+)\/enable-checkout$/);
  if (method === "POST" && enableCheckoutMatch) {
    const sid = enableCheckoutMatch[1];
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[sid];
    if (session) {
      const isEnabled = (body as any)?.enabled !== undefined ? (body as any).enabled : true;
      session.checkout_enabled = isEnabled;
      session.meal_status = isEnabled ? "finished" : "dining";
      sessions[sid] = session;
      saveStorage(SESSIONS_KEY, sessions);
    }
    return handleMockRequest<T>("GET", `/bill/${sid}`);
  }

  // 17. POST /bill/:session_id/cashier-discount (Applied strictly by Cashier / Manager at POS terminal)
  const cashierDiscountMatch = url.match(/^\/bill\/([^/]+)\/cashier-discount$/);
  if (method === "POST" && cashierDiscountMatch) {
    const sid = cashierDiscountMatch[1];
    const sessions = loadStorage<Record<string, QRDSession>>(SESSIONS_KEY, {});
    const session = sessions[sid];
    if (session) {
      const discount = (body as any)?.amount || 0;
      const reason = (body as any)?.reason || "Special Courtesy Discount (Manager PIN #4812 Approved)";
      session.cashier_discount = discount;
      session.cashier_discount_reason = reason;
      sessions[sid] = session;
      saveStorage(SESSIONS_KEY, sessions);
    }
    return handleMockRequest<T>("GET", `/bill/${sid}`);
  }

  throw new Error(`Mock endpoint not implemented: ${method} ${path}`);
}
