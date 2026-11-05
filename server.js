const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const STAFF_DIST_DIR = path.join(__dirname, 'staff-ops', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Database helper functions with atomic writes
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { staff: [], orders: [], requests: [], tables: [], attendance: [], leaves: [], financials: {} };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Send JSON response with CORS
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const pathname = decodeURI(urlParts[0]);

  // ===================================================================
  // 1. REST API ROUTES (/api/...)
  // ===================================================================

  // GET /api/state — Unified snapshot
  if (pathname === '/api/state' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db);
  }

  // GET & POST /api/staff
  if (pathname === '/api/staff' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.staff || []);
  }

  if (pathname === '/api/staff' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.staff = db.staff || [];

    // Map UI role to normalized staff role for staff-ops
    const roleLower = (body.role || 'waiter').toLowerCase();
    let staffRole = 'waiter';
    if (roleLower.includes('kitchen') || roleLower.includes('cook') || roleLower.includes('chef')) {
      staffRole = 'kitchen';
    } else if (roleLower.includes('cashier') || roleLower.includes('accountant')) {
      staffRole = 'accountant';
    } else {
      staffRole = 'waiter';
    }

    const assignedId = body.id || (staffRole === 'kitchen' ? `10${String(db.staff.length + 1).padStart(2, '0')}` :
                                    staffRole === 'waiter' ? `20${String(db.staff.length + 1).padStart(2, '0')}` :
                                    `30${String(db.staff.length + 1).padStart(2, '0')}`);

    const newStaff = {
      id: String(assignedId),
      name: body.name || 'New Staff',
      role: body.role || (staffRole === 'kitchen' ? 'Kitchen' : staffRole === 'accountant' ? 'Cashier' : 'Waiter'),
      staffRole: staffRole,
      pin: String(body.pin || assignedId),
      phone: body.phone || '',
      emergencyContact: body.emergencyContact || '',
      aadhaar: body.aadhaar || '',
      pan: body.pan || '',
      address: body.address || '',
      bankName: body.bankName || '',
      accountNumber: body.accountNumber || '',
      ifsc: body.ifsc || '',
      shift: body.shift || 'Morning',
      shiftStart: body.shiftStart || '10:00 AM',
      shiftEnd: body.shiftEnd || '06:00 PM',
      joiningDate: body.joiningDate || new Date().toISOString().slice(0, 10),
      status: body.status || 'Clocked In',
      checkIn: body.checkIn || '10:00 AM',
      rate: Number(body.rate) || 180,
      otRate: (Number(body.rate) || 180) * 2,
      pfApplicable: body.pfApplicable !== false,
      esiApplicable: body.esiApplicable !== false,
      hoursWorked: 200,
      otHours: 0,
      unapprovedAbsences: 0,
      basicMonthly: 12000,
      daMonthly: 2000,
      hraMonthly: 3000
    };

    // Also create initial attendance record for today
    const today = new Date().toISOString().slice(0, 10);
    db.attendance = db.attendance || [];
    db.attendance.push({
      id: `a-${newStaff.id}`,
      staff_id: newStaff.id,
      name: newStaff.name,
      date: today,
      check_in: newStaff.checkIn,
      check_out: null,
      breaks: [],
      status: 'present',
      is_late: false
    });

    db.staff.push(newStaff);
    writeDb(db);
    return sendJson(res, 201, { success: true, staff: newStaff });
  }

  // PUT & PATCH /api/staff/:id — Update existing staff
  if (pathname.startsWith('/api/staff/') && (req.method === 'PUT' || req.method === 'PATCH')) {
    const staffId = pathname.replace('/api/staff/', '');
    const body = await parseJsonBody(req);
    const db = readDb();
    db.staff = db.staff || [];
    const staff = db.staff.find(s => String(s.id) === String(staffId));
    if (!staff) {
      return sendJson(res, 404, { error: 'Staff member not found' });
    }

    // Role mapping
    if (body.role) {
      const roleLower = body.role.toLowerCase();
      if (roleLower.includes('kitchen') || roleLower.includes('cook') || roleLower.includes('chef')) {
        staff.staffRole = 'kitchen';
      } else if (roleLower.includes('cashier') || roleLower.includes('accountant')) {
        staff.staffRole = 'accountant';
      } else {
        staff.staffRole = 'waiter';
      }
      staff.role = body.role;
    }

    if (body.name) {
      staff.name = body.name;
      // Also update name in today's attendance if present
      (db.attendance || []).forEach(a => {
        if (String(a.staff_id) === String(staffId)) {
          a.name = body.name;
        }
      });
    }

    if (body.phone !== undefined) staff.phone = body.phone;
    if (body.emergencyContact !== undefined) staff.emergencyContact = body.emergencyContact;
    if (body.emergency_contact !== undefined) staff.emergencyContact = body.emergency_contact;
    if (body.aadhaar !== undefined) staff.aadhaar = body.aadhaar;
    if (body.pan !== undefined) staff.pan = body.pan;
    if (body.address !== undefined) staff.address = body.address;
    if (body.bankName !== undefined) staff.bankName = body.bankName;
    if (body.accountNumber !== undefined) staff.accountNumber = body.accountNumber;
    if (body.bank_account !== undefined) staff.accountNumber = body.bank_account;
    if (body.ifsc !== undefined) staff.ifsc = body.ifsc;
    if (body.shift !== undefined) staff.shift = body.shift;
    if (body.shiftStart !== undefined) staff.shiftStart = body.shiftStart;
    if (body.shiftEnd !== undefined) staff.shiftEnd = body.shiftEnd;
    if (body.status !== undefined) staff.status = body.status;
    if (body.checkIn !== undefined) staff.checkIn = body.checkIn;
    if (body.rating !== undefined) staff.rating = Math.round(Number(body.rating) * 10) / 10;
    if (body.basicMonthly !== undefined) staff.basicMonthly = Number(body.basicMonthly);
    if (body.daMonthly !== undefined) staff.daMonthly = Number(body.daMonthly);
    if (body.hraMonthly !== undefined) staff.hraMonthly = Number(body.hraMonthly);
    if (body.rate !== undefined) {
      staff.rate = Number(body.rate) || 180;
      staff.otRate = (Number(body.rate) || 180) * 2;
    }
    if (body.pfApplicable !== undefined) staff.pfApplicable = body.pfApplicable !== false;
    if (body.esiApplicable !== undefined) staff.esiApplicable = body.esiApplicable !== false;
    if (body.pin !== undefined && body.pin) staff.pin = String(body.pin);

    writeDb(db);
    return sendJson(res, 200, { success: true, staff });
  }

  // GET, POST & PATCH /api/orders
  if (pathname === '/api/orders' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.orders || []);
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.orders = db.orders || [];

    const orderId = body.id || `ORD-${Math.floor(8400 + Math.random() * 100)}`;
    const newOrder = {
      id: orderId,
      session_id: body.session_id || `sess-${Date.now()}`,
      table_id: body.table_id || 'T-01',
      table_number: body.table_number || body.table_id || 'T-01',
      token: Number(body.token) || 1,
      group_id: body.group_id || null,
      status: body.status || 'new', // 'new', 'preparing', 'ready', 'served'
      is_rush: !!body.is_rush,
      created_at: body.created_at || new Date().toISOString(),
      total: Number(body.total) || 0,
      waiter_id: body.waiter_id ? String(body.waiter_id) : undefined,
      waiter_name: body.waiter_name || body.waiter || undefined,
      items: Array.isArray(body.items) ? body.items : []
    };

    db.orders.unshift(newOrder);

    // Also update corresponding table's orderItems and billAmount
    db.tables = db.tables || [];
    const table = db.tables.find(t => t.id === newOrder.table_id || t.table_number === newOrder.table_number);
    if (table) {
      table.orderItems = table.orderItems || [];
      newOrder.items.forEach(i => {
        const itemStr = `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`;
        if (!table.orderItems.includes(itemStr)) {
          table.orderItems.push(itemStr);
        }
      });
      table.billAmount = (table.billAmount || 0) + newOrder.total;
      table.status = 'occupied';
    }

    writeDb(db);
    return sendJson(res, 201, { success: true, order: newOrder });
  }

  if (pathname.startsWith('/api/orders/') && req.method === 'PATCH') {
    const orderId = pathname.replace('/api/orders/', '');
    const body = await parseJsonBody(req);
    const db = readDb();
    const order = (db.orders || []).find(o => o.id === orderId);
    if (!order) {
      return sendJson(res, 404, { error: 'Order not found' });
    }

    if (body.status) {
      order.status = body.status;
      if (order.items) {
        order.items.forEach(i => { i.status = body.status; });
      }
    }
    if (body.items) {
      order.items = body.items;
    }
    if (body.is_rush !== undefined) {
      order.is_rush = body.is_rush;
    }

    writeDb(db);
    return sendJson(res, 200, { success: true, order });
  }

  // POST /api/orders/cancel-item — Item cancellation & void handler
  if (pathname === '/api/orders/cancel-item' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { orderId, itemId, reason, isCookedOrReady, waiterId, waiterName } = body;
    const db = readDb();
    const order = (db.orders || []).find(o => o.id === orderId);
    if (!order) {
      return sendJson(res, 404, { error: 'Order not found' });
    }

    const item = (order.items || []).find(i => i.id === itemId);
    if (!item) {
      return sendJson(res, 404, { error: 'Item not found in order' });
    }

    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.qty) || 1;
    const itemTotal = itemPrice * itemQty;

    // Check if food has started cooking or is ready
    const isActuallyCooked = isCookedOrReady || item.status === 'preparing' || item.status === 'ready' || order.status === 'preparing' || order.status === 'ready';

    if (isActuallyCooked) {
      // 1. Food is already in kitchen! Cannot unilaterally cancel. Must create Void Approval.
      item.status = 'void_requested';
      db.approvals = db.approvals || [];
      const newApproval = {
        id: Date.now(),
        type: 'Void Item',
        billId: `Order #${order.id} (${order.table_number || order.table_id})`,
        table_id: order.table_id || order.table_number,
        orderId: order.id,
        itemId: item.id,
        itemName: item.name,
        amount: itemTotal,
        discountPct: 0,
        requestor: waiterName || (waiterId ? `Waiter #${waiterId}` : 'Floor Waiter'),
        reason: reason || 'Guest cancelled after preparation started',
        status: 'Pending',
        limitRequired: 'Manager',
        created_at: new Date().toISOString()
      };
      db.approvals.unshift(newApproval);
      writeDb(db);
      return sendJson(res, 200, {
        success: true,
        requiresApproval: true,
        message: 'Food is in preparation / ready. Supervisor void approval requested.',
        approval: newApproval,
        order
      });
    } else {
      // 2. Item is 'new' (Kitchen hasn't started yet). Direct cancellation allowed!
      item.status = 'cancelled';
      order.total = Math.max(0, (Number(order.total) || 0) - itemTotal);

      // Check if all items in order are cancelled
      const activeItems = order.items.filter(i => i.status !== 'cancelled');
      if (activeItems.length === 0) {
        order.status = 'cancelled';
      }

      // Update table billAmount and orderItems
      db.tables = db.tables || [];
      const table = db.tables.find(t => t.id === order.table_id || t.table_number === order.table_number);
      if (table) {
        table.billAmount = Math.max(0, (Number(table.billAmount) || 0) - itemTotal);
        // Remove item name if no active item with that name remains
        if (Array.isArray(table.orderItems)) {
          const itemSearch = item.name.toLowerCase();
          table.orderItems = table.orderItems.filter(str => !str.toLowerCase().startsWith(itemSearch));
        }
      }

      writeDb(db);
      return sendJson(res, 200, {
        success: true,
        requiresApproval: false,
        message: 'Item cancelled before preparation. Table bill adjusted.',
        order,
        table
      });
    }
  }

  // GET, POST & PATCH /api/requests
  if (pathname === '/api/requests' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.requests || []);
  }

  if (pathname === '/api/requests' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.requests = db.requests || [];

    const newReq = {
      id: body.id || `r-${Date.now()}`,
      table_id: body.table_id || 'T-01',
      table_number: body.table_number || body.table_id || 'T-01',
      type: body.type || 'Service Request',
      status: body.status || 'pending',
      created_at: body.created_at || new Date().toISOString(),
      waiter_id: body.waiter_id ? String(body.waiter_id) : undefined,
      waiter: body.waiter || undefined,
      is_food: !!body.is_food,
      food_items: body.food_items || [],
      total: Number(body.total) || 0,
      notes: body.notes || ''
    };

    db.requests.unshift(newReq);
    writeDb(db);
    return sendJson(res, 201, { success: true, request: newReq });
  }

  if (pathname.startsWith('/api/requests/') && req.method === 'PATCH') {
    const reqId = pathname.replace('/api/requests/', '');
    const body = await parseJsonBody(req);
    const db = readDb();
    const reqItem = (db.requests || []).find(r => r.id === reqId);
    if (!reqItem) {
      return sendJson(res, 404, { error: 'Request not found' });
    }

    if (body.status) reqItem.status = body.status;
    if (body.waiter) reqItem.waiter = body.waiter;
    if (body.waiter_id) reqItem.waiter_id = String(body.waiter_id);

    // If accepting a food request, auto-generate kitchen order ticket if requested
    if (body.create_order && reqItem.is_food && reqItem.food_items && reqItem.food_items.length > 0) {
      db.orders = db.orders || [];
      const orderId = `ORD-${Math.floor(8400 + Math.random() * 100)}`;
      const table = (db.tables || []).find(t => t.id === reqItem.table_id || t.table_number === reqItem.table_number);
      const newOrder = {
        id: orderId,
        session_id: (table && table.current_session_id) || `sess-${Date.now()}`,
        table_id: reqItem.table_id,
        table_number: reqItem.table_number,
        token: (table && table.current_token) || 1,
        group_id: (table && table.group_id) || null,
        status: 'new', // Shows in New Incoming KOTs!
        is_rush: false,
        created_at: new Date().toISOString(),
        total: reqItem.total || reqItem.food_items.reduce((s, it) => s + (it.price * it.qty), 0),
        waiter_id: reqItem.waiter_id || (table && table.assigned_waiter_id),
        waiter_name: reqItem.waiter || (table && table.waiter),
        items: reqItem.food_items.map((it, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          menu_id: it.menu_id || `m-${idx}`,
          name: it.name,
          qty: it.qty,
          price: it.price,
          status: 'new',
          station: it.station || 'Grill'
        }))
      };
      db.orders.unshift(newOrder);

      // Update table order items & bill amount
      if (table) {
        table.orderItems = table.orderItems || [];
        newOrder.items.forEach(i => {
          table.orderItems.push(`${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`);
        });
        table.billAmount = (table.billAmount || 0) + newOrder.total;
        table.status = 'occupied';
      }
    }

    writeDb(db);
    return sendJson(res, 200, { success: true, request: reqItem });
  }

  // ===================================================================
  // 1.1 TABLES API (/api/tables) - Claim, Free, Transfer, Update
  // ===================================================================
  if (pathname === '/api/tables' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.tables || []);
  }

  if (pathname.startsWith('/api/tables/') && (req.method === 'PATCH' || req.method === 'PUT')) {
    const tableId = pathname.replace('/api/tables/', '');
    const body = await parseJsonBody(req);
    const db = readDb();
    db.tables = db.tables || [];
    const table = db.tables.find(t => t.id === tableId || t.table_number === tableId);
    if (!table) {
      return sendJson(res, 404, { error: 'Table not found' });
    }

    // Handle claim
    if (body.action === 'claim') {
      table.assigned_waiter_id = String(body.waiter_id);
      table.assigned_waiter_name = body.waiter_name || 'Staff';
      table.waiter = body.waiter_name || 'Staff';
      table.waiter_id = String(body.waiter_id);
      table.status = 'occupied';
      table.timeSeated = 'Just now';
      if (!table.current_session_id) {
        table.current_session_id = `sess-${Date.now()}`;
      }
    }
    // Handle free / release table
    else if (body.action === 'free') {
      table.assigned_waiter_id = null;
      table.assigned_waiter_name = null;
      table.waiter = '—';
      table.waiter_id = null;
      table.status = 'free';
      table.covers = 0;
      table.billAmount = 0;
      table.orderItems = [];
      table.current_session_id = null;
      table.group_id = null;
      table.current_token = table.current_token >= 999 ? 1 : (table.current_token + 1);
    }
    // Handle transfer to another waiter
    else if (body.action === 'transfer') {
      const newWaiterId = String(body.to_waiter_id);
      const newWaiterName = body.to_waiter_name || 'Staff';
      table.assigned_waiter_id = newWaiterId;
      table.assigned_waiter_name = newWaiterName;
      table.waiter = newWaiterName;
      table.waiter_id = newWaiterId;

      // Also transfer active orders & requests of this table to the new waiter
      (db.orders || []).forEach(o => {
        if (o.table_id === table.id || o.table_number === table.table_number) {
          o.waiter_id = newWaiterId;
          o.waiter_name = newWaiterName;
        }
      });
      (db.requests || []).forEach(r => {
        if (r.table_id === table.id || r.table_number === table.table_number) {
          r.waiter_id = newWaiterId;
          r.waiter = newWaiterName;
        }
      });
    }
    // Direct attribute patch
    else {
      Object.assign(table, body);
    }

    writeDb(db);
    return sendJson(res, 200, { success: true, table });
  }

  // GET & POST /api/attendance
  if (pathname === '/api/attendance' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.attendance || []);
  }

  // Manager / Owner Attendance Override
  if (pathname === '/api/attendance/override' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const staffId = body.staffId || body.staff_id;
    const status = body.status;
    const checkIn = body.checkIn || body.check_in;
    const checkOut = body.checkOut || body.check_out;
    const date = body.date || new Date().toISOString().slice(0, 10);
    const reason = body.reason || 'Manager Override';
    const db = readDb();

    // 1. Update Staff list entry
    const s = (db.staff || []).find(x => String(x.id) === String(staffId));
    const today = new Date().toISOString().slice(0, 10);
    const isToday = (date === today);

    const isPresent = status === 'Clocked In' || status === 'On Break' || status === 'present' || status === 'Present';
    const isAbsent = status === 'Absent' || status === 'absent';
    const isLeave = status === 'On Leave' || status === 'leave' || status === 'Leave';
    const isShiftEnded = status === 'Shift Ended';

    if (s && isToday) {
      if (isPresent) {
        s.status = status === 'On Break' ? 'On Break' : 'Clocked In';
        if (checkIn) s.checkIn = checkIn;
      } else if (isAbsent) {
        s.status = 'Absent';
        s.checkIn = '—';
      } else if (isLeave) {
        s.status = 'On Leave';
        s.checkIn = '—';
      } else if (isShiftEnded) {
        s.status = 'Shift Ended';
      }
    }

    // 2. Update attendance record for that date
    db.attendance = db.attendance || [];
    let att = db.attendance.find(a => String(a.staff_id) === String(staffId) && a.date === date);

    let recStatus = 'present';
    if (isAbsent) recStatus = 'absent';
    else if (isLeave) recStatus = 'leave';
    else if (status === 'late' || status === 'Late') recStatus = 'present';

    if (!att) {
      att = {
        id: `a-${staffId}-${date}-${Date.now()}`,
        staff_id: String(staffId),
        name: s ? s.name : 'Staff',
        date: date,
        check_in: checkIn || (isPresent ? '10:00 AM' : null),
        check_out: checkOut || (isShiftEnded ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null),
        breaks: [],
        status: recStatus,
        is_late: status === 'late' || status === 'Late'
      };
      db.attendance.push(att);
    } else {
      att.status = recStatus;
      if (checkIn !== undefined) att.check_in = checkIn;
      if (checkOut !== undefined) att.check_out = checkOut;
      if (isShiftEnded && !att.check_out) {
        att.check_out = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
      if (status === 'late' || status === 'Late') att.is_late = true;
    }

    writeDb(db);
    return sendJson(res, 200, { success: true, staff: s, attendance: att });
  }

  // GET, POST, PUT /api/leaves
  if (pathname === '/api/leaves' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.leaves || []);
  }

  // Staff submits leave from Staff Ops
  if (pathname === '/api/leaves' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.leaves = db.leaves || [];

    const staffMember = (db.staff || []).find(s => s.id === String(body.staff_id));
    const newLeave = {
      id: `l-${Date.now()}`,
      staff_id: String(body.staff_id || ''),
      staffId: String(body.staff_id || ''),
      name: staffMember ? staffMember.name : (body.name || 'Staff'),
      role: staffMember ? staffMember.role : 'Staff',
      from: body.from_date || body.from || '',
      to: body.to_date || body.to || '',
      from_date: body.from_date || body.from || '',
      to_date: body.to_date || body.to || '',
      type: body.type ? (body.type.charAt(0).toUpperCase() + body.type.slice(1)) : 'Casual',
      days: Number(body.days) || 1,
      reason: body.reason || '',
      half_day: !!body.half_day,
      remainingBalance: 5,
      status: 'Pending',
      warning: null,
      created_at: new Date().toISOString()
    };

    db.leaves.unshift(newLeave);
    writeDb(db);
    return sendJson(res, 201, { success: true, leave: newLeave });
  }

  // Owner/Manager approves or rejects leave
  if (pathname.startsWith('/api/leaves/') && (req.method === 'PUT' || req.method === 'PATCH')) {
    const leaveId = pathname.replace('/api/leaves/', '');
    const body = await parseJsonBody(req);
    const db = readDb();
    const leave = (db.leaves || []).find(l => String(l.id) === String(leaveId));
    if (!leave) {
      return sendJson(res, 404, { error: 'Leave request not found' });
    }

    const newStatus = body.status || 'Approved'; // 'Approved' or 'Rejected'
    leave.status = newStatus;

    if (newStatus === 'Approved') {
      const fromDateStr = leave.from || leave.from_date;
      const toDateStr = leave.to || leave.to_date || fromDateStr;

      db.attendance = db.attendance || [];
      const today = new Date().toISOString().slice(0, 10);
      const staffMember = (db.staff || []).find(s => String(s.id) === String(leave.staff_id || leave.staffId));

      if (fromDateStr) {
        const start = new Date(fromDateStr);
        const end = new Date(toDateStr);
        let curr = new Date(start);

        let countDays = 0;
        while (curr <= end && countDays < 60) {
          const dateStr = curr.toISOString().slice(0, 10);
          let att = db.attendance.find(a => String(a.staff_id) === String(leave.staff_id || leave.staffId) && a.date === dateStr);
          if (!att) {
            att = {
              id: `a-leave-${leave.staff_id || leave.staffId}-${dateStr}`,
              staff_id: String(leave.staff_id || leave.staffId),
              name: leave.name || (staffMember ? staffMember.name : 'Staff'),
              date: dateStr,
              check_in: null,
              check_out: null,
              breaks: [],
              status: 'leave',
              is_late: false,
              leave_id: leave.id,
              leave_type: leave.type
            };
            db.attendance.push(att);
          } else {
            att.status = 'leave';
            att.leave_id = leave.id;
            att.leave_type = leave.type;
          }

          // If current leave includes today, update staff live status
          if (dateStr === today && staffMember) {
            staffMember.status = 'On Leave';
            staffMember.checkIn = '—';
          }

          curr.setDate(curr.getDate() + 1);
          countDays++;
        }
      }

      leave.remainingBalance = Math.max(0, (leave.remainingBalance || 5) - (leave.days || 1));
    }

    writeDb(db);
    return sendJson(res, 200, { success: true, leave });
  }

  // ===================================================================
  // 1.2 BILLS & SETTLEMENTS API (/api/bills)
  // ===================================================================
  if (pathname === '/api/bills' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.bills || []);
  }

  if (pathname === '/api/bills/pay' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.bills = db.bills || [];
    db.financials = db.financials || { todayRevenue: 0, collections: { cash: 0, upi: 0, card: 0 } };
    db.financials.collections = db.financials.collections || { cash: 0, upi: 0, card: 0 };

    const billId = body.billId;
    const method = (body.method || 'cash').toLowerCase();
    const total = Number(body.total) || 0;
    const tableId = body.table_id || body.tableId;

    let bill = db.bills.find(b => b.id === billId);
    if (bill) {
      bill.status = 'paid';
      bill.method = method;
      bill.paid_at = new Date().toISOString();
      if (body.receipt_code) bill.receipt_code = body.receipt_code;
      if (body.verify_code) bill.verify_code = body.verify_code;
      if (body.customer_phone) bill.customer_phone = body.customer_phone;
    } else if (billId) {
      bill = {
        id: billId,
        table_id: tableId || 'T-01',
        table_number: tableId || 'T-01',
        subtotal: total,
        cgst: Number((total * 0.025).toFixed(2)),
        sgst: Number((total * 0.025).toFixed(2)),
        discount: 0,
        total: total,
        status: 'paid',
        method: method,
        receipt_code: body.receipt_code || `RCP-${Date.now().toString().slice(-6)}`,
        verify_code: body.verify_code || Math.random().toString(36).slice(2, 8).toUpperCase(),
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      db.bills.unshift(bill);
    }

    // Update collections by payment method
    if (method === 'split') {
      db.financials.collections.cash = (db.financials.collections.cash || 0) + (Number(body.splitCash) || 0);
      db.financials.collections.upi = (db.financials.collections.upi || 0) + (Number(body.splitUpi) || 0);
      db.financials.collections.card = (db.financials.collections.card || 0) + (Number(body.splitCard) || 0);
    } else if (method === 'upi') {
      db.financials.collections.upi = (db.financials.collections.upi || 0) + total;
    } else if (method === 'card') {
      db.financials.collections.card = (db.financials.collections.card || 0) + total;
    } else {
      db.financials.collections.cash = (db.financials.collections.cash || 0) + total;
    }

    db.financials.todayRevenue = (db.financials.todayRevenue || 0) + total;
    db.financials.expectedCash = db.financials.collections.cash;

    // Free the table
    db.tables = db.tables || [];
    const table = db.tables.find(t => t.id === tableId || t.table_number === tableId || (bill && (t.id === bill.table_id || t.table_number === bill.table_number)));
    if (table) {
      table.status = 'free';
      table.billAmount = 0;
      table.covers = 0;
      table.orderItems = [];
      table.waiter = '—';
      table.assigned_waiter_id = null;
      table.assigned_waiter_name = null;
      table.current_session_id = null;
      table.current_token = table.current_token >= 999 ? 1 : ((table.current_token || 1) + 1);
    }

    writeDb(db);
    return sendJson(res, 200, { success: true, bill, table, financials: db.financials });
  }

  if (pathname === '/api/bills/discount' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.bills = db.bills || [];
    const bill = db.bills.find(b => b.id === body.billId);
    if (bill) {
      const discountVal = Number(body.discountAmount) || Number(body.calcDiscount) || 0;
      bill.discount = discountVal;
      bill.total = Math.max(0, bill.total - discountVal);
    }
    if (Number(body.discountPercent) > 15) {
      db.approvals = db.approvals || [];
      db.approvals.unshift({
        id: Date.now(),
        type: 'Discount',
        billId: `Bill #${body.billId}`,
        amount: bill ? bill.total : 0,
        discountPct: Number(body.discountPercent),
        requestor: body.requestor || 'Cashier Desk',
        reason: body.reason || `Discount >15% (${body.discountPercent}%) requires Owner verification`,
        status: 'Pending',
        limitRequired: 'Owner'
      });
    }
    writeDb(db);
    return sendJson(res, 200, { success: true, bill });
  }

  if (pathname === '/api/bills/void' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.bills = db.bills || [];
    const bill = db.bills.find(b => b.id === body.billId);
    if (bill) {
      bill.status = 'void';
      bill.void_reason = body.reason || 'Void requested';
    }
    db.approvals = db.approvals || [];
    db.approvals.unshift({
      id: Date.now(),
      type: 'Void Item',
      billId: `Bill #${body.billId}`,
      amount: bill ? bill.total : 0,
      discountPct: 0,
      requestor: body.requestor || 'Cashier Desk',
      reason: body.reason || 'Guest check voided',
      status: 'Pending',
      limitRequired: 'Manager'
    });
    writeDb(db);
    return sendJson(res, 200, { success: true, bill });
  }

  // ===================================================================
  // 1.3 PETTY CASH API (/api/petty-cash)
  // ===================================================================
  if (pathname === '/api/petty-cash' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.pettyCash || []);
  }

  if (pathname === '/api/petty-cash' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    db.pettyCash = db.pettyCash || [];
    const newEntry = {
      id: body.id || `pc-${Date.now()}`,
      purpose: body.purpose || 'Emergency expense',
      paid_to: body.paid_to || body.payee || 'Vendor',
      payee: body.paid_to || body.payee || 'Vendor',
      amount: Number(body.amount) || 0,
      category: body.category || 'Misc',
      created_at: body.created_at || new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
      created_by: body.created_by || '3003',
      approvedBy: body.approvedBy || 'Rajesh Kumar (Manager)'
    };
    db.pettyCash.unshift(newEntry);
    writeDb(db);
    return sendJson(res, 201, { success: true, entry: newEntry });
  }

  if (pathname.startsWith('/api/petty-cash/') && req.method === 'DELETE') {
    const pcId = pathname.replace('/api/petty-cash/', '');
    const db = readDb();
    db.pettyCash = (db.pettyCash || []).filter(p => String(p.id) !== String(pcId));
    writeDb(db);
    return sendJson(res, 200, { success: true });
  }

  // ===================================================================
  // 1.4 SUPERVISOR APPROVALS API (/api/approvals)
  // ===================================================================
  if (pathname === '/api/approvals' && req.method === 'GET') {
    const db = readDb();
    return sendJson(res, 200, db.approvals || []);
  }

  if (pathname.startsWith('/api/approvals/') && (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST')) {
    const appId = pathname.replace('/api/approvals/', '');
    const body = await parseJsonBody(req);
    const db = readDb();
    const item = (db.approvals || []).find(a => String(a.id) === String(appId));
    if (item) {
      item.status = body.status || 'Approved';

      // If a Void Item approval is approved by Manager/Owner, deduct from Table and Order
      if (item.type === 'Void Item') {
        const order = (db.orders || []).find(o => o.id === item.orderId);
        if (order) {
          const orderItem = (order.items || []).find(i => i.id === item.itemId);
          if (orderItem) {
            orderItem.status = item.status === 'Approved' ? 'voided' : 'ready';
          }
          if (item.status === 'Approved') {
            order.total = Math.max(0, (Number(order.total) || 0) - (Number(item.amount) || 0));
          }
        }

        if (item.status === 'Approved') {
          const table = (db.tables || []).find(t => t.id === item.table_id || t.table_number === item.table_id);
          if (table) {
            table.billAmount = Math.max(0, (Number(table.billAmount) || 0) - (Number(item.amount) || 0));
          }
        }
      }

      writeDb(db);
      return sendJson(res, 200, { success: true, approval: item });
    }
    return sendJson(res, 404, { error: 'Approval item not found' });
  }

  // ===================================================================
  // 2. STATIC FILE SERVING
  // ===================================================================


  if (pathname.startsWith('/staff')) {
    let subPath = pathname.replace(/^\/staff\/?/, '');
    if (!subPath || subPath === '') subPath = 'index.html';
    const filePath = path.join(STAFF_DIST_DIR, subPath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to staff index.html for SPA
        const fallbackPath = path.join(STAFF_DIST_DIR, 'index.html');
        fs.readFile(fallbackPath, (fbErr, content) => {
          if (fbErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Staff App Not Found. Please build QR-Cafe-staff-ops.');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          }
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  // Default: Serve Owner Ops files
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, content) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`QR-Cafe Unified Ops Server running at http://localhost:${PORT}`);
  console.log(`Owner Ops: http://localhost:${PORT}/`);
  console.log(`Staff Ops: http://localhost:${PORT}/staff/`);
  console.log(`API State: http://localhost:${PORT}/api/state`);
});
