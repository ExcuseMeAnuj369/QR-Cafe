# QR-Cafe Staff Ops

Production-grade restaurant staff operations dashboard for Kitchen, Waiter, and Accountant.

## Demo Login

| Role       | Staff ID | PIN  |
|------------|----------|------|
| Kitchen    | 1001     | 1001 |
| Waiter     | 2002     | 2002 |
| Accountant | 3003     | 3003 |

## Run

```bash
cd QR-Cafe-staff-ops
npm install
npm run dev
```

Open http://localhost:5173

## Features Implemented

- Premium dark/night/light themes with glass morphism + floating orbs
- Role-based login & routing (tabs hidden by role)
- Kitchen: Live Orders (status flow, rush, cannot-make, per-item ready), Kitchen Stock
- Waiter: My Tables, Available Tables, mid-order addition, Free table
- Accountant: Pending/Paid bills, Collect payment (Cash/UPI/Card/Split)
- Attendance (check-in/out/break + 30-day calendar) for ALL roles
- Leave requests for ALL roles
- Toasts, modals, responsive card grid
- Mock data covering tables, sessions, tokens, groups, orders, stock

## Tech

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Lucide icons
- CSS variables for theming
