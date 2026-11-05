/**
 * ===================================================================
 * QR-Cafe — THE DEFINITIVE ENTERPRISE STATE & DATA STORE
 * Indian Restaurant ERP Architecture (Zero-Bug Specification)
 * ===================================================================
 */

const STATE = {
  // Current active user & role ('owner' or 'manager')
  user: {
    name: 'Anika Rao',
    role: 'owner', // Default role; can toggle to 'manager' in UI
    initials: 'AR',
    email: 'owner@qr-cafe.demo'
  },

  theme: 'dark', // 'dark', 'amoled', 'light'
  currentPage: 'dashboard',

  // Security & Owner Override Protocol
  ownerPin: '9999',     // Owner PIN for authorization overrides
  managerPin: '1234',   // Standard Manager PIN for everyday approvals
  ownerOverrideUntil: null, // Timestamp when current 5-minute override expires
  
  audit_logs: [
    { id: 1, timestamp: '10:15 AM', actor: 'Rajesh Kumar (Manager)', action: 'Owner Override', detail: 'Authorized Base Salary adjustment for ST-108' },
    { id: 2, timestamp: '11:42 AM', actor: 'Rajesh Kumar (Manager)', action: 'Attendance Override', detail: 'Priya Sharma marked Late -> Present (Reason: Metro delay)' },
    { id: 3, timestamp: '01:20 PM', actor: 'Anika Rao (Owner)', action: 'Menu Price Edit', detail: 'Updated Butter Chicken Dine-in from ₹360 to ₹380' }
  ],

  // 1. Staff & Indian Payroll Engine (Full KYC, Statutory PF/ESI, Indian Labor Law Rules)
  staff: [
    {
      id: 'ST-104',
      name: 'Priya Sharma',
      role: 'Waiter',
      phone: '9876543210',
      emergencyContact: 'Ramesh Sharma (Father) - 9876543299',
      aadhaar: '5421 8901 2345',
      pan: 'ABCPS1234D',
      address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
      bankName: 'HDFC Bank',
      accountNumber: '50100432198765',
      ifsc: 'HDFC0001234',
      shift: 'Morning',
      shiftStart: '10:00 AM',
      shiftEnd: '06:00 PM',
      joiningDate: '2023-04-12',
      status: 'Clocked In', // 'Clocked In', 'On Break', 'Absent', 'Shift Ended'
      checkIn: '09:55 AM',
      rate: 180, // Base hourly rate (₹) [OWNER ONLY]
      otRate: 360, // 2x mandatory OT rate
      rating: 4.8,
      pfApplicable: true,
      esiApplicable: true,
      pin: '1041',
      hoursWorked: 208,
      otHours: 6,
      unapprovedAbsences: 0,
      basicMonthly: 14000,
      daMonthly: 2500,
      hraMonthly: 3500
    },
    {
      id: 'ST-108',
      name: 'Arjun Nair',
      role: 'Kitchen',
      phone: '9876543211',
      emergencyContact: 'Lakshmi Nair (Spouse) - 9876543288',
      aadhaar: '6521 9901 4321',
      pan: 'ABCPN5678E',
      address: '22/B, 1st Cross, Ejipura, Bengaluru',
      bankName: 'State Bank of India',
      accountNumber: '302005432198',
      ifsc: 'SBIN0004567',
      shift: 'Morning',
      shiftStart: '09:00 AM',
      shiftEnd: '05:00 PM',
      joiningDate: '2022-11-01',
      status: 'Clocked In',
      checkIn: '09:18 AM', // Late
      rate: 220,
      otRate: 440,
      rating: 4.9,
      pfApplicable: true,
      esiApplicable: true,
      pin: '1082',
      hoursWorked: 212,
      otHours: 8,
      unapprovedAbsences: 1,
      basicMonthly: 16000,
      daMonthly: 3000,
      hraMonthly: 4000
    },
    {
      id: 'ST-112',
      name: 'Meera Patel',
      role: 'Cashier',
      phone: '9876543212',
      emergencyContact: 'Deepak Patel (Brother) - 9876543277',
      aadhaar: '7412 3344 5566',
      pan: 'ABCPP9012F',
      address: '15, 8th Main, Koramangala 4th Block, Bengaluru',
      bankName: 'ICICI Bank',
      accountNumber: '109805001234',
      ifsc: 'ICIC0001098',
      shift: 'All',
      shiftStart: '11:00 AM',
      shiftEnd: '09:00 PM',
      joiningDate: '2023-01-15',
      status: 'On Break',
      checkIn: '10:50 AM',
      rate: 200,
      otRate: 400,
      rating: 4.7,
      pfApplicable: true,
      esiApplicable: true,
      pin: '1123',
      hoursWorked: 200,
      otHours: 4,
      unapprovedAbsences: 0,
      basicMonthly: 15000,
      daMonthly: 2500,
      hraMonthly: 3500
    },
    {
      id: 'ST-115',
      name: 'Rahul Verma',
      role: 'Kitchen',
      phone: '9876543213',
      emergencyContact: 'Sunita Verma (Mother) - 9876543266',
      aadhaar: '8901 2233 4455',
      pan: 'ABCPV3456G',
      address: '67, Old Airport Road, Domlur, Bengaluru',
      bankName: 'Axis Bank',
      accountNumber: '912010045678',
      ifsc: 'UTIB0000876',
      shift: 'Evening',
      shiftStart: '02:00 PM',
      shiftEnd: '11:00 PM',
      joiningDate: '2023-08-20',
      status: 'Clocked In',
      checkIn: '01:50 PM',
      rate: 210,
      otRate: 420,
      rating: 4.8,
      pfApplicable: true,
      esiApplicable: true,
      pin: '1154',
      hoursWorked: 204,
      otHours: 6,
      unapprovedAbsences: 0,
      basicMonthly: 15500,
      daMonthly: 2800,
      hraMonthly: 3700
    },
    {
      id: 'ST-118',
      name: 'Sneha Iyer',
      role: 'Waiter',
      phone: '9876543214',
      emergencyContact: 'K. Iyer (Father) - 9876543255',
      aadhaar: '9012 3344 5577',
      pan: 'ABCPI7890H',
      address: '104, BTM 2nd Stage, Bengaluru',
      bankName: 'Canara Bank',
      accountNumber: '0432101098765',
      ifsc: 'CNRB0000432',
      shift: 'Morning',
      shiftStart: '10:00 AM',
      shiftEnd: '06:00 PM',
      joiningDate: '2024-01-10',
      status: 'Clocked In',
      checkIn: '10:10 AM',
      rate: 175,
      otRate: 350,
      rating: 4.9,
      pfApplicable: true,
      esiApplicable: true,
      pin: '1185',
      hoursWorked: 196,
      otHours: 2,
      unapprovedAbsences: 0,
      basicMonthly: 13500,
      daMonthly: 2200,
      hraMonthly: 3000
    },
    {
      id: 'ST-120',
      name: 'Vikram Singh',
      role: 'Cleaner',
      phone: '9876543215',
      emergencyContact: 'Manjeet Singh (Brother) - 9876543244',
      aadhaar: '1234 5678 9012',
      pan: 'ABCPS2345J',
      address: 'Koramangala Slum Board, Bengaluru',
      bankName: 'Punjab National Bank',
      accountNumber: '21000021001234',
      ifsc: 'PUNB0210000',
      shift: 'Morning',
      shiftStart: '08:30 AM',
      shiftEnd: '04:30 PM',
      joiningDate: '2023-06-01',
      status: 'Absent',
      checkIn: '—',
      rate: 120,
      otRate: 240,
      rating: 4.6,
      pfApplicable: true,
      esiApplicable: true,
      pin: '1206',
      hoursWorked: 160,
      otHours: 0,
      unapprovedAbsences: 2,
      basicMonthly: 8500,
      daMonthly: 1500,
      hraMonthly: 1800
    }
  ],

  // 2. Attendance & Leave Workflow
  leaves: [
    { id: 1, staffId: 'ST-104', name: 'Priya Sharma', role: 'Waiter', type: 'Casual', from: '2024-05-18', to: '2024-05-19', days: 2, reason: 'Sister wedding in Mysore', remainingBalance: 6, status: 'Pending', warning: null },
    { id: 2, staffId: 'ST-108', name: 'Arjun Nair', role: 'Kitchen', type: 'Sick', from: '2024-05-18', to: '2024-05-18', days: 1, reason: 'Severe viral fever', remainingBalance: 4, status: 'Pending', warning: 'Approving this will leave Kitchen understaffed on Saturday Night.' },
    { id: 3, staffId: 'ST-115', name: 'Rahul Verma', role: 'Kitchen', type: 'Casual', from: '2024-05-22', to: '2024-05-24', days: 3, reason: 'Family property registration', remainingBalance: 5, status: 'Pending', warning: null }
  ],

  // Shift Planning Roster (Mon - Sun, Morning & Evening slots)
  shiftRoster: {
    'Monday': { Morning: ['ST-104', 'ST-108', 'ST-112'], Evening: ['ST-115', 'ST-118'] },
    'Tuesday': { Morning: ['ST-104', 'ST-108', 'ST-112'], Evening: ['ST-115', 'ST-118'] },
    'Wednesday': { Morning: ['ST-104', 'ST-108', 'ST-112'], Evening: ['ST-115', 'ST-118'] },
    'Thursday': { Morning: ['ST-104', 'ST-108', 'ST-112'], Evening: ['ST-115', 'ST-118'] },
    'Friday': { Morning: ['ST-104', 'ST-108', 'ST-112'], Evening: ['ST-115', 'ST-118'] },
    'Saturday': { Morning: ['ST-104', 'ST-108', 'ST-118'], Evening: ['ST-112', 'ST-115'] },
    'Sunday': { Morning: ['ST-104', 'ST-108', 'ST-118'], Evening: ['ST-112', 'ST-115'] }
  },

  payrollLocked: false,

  // 3. Menu & Pricing (Hindi + English, BCG Matrix, Aggregator Sync)
  categories: ['All', 'Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts'],
  menu: [
    {
      id: 'M001',
      name: 'Paneer Butter Masala',
      nameHi: 'पनीर बटर मसाला',
      category: 'Main Course',
      isVeg: true,
      station: 'Grill',
      prepTime: 18,
      dineIn: 320,
      online: 350,
      takeaway: 300,
      cost: 92,
      sales30: 420,
      autoSyncOutOfStock: true,
      hsn: '2106',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300'
    },
    {
      id: 'M002',
      name: 'Butter Chicken',
      nameHi: 'बटर चिकन',
      category: 'Main Course',
      isVeg: false,
      station: 'Grill',
      prepTime: 22,
      dineIn: 380,
      online: 420,
      takeaway: 360,
      cost: 138,
      sales30: 510,
      autoSyncOutOfStock: true,
      hsn: '1601',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300'
    },
    {
      id: 'M003',
      name: 'Dal Makhani',
      nameHi: 'दाल मखनी',
      category: 'Main Course',
      isVeg: true,
      station: 'Grill',
      prepTime: 15,
      dineIn: 260,
      online: 280,
      takeaway: 240,
      cost: 54,
      sales30: 380,
      autoSyncOutOfStock: true,
      hsn: '2106',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300'
    },
    {
      id: 'M004',
      name: 'Garlic Naan',
      nameHi: 'गार्लिक नान',
      category: 'Breads',
      isVeg: true,
      station: 'Fry',
      prepTime: 8,
      dineIn: 80,
      online: 90,
      takeaway: 70,
      cost: 16,
      sales30: 890,
      autoSyncOutOfStock: true,
      hsn: '1905',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300'
    },
    {
      id: 'M005',
      name: 'Masala Chai',
      nameHi: 'मसाला चाय',
      category: 'Beverages',
      isVeg: true,
      station: 'Bar',
      prepTime: 6,
      dineIn: 40,
      online: 50,
      takeaway: 35,
      cost: 8,
      sales30: 1200,
      autoSyncOutOfStock: false,
      hsn: '0902',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=300'
    },
    {
      id: 'M006',
      name: 'Gulab Jamun (2pc)',
      nameHi: 'गुलाब जामुन',
      category: 'Desserts',
      isVeg: true,
      station: 'Dessert',
      prepTime: 5,
      dineIn: 120,
      online: 140,
      takeaway: 110,
      cost: 32,
      sales30: 210,
      autoSyncOutOfStock: true,
      hsn: '2106',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300'
    },
    {
      id: 'M007',
      name: 'Tandoori Chicken (Half)',
      nameHi: 'तंदूरी चिकन',
      category: 'Starters',
      isVeg: false,
      station: 'Grill',
      prepTime: 25,
      dineIn: 290,
      online: 320,
      takeaway: 280,
      cost: 125,
      sales30: 310,
      autoSyncOutOfStock: true,
      hsn: '1601',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300'
    }
  ],

  // 4. Raw Material Inventory & Recipes (Auto-Deduction & Food Cost %)
  inventory: [
    { id: 'I001', name: 'Paneer (Fresh Malai)', unit: 'kg', stock: 12.5, reorder: 6.0, rate: 320, vendor: 'Local Mandi', expiry: '2024-05-20' },
    { id: 'I002', name: 'Chicken (Boneless Breast)', unit: 'kg', stock: 18.0, reorder: 8.0, rate: 280, vendor: 'Hyperpure by Zomato', expiry: '2024-05-19' },
    { id: 'I003', name: 'Amul Butter (Yellow)', unit: 'kg', stock: 4.2, reorder: 3.0, rate: 480, vendor: 'DMart Wholesale', expiry: '2024-06-15' },
    { id: 'I004', name: 'Refined Sunflower Oil', unit: 'L', stock: 22.0, reorder: 10.0, rate: 140, vendor: 'DMart Wholesale', expiry: null },
    { id: 'I005', name: 'Maida (Fine Wheat Flour)', unit: 'kg', stock: 8.0, reorder: 15.0, rate: 45, vendor: 'Local Mandi', expiry: null }, // Low stock!
    { id: 'I006', name: 'Fresh Buffalo Milk', unit: 'L', stock: 4.5, reorder: 8.0, rate: 60, vendor: 'Amul Distributor', expiry: '2024-05-17' }, // Low stock!
    { id: 'I007', name: 'Black Urad Dal', unit: 'kg', stock: 14.0, reorder: 5.0, rate: 120, vendor: 'Local Mandi', expiry: null }
  ],

  recipes: {
    'M001': [{ ing: 'I001', qty: 0.20 }, { ing: 'I003', qty: 0.05 }, { ing: 'I004', qty: 0.03 }],
    'M002': [{ ing: 'I002', qty: 0.25 }, { ing: 'I003', qty: 0.06 }, { ing: 'I004', qty: 0.04 }],
    'M003': [{ ing: 'I007', qty: 0.15 }, { ing: 'I003', qty: 0.04 }, { ing: 'I006', qty: 0.10 }],
    'M004': [{ ing: 'I005', qty: 0.12 }, { ing: 'I003', qty: 0.02 }]
  },

  vendors: [
    { id: 'V1', name: 'Local Mandi Wholesalers', contact: '+91 98123 45678', items: 'Paneer, Dal, Vegetables, Flours', outstanding: 18500, lastPO: '2024-05-14' },
    { id: 'V2', name: 'Hyperpure by Zomato', contact: '1800-123-456', items: 'Poultry, Meat, Spices', outstanding: 42000, lastPO: '2024-05-16' },
    { id: 'V3', name: 'DMart Wholesale Koramangala', contact: '080-45678900', items: 'Butter, Oils, Packaged goods', outstanding: 8900, lastPO: '2024-05-10' }
  ],

  wastageLogs: [
    { id: 1, date: '2024-05-15', item: 'Fresh Buffalo Milk', qty: '2 L', reason: 'Sour / curdled before boiling', cost: 120 },
    { id: 2, date: '2024-05-16', item: 'Chicken (Boneless Breast)', qty: '1.5 kg', reason: 'Dropped during prep', cost: 420 }
  ],

  // 5. Floor Plan, Tables & QR Management
  tables: [
    { id: 'T-01', capacity: 4, zone: 'Indoor Main', status: 'Occupied', waiter: 'Priya Sharma', timeSeated: '42 min ago', covers: 3, billAmount: 850, orderItems: ['Paneer Butter Masala', 'Garlic Naan x2'], mergedWith: null },
    { id: 'T-02', capacity: 2, zone: 'Indoor Main', status: 'Billing Pending', waiter: 'Sneha Iyer', timeSeated: '55 min ago', covers: 2, billAmount: 620, orderItems: ['Dal Makhani', 'Garlic Naan x2'], mergedWith: null },
    { id: 'T-03', capacity: 6, zone: 'Indoor Main', status: 'Free', waiter: '—', timeSeated: '—', covers: 0, billAmount: 0, orderItems: [], mergedWith: null },
    { id: 'T-04', capacity: 4, zone: 'AC Family', status: 'Occupied', waiter: 'Priya Sharma', timeSeated: '28 min ago', covers: 4, billAmount: 1420, orderItems: ['Butter Chicken', 'Dal Makhani', 'Garlic Naan x4'], mergedWith: null },
    { id: 'T-05', capacity: 4, zone: 'AC Family', status: 'Cleaning', waiter: '—', timeSeated: '—', covers: 0, billAmount: 0, orderItems: [], mergedWith: null },
    { id: 'T-06', capacity: 8, zone: 'AC Family', status: 'Occupied', waiter: 'Sneha Iyer', timeSeated: '1 hr 10 min ago', covers: 7, billAmount: 2890, orderItems: ['Butter Chicken x2', 'Paneer Butter Masala', 'Garlic Naan x6', 'Gulab Jamun x3'], mergedWith: null },
    { id: 'T-07', capacity: 2, zone: 'Rooftop Lounge', status: 'Occupied', waiter: 'Priya Sharma', timeSeated: '15 min ago', covers: 2, billAmount: 480, orderItems: ['Tandoori Chicken', 'Masala Chai x2'], mergedWith: null },
    { id: 'T-08', capacity: 4, zone: 'Rooftop Lounge', status: 'Free', waiter: '—', timeSeated: '—', covers: 0, billAmount: 0, orderItems: [], mergedWith: null },
    { id: 'T-09', capacity: 4, zone: 'Rooftop Lounge', status: 'Free', waiter: '—', timeSeated: '—', covers: 0, billAmount: 0, orderItems: [], mergedWith: null },
    { id: 'T-10', capacity: 6, zone: 'Rooftop Lounge', status: 'Occupied', waiter: 'Sneha Iyer', timeSeated: '35 min ago', covers: 5, billAmount: 1950, orderItems: ['Butter Chicken', 'Tandoori Chicken', 'Dal Makhani'], mergedWith: null },
    { id: 'T-11', capacity: 4, zone: 'Outdoor Patio', status: 'Occupied', waiter: 'Priya Sharma', timeSeated: '12 min ago', covers: 3, billAmount: 760, orderItems: ['Paneer Butter Masala', 'Garlic Naan x3'], mergedWith: null },
    { id: 'T-12', capacity: 2, zone: 'Outdoor Patio', status: 'Free', waiter: '—', timeSeated: '—', covers: 0, billAmount: 0, orderItems: [], mergedWith: null }
  ],

  // 6. Live Operations: Kitchen Kanban, Waiter Coverage, Cashier Collections
  kitchenOrders: [
    { id: 'ORD-8422', table: 'T-07', items: ['Tandoori Chicken (Half)', 'Masala Chai x2'], status: 'New', timeElapsedMin: 14, source: 'Staff Ops Waiter' }, // > 10m -> Red Pulse!
    { id: 'ORD-8425', table: 'T-11', items: ['Paneer Butter Masala', 'Garlic Naan x3'], status: 'New', timeElapsedMin: 4, source: 'QR-Cafe Mobile' },
    { id: 'ORD-8418', table: 'T-04', items: ['Butter Chicken', 'Dal Makhani', 'Garlic Naan x4'], status: 'Preparing', timeElapsedMin: 16, source: 'Staff Ops Waiter' },
    { id: 'ORD-8415', table: 'T-01', items: ['Paneer Butter Masala', 'Garlic Naan x2'], status: 'Preparing', timeElapsedMin: 12, source: 'Staff Ops Waiter' },
    { id: 'ORD-8412', table: 'T-06', items: ['Gulab Jamun (2pc) x3'], status: 'Ready', timeElapsedMin: 8, source: 'Staff Ops Waiter' }
  ],

  waiterRequests: [
    { table: 'T-02', request: 'Requested Drinking Water', time: '2 min ago', waiter: 'Sneha Iyer' },
    { table: 'T-06', request: 'Extra Cutlery & Napkins', time: '5 min ago', waiter: 'Sneha Iyer' },
    { table: 'T-11', request: 'Bill Requested', time: '1 min ago', waiter: 'Priya Sharma' }
  ],

  // 7. Financials, Day-Close, Bills & Approvals
  financials: {
    todayRevenue: 47850,
    yesterdayRevenue: 42720,
    todayBillsCount: 52,
    collections: {
      cash: 12450,
      upi: 28500,
      card: 6900
    },
    expectedCash: 12450,
    actualDrawerCash: 12380, // ₹70 discrepancy
    discrepancyReason: '',
    dayFinalized: false,
    hourlyRevenue: [
      { hour: '11 AM', rev: 2800 },
      { hour: '12 PM', rev: 6400 },
      { hour: '01 PM', rev: 11200 },
      { hour: '02 PM', rev: 9800 },
      { hour: '03 PM', rev: 3200 },
      { hour: '04 PM', rev: 2100 },
      { hour: '05 PM', rev: 4100 },
      { hour: '06 PM', rev: 8250 }
    ]
  },

  bills: [],

  approvals: [
    { id: 101, type: 'Discount', billId: 'Bill #B-1042', amount: 2000, discountPct: 15, requestor: 'Meera Patel (Cashier)', reason: 'Regular corporate customer (Wipro)', status: 'Pending', limitRequired: 'Manager' },
    { id: 102, type: 'Discount', billId: 'Bill #B-1049', amount: 4800, discountPct: 25, requestor: 'Meera Patel (Cashier)', reason: 'Party group complained of delayed starters', status: 'Pending', limitRequired: 'Owner' }, // Exceeds 15% Manager limit!
    { id: 103, type: 'Void Item', billId: 'Bill #B-1051', amount: 380, discountPct: 0, requestor: 'Priya Sharma (Waiter)', reason: 'Guest allergic to dairy; cancel Butter Chicken after KOT', status: 'Pending', limitRequired: 'Manager' },
    { id: 104, type: 'Purchase Order', billId: 'PO-2024-88', amount: 9600, discountPct: 0, requestor: 'System Auto-PO', reason: 'Paneer 30kg bulk replenish from Local Mandi', status: 'Pending', limitRequired: 'Owner' }
  ],

  pettyCash: [
    { id: 1, date: '2024-05-17', category: 'Cleaning Supplies', amount: 450, payee: 'Sri Balaji General Stores', approvedBy: 'Rajesh Kumar' },
    { id: 2, date: '2024-05-17', category: 'Staff Tea / Refreshments', amount: 180, payee: 'Corner Tea Stall', approvedBy: 'Rajesh Kumar' }
  ],

  activityFeed: [
    { id: 1, time: '2 min ago', text: 'Table T-02 settled ₹620 via UPI (Google Pay)', type: 'normal' },
    { id: 2, time: '6 min ago', text: 'Table T-07 order #ORD-8422 in New for > 10 min', type: 'critical' },
    { id: 3, time: '14 min ago', text: 'Fresh Buffalo Milk stock dropped below 8 L threshold', type: 'critical' },
    { id: 4, time: '22 min ago', text: 'Cashier Meera Patel requested 15% discount on Bill #B-1042', type: 'normal' },
    { id: 5, time: '35 min ago', text: 'Arjun Nair clocked in late (09:18 AM)', type: 'normal' },
    { id: 6, time: '48 min ago', text: 'PO #87 generated for Chicken 25kg to Hyperpure', type: 'normal' }
  ],

  // 8. Settings & Business Rules [OWNER ONLY]
  settings: {
    outletName: 'QR-Cafe Restaurant & Rooftop Bar',
    branch: 'Koramangala 5th Block, Bengaluru',
    gstin: '29AABCT1332L1ZV',
    fssai: '11223344556677',
    cgstRate: 2.5,
    sgstRate: 2.5,
    taxInclusive: false,
    managerDiscountLimit: 15, // Manager max discount without Owner PIN
    managerVoidLimit: 500,     // Manager max void amount without Owner PIN
    zomatoApiKey: 'zom_live_981a8b7c3d2e1f4a5b6c',
    swiggyApiKey: 'swig_prod_4431a2b3c4d5e6f7a8b9',
    autoSyncAggregators: true,
    watiToken: 'wati_sec_884920491823901928301',
    printerIp: '192.168.1.100',
    printerPort: 9100,
    printerSize: '80mm',
    autoOpenCashDrawer: true
  }
};

// 9. Master Navigation Items (Exact specifications from Section 2)
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', access: 'BOTH' },
  { id: 'live', label: 'Live Operations', icon: 'live', access: 'BOTH' },
  { id: 'staff', label: 'Staff & Payroll', icon: 'users', access: 'BOTH' }, // Salary config is OWNER ONLY
  { id: 'attendance', label: 'Attendance & Leave', icon: 'calendar', access: 'BOTH', badge: () => STATE.leaves.filter(l => l.status === 'Pending').length },
  { id: 'inventory', label: 'Inventory & Recipes', icon: 'box', access: 'BOTH', badge: () => STATE.inventory.filter(i => i.stock <= i.reorder).length },
  { id: 'menu', label: 'Menu & Pricing', icon: 'menu', access: 'BOTH' }, // Price edit is OWNER ONLY
  { id: 'tables', label: 'Tables & QR', icon: 'table', access: 'BOTH' },
  { id: 'financials', label: 'Financials & Approvals', icon: 'recon', access: 'BOTH', badge: () => STATE.approvals.filter(a => a.status === 'Pending').length },
  { id: 'settings', label: 'Settings', icon: 'settings', access: 'OWNER_ONLY' } // Protected by Owner Override if Manager clicks
];
