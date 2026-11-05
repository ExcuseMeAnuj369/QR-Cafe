import { useApp } from '../hooks/useApp';
import { cn } from '../utils/cn';
import {
  ChefHat, LayoutGrid, Package, Menu, UtensilsCrossed, Table2,
  ClipboardList, MessageSquare, Users, Calendar, CalendarDays,
  IndianRupee, Receipt, FileText, Wallet, Clock, UserCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenProfile?: () => void;
}

const kitchenTabs = [
  { id: 'live-orders', label: 'Live Orders', icon: LayoutGrid },
  { id: 'kitchen-stock', label: 'Kitchen Stock', icon: Package },
  { id: 'live-menu', label: 'Live Menu', icon: Menu },
  { id: 'attendance', label: 'My Attendance', icon: Clock },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
];

const waiterTabs = [
  { id: 'my-tables', label: 'My Tables', icon: Table2 },
  { id: 'available', label: 'Available Tables', icon: LayoutGrid },
  { id: 'my-orders', label: 'My Orders', icon: ClipboardList },
  { id: 'requests', label: 'Requests', icon: MessageSquare },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'attendance', label: 'My Attendance', icon: Clock },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
];

const accountantTabs = [
  { id: 'bills', label: 'Bills', icon: IndianRupee },
  { id: 'verify', label: 'Verify Receipt', icon: Receipt },
  { id: 'day-close', label: 'Day Close', icon: FileText },
  { id: 'petty-cash', label: 'Petty Cash', icon: Wallet },
  { id: 'attendance', label: 'My Attendance', icon: Clock },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
];

export function Sidebar({ activeTab, onTabChange, onOpenProfile }: SidebarProps) {
  const { user } = useApp();
  if (!user) return null;

  const tabs = user.role === 'kitchen' ? kitchenTabs
    : user.role === 'waiter' ? waiterTabs
      : accountantTabs;

  const roleLabel = user.role === 'kitchen' ? 'Kitchen Chef'
    : user.role === 'waiter' ? 'Waiter'
      : 'Accountant';

  const RoleIcon = user.role === 'kitchen' ? ChefHat
    : user.role === 'waiter' ? UtensilsCrossed
      : IndianRupee;

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-surface/50 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14">
      <div className="p-3 border-b border-line">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-2.5 p-2 rounded-2xl bg-surface2/60 hover:bg-surface2 border border-line/60 hover:border-accent/40 transition-all text-left group cursor-pointer"
          title="Click to view Staff Profile & KYC"
        >
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <RoleIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold truncate text-ink">{user.name}</p>
              <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">View</span>
            </div>
            <p className="text-[11px] text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {roleLabel}
            </p>
          </div>
        </button>

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 transition-all btn-press shadow-sm shadow-accent/5"
          >
            <UserCheck size={15} />
            <span>My Profile & KYC</span>
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all btn-press min-h-[44px]',
                active
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-muted hover:text-ink hover:bg-surface2 border border-transparent'
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-line">
        <div className="rounded-xl bg-surface2 border border-line p-3">
          <p className="text-[10px] font-semibold text-muted tracking-wider uppercase mb-1">Today's Shift</p>
          <p className="text-xs font-medium">10:00 AM — 10:00 PM</p>
          <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
            <div className="h-full w-[62%] rounded-full bg-accent" />
          </div>
          <p className="text-[10px] text-muted mt-1">6h 12m elapsed</p>
        </div>
        <button className="mt-2 w-full text-left text-xs text-muted hover:text-ink flex items-center gap-1.5 px-1 py-2">
          <span className="w-5 h-5 rounded-full border border-line flex items-center justify-center text-[10px]">?</span>
          Shortcuts & help
        </button>
      </div>
    </aside>
  );
}
