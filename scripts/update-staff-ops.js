const fs = require('fs');
const path = require('path');

const STAFF_OPS_ROOT = 'C:\\Users\\anuj dubey\\Desktop\\QR-Cafe-staff-ops';

// 1. UPDATE Attendance.tsx
const attendanceFile = path.join(STAFF_OPS_ROOT, 'src', 'pages', 'shared', 'Attendance.tsx');
const newAttendanceContent = `import { useApp } from '../../hooks/useApp';
import { cn } from '../../utils/cn';
import { ShieldCheck, CalendarCheck, Clock, UserCheck } from 'lucide-react';

export function Attendance() {
  const { user, attendance } = useApp();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find(a => String(a.staff_id) === String(user.id) && a.date === today);

  // Generate 30-day calendar
  const days: { date: string; status: string; isToday: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const rec = attendance.find(a => String(a.staff_id) === String(user.id) && a.date === dateStr);
    const dayOfWeek = d.getDay();
    let status = 'none';
    if (dayOfWeek === 0) status = 'weekend';
    else if (rec?.status === 'present') status = rec.is_late ? 'late' : 'present';
    else if (rec?.status === 'absent') status = 'absent';
    else if (i === 0 && !rec) status = 'none';
    days.push({ date: dateStr, status, isToday: i === 0 });
  }

  const statusColor: Record<string, string> = {
    present: 'bg-green-500',
    late: 'bg-amber-500',
    absent: 'bg-red-500',
    weekend: 'bg-surface2',
    none: 'bg-line',
  };

  const isCheckedIn = todayRecord?.check_in && todayRecord?.status === 'present' && !todayRecord?.check_out;
  const isCheckedOut = !!todayRecord?.check_out;
  const isAbsent = todayRecord?.status === 'absent';

  return (
    <div className="p-5 max-w-[900px] mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Attendance Verification</p>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted mt-1">
          Attendance check-in and check-out are administered by the Floor Manager & Owner Desk.
        </p>
      </div>

      {/* Today card */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wider">Today</p>
            <p className="text-lg font-bold mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-bold uppercase flex items-center gap-1.5',
            isCheckedIn ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
            isCheckedOut ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
            isAbsent ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-surface2 text-muted'
          )}>
            <span className={cn('w-2 h-2 rounded-full', isCheckedIn ? 'bg-green-500 animate-pulse' : isCheckedOut ? 'bg-amber-500' : isAbsent ? 'bg-red-500' : 'bg-gray-500')} />
            {isCheckedOut ? 'Checked Out' : isCheckedIn ? 'Checked In (Present)' : isAbsent ? 'Absent' : 'Not Checked In'}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><Clock size={12} /> Check In</p>
            <p className="text-lg font-bold tabular">{todayRecord?.check_in || '—'}</p>
          </div>
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><Clock size={12} /> Check Out</p>
            <p className="text-lg font-bold tabular">{todayRecord?.check_out || '—'}</p>
          </div>
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><UserCheck size={12} /> Authorized By</p>
            <p className="text-sm font-semibold tabular text-accent mt-0.5">Manager Desk</p>
          </div>
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><CalendarCheck size={12} /> Shift Status</p>
            <p className="text-sm font-semibold tabular mt-0.5">
              {isCheckedIn ? 'On Duty' : isCheckedOut ? 'Off Duty' : isAbsent ? 'Leave/Absent' : 'Pending'}
            </p>
          </div>
        </div>

        {/* Manager-Managed Status Notice Banner */}
        <div className="p-4 rounded-xl bg-surface2/80 border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className={isCheckedIn ? 'text-green-400' : 'text-accent'} />
            <div>
              <p className="text-xs font-semibold text-ink">
                {isCheckedOut
                  ? \`Shift Ended · Verified check-out at \${todayRecord?.check_out}\`
                  : isCheckedIn
                  ? \`Checked In · Verified by Floor Manager (\${todayRecord?.check_in})\`
                  : isAbsent
                  ? 'Marked Absent by Floor Manager for today'
                  : 'Floor check-in pending authorization from Manager / Owner Desk.'}
              </p>
              <p className="text-[11px] text-muted">
                Staff check-in and check-out are administered by the Owner / Manager Console for Indian Labor Law & statutory compliance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 30-day calendar */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Last 30 Days Record</h2>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <div key={d} className="text-center text-[10px] text-muted font-semibold py-1">{d}</div>
          ))}
          {/* Pad first week */}
          {Array.from({ length: new Date(days[0].date).getDay() }).map((_, i) => (
            <div key={\`pad-\${i}\`} />
          ))}
          {days.map(d => (
            <div
              key={d.date}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative',
                statusColor[d.status],
                d.status === 'present' || d.status === 'late' || d.status === 'absent' ? 'text-white' : 'text-muted',
                d.isToday && 'ring-2 ring-accent ring-offset-1 ring-offset-[var(--surface)]'
              )}
              title={d.date}
            >
              {new Date(d.date).getDate()}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /> Present</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Late</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Absent</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-surface2 border border-line" /> Weekend</span>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(attendanceFile, newAttendanceContent, 'utf8');
console.log('Attendance.tsx successfully updated!');

// 2. UPDATE useApp.tsx
const useAppFile = path.join(STAFF_OPS_ROOT, 'src', 'hooks', 'useApp.tsx');
let useAppContent = fs.readFileSync(useAppFile, 'utf8');

// Ensure API_BASE constant is present
if (!useAppContent.includes('const API_BASE')) {
  useAppContent = useAppContent.replace(
    "const STORAGE_PREFIX = 'QR-Cafe_ops_v1_';",
    `const API_BASE = 'http://localhost:3000/api';\nconst STORAGE_PREFIX = 'QR-Cafe_ops_v1_';`
  );
}

// Ensure staffList state is in AppProvider
if (!useAppContent.includes('const [staffList, setStaffList]')) {
  useAppContent = useAppContent.replace(
    "const [user, setUser] = useState<Staff | null>(() => loadStorage('user', null));",
    `const [user, setUser] = useState<Staff | null>(() => loadStorage('user', null));\n  const [staffList, setStaffList] = useState<Staff[]>(() => STAFF);`
  );
}

// Add polling and backend synchronization effect
if (!useAppContent.includes('API_BASE + \'/state\'')) {
  const syncEffect = `
  // Real-time synchronization with Owner/Manager Central Backend
  useEffect(() => {
    const fetchRemoteState = async () => {
      try {
        const res = await fetch(\`\${API_BASE}/state\`);
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.staff) && data.staff.length > 0) {
          setStaffList(data.staff);
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
      } catch (err) {
        // Fallback gracefully to local mock if server offline
      }
    };

    fetchRemoteState();
    const interval = setInterval(fetchRemoteState, 2500);
    return () => clearInterval(interval);
  }, []);
`;
  useAppContent = useAppContent.replace(
    "document.documentElement.setAttribute('data-theme', theme);",
    "document.documentElement.setAttribute('data-theme', theme);" + syncEffect
  );
}

// Update login function to check dynamic staffList
const oldLoginRegex = /const login = useCallback\(\(staffId: string, pin: string, role: Staff\['role'\]\) => \{[\s\S]*?return false;\s*\}, \[addToast\]\);/;
const newLoginCode = `const login = useCallback((staffId: string, pin: string, role: Staff['role']) => {
    const pool = [...staffList, ...STAFF];
    const staff = pool.find(s => {
      const sRole = (s.role || '').toLowerCase();
      const rMatch = (role === 'kitchen' && (sRole.includes('kitchen') || sRole.includes('cook'))) ||
                     (role === 'waiter' && (sRole.includes('waiter') || sRole.includes('server'))) ||
                     (role === 'accountant' && (sRole.includes('accountant') || sRole.includes('cashier')));
      return String(s.id) === String(staffId) && String(s.pin) === String(pin) && rMatch;
    });

    if (staff) {
      const normalizedUser: Staff = {
        id: String(staff.id),
        name: staff.name,
        role: role,
        pin: String(staff.pin),
        zone: staff.zone || 'A'
      };
      setUser(normalizedUser);
      addToast('success', \`Welcome, \${staff.name}\`);
      return true;
    }
    addToast('error', 'Invalid Staff ID or PIN');
    return false;
  }, [staffList, addToast]);`;

useAppContent = useAppContent.replace(oldLoginRegex, newLoginCode);

// Update updateOrderStatus to patch backend
if (!useAppContent.includes('fetch(`${API_BASE}/orders/')) {
  useAppContent = useAppContent.replace(
    "setOrders(prev => prev.map(o => {",
    `// Sync status to backend
    fetch(\`\${API_BASE}/orders/\${orderId}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});

    setOrders(prev => prev.map(o => {`
  );
}

// Update submitLeave to post backend
if (!useAppContent.includes('fetch(`${API_BASE}/leaves')) {
  useAppContent = useAppContent.replace(
    "setLeaveRequests(prev => [...prev, newLeave]);",
    `setLeaveRequests(prev => [...prev, newLeave]);
    fetch(\`\${API_BASE}/leaves\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, staff_id: user.id, name: user.name })
    }).catch(() => {});`
  );
}

fs.writeFileSync(useAppFile, useAppContent, 'utf8');
console.log('useApp.tsx successfully updated!');
