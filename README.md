# 👑 QR DINE — Enterprise Owner & Manager Unified Console
### Zero-Bug Architecture · Indian Context · 20-Page Enterprise Specification

Production-grade **Owner (Super Admin)** and **Manager (Operations Admin)** unified dashboard for Indian restaurants.

---

## 🚀 How to Run (Unified Console & Staff Ops)
### Unified Single Server Architecture
Run the built-in zero-dependency server:
```bash
npm start
# or: node server.js
```
- **👑 Owner & Manager Console:** [http://localhost:3000/](http://localhost:3000/)
- **👔 Staff Ops (Kitchen / Waiter / Cashier):** [http://localhost:3000/staff/](http://localhost:3000/staff/)
- **📡 Central REST API & Live State:** [http://localhost:3000/api/state](http://localhost:3000/api/state)

> Both applications are bi-directionally linked via the central REST backend and database (`data/db.json`). Changes in Staff Ops (orders, requests, leaves) instantly stream to Owner Ops Live Kanban, and Owner operations (staff creation, attendance overrides, leave approvals) immediately reflect on Staff Ops handhelds.

---

## 🔑 Demo Access & PINs
| Role | Email | Password | Access Level | PIN |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Super Admin (Owner)** | `owner@qrdine.demo` | `owner123` | Unrestricted (Financials, Menu Pricing, Base Wages, GST & Tax Config, True P&L) | **`9999`** |
| **👔 Ops Admin (Manager)** | `manager@qrdine.demo` | `manager123` | Operations (Staff, Attendance, Inventory, Floor, Approvals). Restricted fields demand **Owner Override**. | **`1234`** |

> **💡 Real-Time Role Switcher:** You can switch instantly between **👑 Owner** and **👔 Manager** directly on the top navigation bar to test role permissions, locked fields, and the Owner Override protocol!

---

## 🛡️ The "Owner Override" Protocol (Section 1.2)
- Any field or action restricted to the Owner (Menu Prices, Base Salary Rates, GST Configuration, GSTR-1 Export) displays a **Lock Icon (🔒)** and is greyed out for Managers.
- Clicking any locked field slides up a **Glassmorphism Floating Card** from the bottom center requesting the **4-digit Owner PIN** (`9999`).
- Upon authorization, the field unlocks for **exactly 5 minutes** (tracked by a countdown badge on the top bar) and writes an entry into the **Audit Logs Table**.

---

## 📁 Modular Codebase Structure
```
qr-dine-owner-ops/
├── index.html                 # Lean HTML shell with Slide-Overs, Floating Cards & Toasts
├── css/
│   └── styles.css             # Glassmorphism, themes (Dark, AMOLED, Light), Saffron accents, animations
├── js/
│   ├── state.js               # Enterprise state store: KYC staff, 30d logs, recipes, tables & audit
│   ├── utils.js               # Owner Override protocol, Slide-Over drawers, Indian payroll engine & BCG
│   ├── auth.js                # Session management, demo accounts, role sync
│   ├── app.js                 # Router for the 9 master sections & shift countdown timer
│   └── features/              # Feature modules (Strictly matching Sections 3 to 11):
│       ├── dashboard.js       # Section 3: 4 KPI Pillars with deep Slide-Overs, Live Feed, 7d Sales
│       ├── live-ops.js        # Section 4: Kitchen Kanban (>10m red pulse), Waiter load, Cashier desk
│       ├── staff.js           # Section 5: Staff directory, Indian KYC, 4-tab Profile, Statutory Payroll
│       ├── attendance.js      # Section 6: Live roster, audit overrides, leave approvals, double-shift check
│       ├── inventory.js       # Section 7: Ingredient master, Recipe Builder with Food Cost %, POs & Wastage
│       ├── menu.js            # Section 8: 2-column menu CRUD, station routing, locked prices, BCG Matrix
│       ├── tables.js          # Section 9: Floor plan drag-and-drop, QR standee generator, table merging
│       ├── financials.js      # Section 10: Z-Report day close, cash reconciliation, approvals inbox, GST
│       └── settings.js        # Section 11: Owner-only GST rules, authority ceilings, aggregators & printer
└── README.md                  # Comprehensive manual
```

---

## 🎯 Master Sections Implemented

### Section 1: Core Architecture & Owner Override
- **Unified Dashboard**: Same layout, strictly segregated permissions.
- **Owner Override Card**: Slides up from bottom center, 4-digit PIN verification, 5-minute session, audit logging.
- **Themes**: Dark Mode (default), AMOLED Night Mode, and Light Mode toggle.
- **Micro-interactions**: Hover lifts (`translateY(-2px)`), active scaling (`scale(0.98)`), shimmer skeletons, auto-dismissing toasts.
- **Slide-Overs**: Right-side drawer for deep drill-downs without page reload.

### Section 2: Sidebar Navigation
- 9 Master sections with icons, active saffron left border, and dynamic badge counts.

### Section 3: Dashboard (Command Center)
- **Top 4 KPI Pillars with Slide-Over Drilldowns**:
  1. *Today's Revenue*: Payment breakdown doughnut (UPI, Cash, Card), Hourly bar chart, GSTR-1 export.
  2. *Live Tables*: Interactive mini-floor plan, table details, active ticket items.
  3. *Active Orders*: One-click redirect to Kitchen Kanban.
  4. *Staff Present*: Present, On-Break, and Absent staff breakdown.
- **Real-Time Activity Feed**: Live scrolling timeline with green and red critical indicators.
- **7-Day Sales Trend**: Interactive Chart.js line graph with hover revenue tooltips.
- **Action Required Widgets**: One-click redirects for pending leaves, low stock, and discounts.

### Section 4: Live Operations (Read-Only Monitor)
- **Kitchen Tab**: Kanban board (`New` -> `Preparing` -> `Ready`). Red pulse glow animation on orders older than 10 minutes.
- **Waiter Tab**: Station load per waiter, active tables, customer service requests.
- **Cashier Tab**: Unsettled guest checks, payment channel collections.

### Section 5: Staff & Indian Statutory Payroll (Merged)
- **Staff Directory**: Search, role/status filters, employee avatars.
- **Add Staff Modal**: Full Indian KYC (12-digit Aadhaar, 10-char PAN, address), bank IFSC, PF/ESI toggles, locked base rate.
- **Staff Profile Slide-Over**: 4 tabs (Overview & KYC, 30-day attendance calendar with hover hours, payroll history, leave requests).
- **Zero-Bug Statutory Payroll Engine**:
  - PF strictly on Basic + DA (12%).
  - Statutory warning if Basic < 50% of Gross.
  - ESI capped strictly at Gross ≤ ₹21,000 (0.75% EE, 3.25% ER).
  - Overtime hardcoded at 2.0× mandatory Indian multiplier.
  - Absence deduction: `(Basic / 26) * Unapproved Absences`.
  - Payroll cycle freeze & itemized payslip generator.

### Section 6: Attendance & Leave (Merged)
- **Live Roster**: Avatar status dots, supervisor override modal with mandatory audit reason.
- **Leave Approvals**: Sick/Casual balance tracking, yellow understaffed warning, PIN validation.
- **Shift Roster Planner**: Mon-Sun morning/evening schedule with **double-shift conflict validation**.

### Section 7: Inventory & Recipes
- **Ingredient Master**: Real-time stock, Par Level threshold alerts.
- **Recipe Builder**: Real-time Food Cost % calculation. **Turns RED if Food Cost > 35%**.
- **Auto-Deduction**: Raw materials deducted on PREPARING mark; negative stock prompt override.
- **Procurement**: Vendor ledgers, WhatsApp PO generation.
- **Wastage Log**: Deducts stock and debits P&L loss.

### Section 8: Menu & Dynamic Pricing
- **Two-Column Layout**: Left categories filter right menu cards.
- **Menu CRUD Modal**: Multilingual names (Hindi & English), station routing (Grill, Fry, Bar, Dessert), locked Dine-in & Aggregator prices (Owner Override), Out-of-stock auto-sync toggle.
- **BCG Menu Engineering Matrix**: Interactive Scatter Plot (Sales Volume vs Margin %) classifying dishes into **Stars, Plowhorses, Puzzles, Dogs** with strategic advice slide-over.

### Section 9: Tables & QR Management
- **Interactive Floor Plan**: Visual grid with drag-and-drop table rearrangement.
- **QR Standee Generator**: 2-click generation (PNG, PDF A4, Direct Thermal ESC/POS print).
- **Merge Tables**: Link tables for large groups creating a combined `group_id` for KOTs and single billing.

### Section 10: Financials & Approvals
- **Day Close (Z-Report)**: Expected vs Actual cash, **mandatory reason prompt if discrepancy > ₹50**, order lock.
- **Approvals Inbox**: Discounts above Manager limit (15%) escalate strictly to Owner PIN.
- **GST Compliance**: Item-level CGST/SGST split, GSTR-1 JSON export.
- **Petty Cash**: Daily cash outflow tracking.

### Section 11: Settings (Owner Only)
- Guarded by Owner Override PIN.
- GST rates (CGST/SGST), Manager authority limits (Discount %, Void ₹), Zomato/Swiggy API keys, WhatsApp WATI tokens, and LAN ESC/POS Thermal Printer setup.

---
Built with pride for high-throughput Indian restaurant operations.
