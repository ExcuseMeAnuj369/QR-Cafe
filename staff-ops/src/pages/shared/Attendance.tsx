import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn } from '../../utils/cn';
import { ShieldCheck, CalendarCheck, Clock, UserCheck, ChevronLeft, ChevronRight, Calendar, IndianRupee } from 'lucide-react';

export function Attendance() {
  const { user, attendance } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!user) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find(a => String(a.staff_id) === String(user.id) && a.date === todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const ymPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Month attendance for this staff member
  const monthRecords = attendance.filter(a => String(a.staff_id) === String(user.id) && String(a.date).startsWith(ymPrefix));

  let presentDays = 0;
  let leaveDays = 0;
  let absentDays = 0;
  let lateDays = 0;

  const days: { day: number; date: string; status: string; checkIn?: string | null; isToday: boolean }[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = monthRecords.find(a => a.date === dateStr);
    const dayOfWeek = new Date(year, month, d).getDay();

    let status = 'none';
    if (rec?.status === 'leave') {
      status = 'leave';
      leaveDays++;
    } else if (rec?.status === 'present') {
      status = rec.is_late ? 'late' : 'present';
      if (rec.is_late) lateDays++;
      presentDays++;
    } else if (rec?.status === 'absent') {
      status = 'absent';
      absentDays++;
    } else if (dayOfWeek === 0) {
      status = 'weekend';
    } else if (dateStr <= todayStr) {
      status = 'none';
    } else {
      status = 'none';
    }

    days.push({
      day: d,
      date: dateStr,
      status,
      checkIn: rec?.check_in,
      isToday: dateStr === todayStr
    });
  }

  const isCheckedIn = todayRecord?.check_in && todayRecord?.status === 'present' && !todayRecord?.check_out;
  const isCheckedOut = !!todayRecord?.check_out;
  const isAbsent = todayRecord?.status === 'absent';
  const isOnLeave = todayRecord?.status === 'leave';

  // Dynamic Monthly Salary Calculation based on Indian Payroll
  const basic = user.basicMonthly || 14000;
  const da = Math.round(basic * 0.15);
  const hra = Math.round(basic * 0.25);
  const otRate = user.otRate || 360;
  const otHours = lateDays * 0.5; // Estimated OT
  const otPay = Math.round(otHours * otRate);
  const gross = basic + da + hra + otPay;
  const absenceDeduction = Math.round((basic / 26) * absentDays);
  const pfEmployee = Math.round((basic + da) * 0.12);
  const esiEmployee = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const netEstimatedSalary = Math.max(0, gross - absenceDeduction - pfEmployee - esiEmployee);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const gotoCurrentMonth = () => setCurrentDate(new Date());

  const statusColor: Record<string, string> = {
    present: 'bg-green-500 text-white',
    late: 'bg-amber-500 text-white',
    leave: 'bg-blue-500 text-white',
    absent: 'bg-red-500 text-white',
    weekend: 'bg-surface2 text-muted',
    none: 'bg-line/40 text-muted',
  };

  return (
    <div className="p-5 max-w-[920px] mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Attendance & Payroll Verification</p>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance Calendar</h1>
        <p className="text-sm text-muted mt-1">
          Official attendance administered by Floor Manager & Owner Console. Verified for statutory compliance.
        </p>
      </div>

      {/* Today Verified Card */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wider">Today's Duty Status</p>
            <p className="text-lg font-bold mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 border',
            isCheckedIn ? 'bg-green-500/15 text-green-400 border-green-500/30' :
            isCheckedOut ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
            isOnLeave ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
            isAbsent ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-surface2 text-muted border-line'
          )}>
            <span className={cn('w-2 h-2 rounded-full', isCheckedIn ? 'bg-green-500 animate-pulse' : isOnLeave ? 'bg-blue-500' : isCheckedOut ? 'bg-amber-500' : isAbsent ? 'bg-red-500' : 'bg-gray-500')} />
            {isCheckedOut ? 'Shift Ended' : isCheckedIn ? 'On Duty (Present)' : isOnLeave ? 'Approved Leave' : isAbsent ? 'Absent' : 'Pending Floor Check-In'}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><Clock size={12} /> Check In</p>
            <p className="text-base font-bold tabular">{todayRecord?.check_in || '—'}</p>
          </div>
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><Clock size={12} /> Check Out</p>
            <p className="text-base font-bold tabular">{todayRecord?.check_out || '—'}</p>
          </div>
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><UserCheck size={12} /> Verified By</p>
            <p className="text-xs font-semibold tabular text-accent mt-0.5">Manager Desk</p>
          </div>
          <div className="rounded-xl bg-surface2 border border-line p-3">
            <p className="text-[11px] text-muted mb-1 flex items-center gap-1"><CalendarCheck size={12} /> Shift Timing</p>
            <p className="text-xs font-semibold tabular mt-0.5">{user.shift || '10:00 AM - 06:00 PM'}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface2/60 border border-line flex items-center gap-3 text-xs text-muted">
          <ShieldCheck size={18} className="text-accent shrink-0" />
          <span>Check-in and check-out entries are verified directly by the General Manager & Owner Console for transparency.</span>
        </div>
      </div>

      {/* Monthly Summary Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 border-line">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Present Days</p>
          <p className="text-2xl font-black text-green-400 mt-1">{presentDays}</p>
          <p className="text-[11px] text-muted mt-0.5">{presentDays * 8} Working Hours</p>
        </div>
        <div className="card p-4 border-line">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Approved Leaves</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{leaveDays}</p>
          <p className="text-[11px] text-muted mt-0.5">Authorized Absence</p>
        </div>
        <div className="card p-4 border-line">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Absences</p>
          <p className="text-2xl font-black text-red-400 mt-1">{absentDays}</p>
          <p className="text-[11px] text-muted mt-0.5">{absenceDeduction > 0 ? `-₹${absenceDeduction} Deduction` : 'No Deductions'}</p>
        </div>
        <div className="card p-4 border-accent/30 bg-accent/5">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
            <IndianRupee size={12} /> Estimated Net Pay
          </p>
          <p className="text-2xl font-black text-ink mt-1">₹{netEstimatedSalary.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-accent mt-0.5">Calculated from Attendance</p>
        </div>
      </div>

      {/* Monthly Interactive Calendar */}
      <div className="card p-5">
        {/* Month Navigation Bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-ink transition"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base font-bold flex items-center gap-2 px-2">
              <Calendar size={16} className="text-accent" />
              <span>{monthName}</span>
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-surface2 hover:bg-surface border border-line text-ink transition"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={gotoCurrentMonth}
            className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface border border-line text-xs font-semibold transition"
          >
            Current Month
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[11px] font-bold text-muted uppercase">
          <span className="text-red-400">Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square rounded-xl bg-surface2/30 border border-transparent" />
          ))}

          {days.map(d => (
            <div
              key={d.date}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 text-xs font-medium relative border transition-all',
                statusColor[d.status],
                d.isToday && 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--surface)] font-bold'
              )}
              title={`${d.date} — ${d.status.toUpperCase()}`}
            >
              <div className="w-full flex items-center justify-between text-[11px]">
                <span>{d.day}</span>
                {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
              </div>
              <div className="text-[9px] font-bold uppercase truncate max-w-full">
                {d.status === 'present' ? (d.checkIn || 'Present') :
                 d.status === 'leave' ? 'On Leave' :
                 d.status === 'late' ? 'Late' :
                 d.status === 'absent' ? 'Absent' :
                 d.status === 'weekend' ? 'Off' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted pt-3 border-t border-line">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /> Present</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" /> Approved Leave</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Late</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Absent</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-surface2 border border-line" /> Weekend Off</span>
        </div>
      </div>
    </div>
  );
}
