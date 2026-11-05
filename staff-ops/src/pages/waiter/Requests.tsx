import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency, formatElapsed, elapsedMinutes } from '../../utils/cn';
import { Clock, CheckCircle2, AlertTriangle, Play, UtensilsCrossed, BellRing, ChefHat, UserCheck, ShieldCheck } from 'lucide-react';
import type { CustomerRequest } from '../../types';

export function Requests() {
  const { requests, acceptRequest, doneRequest, pushNotification, user, tables } = useApp();
  const [activeTab, setActiveTab] = useState<'food' | 'service' | 'all'>('food');
  const [waiterScope, setWaiterScope] = useState<'my' | 'all'>('my');

  // Trigger sound/alert on SLA breach (>3 mins pending)
  useEffect(() => {
    const timer = setInterval(() => {
      const breached = requests.filter(r => r.status === 'pending' && elapsedMinutes(r.created_at) >= 3);
      if (breached.length > 0) {
        breached.forEach(r => {
          if (elapsedMinutes(r.created_at) >= 5) {
            pushNotification('sla_breach_escalated', { requestId: r.id, table: r.table_number, elapsedMins: elapsedMinutes(r.created_at) }, 'manager');
          }
        });
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [requests, pushNotification]);

  // Determine if a request belongs to this waiter's assigned tables
  const isMyTableRequest = (r: CustomerRequest) => {
    if (!user) return true;
    if (r.waiter_id && String(r.waiter_id) === String(user.id)) return true;
    const table = tables.find(t => t.id === r.table_id || t.table_number === r.table_number);
    if (table && String(table.assigned_waiter_id) === String(user.id)) return true;
    return false;
  };

  // Get assigned waiter name for a table/request
  const getAssignedWaiterName = (r: CustomerRequest) => {
    if (r.waiter) return r.waiter;
    const table = tables.find(t => t.id === r.table_id || t.table_number === r.table_number);
    if (table && table.assigned_waiter_id) {
      if (user && String(table.assigned_waiter_id) === String(user.id)) return `${user.name} (You)`;
      return (table as any).waiter || (table as any).assigned_waiter_name || `Waiter #${table.assigned_waiter_id}`;
    }
    return 'Unassigned (Floor)';
  };

  // Scope filter: My Tables vs All
  const scopedRequests = requests.filter(r => {
    if (waiterScope === 'my') {
      return isMyTableRequest(r);
    }
    return true;
  });

  // Tab filter: Food vs Service vs All
  const filteredRequests = scopedRequests.filter(r => {
    if (activeTab === 'food') return !!r.is_food;
    if (activeTab === 'service') return !r.is_food;
    return true;
  });

  const foodCount = scopedRequests.filter(r => r.is_food && r.status === 'pending').length;
  const serviceCount = scopedRequests.filter(r => !r.is_food && r.status === 'pending').length;
  const totalPending = scopedRequests.filter(r => r.status === 'pending').length;

  const pendingList = filteredRequests.filter(r => r.status === 'pending');
  const acceptedList = filteredRequests.filter(r => r.status === 'accepted');
  const doneList = filteredRequests.filter(r => r.status === 'done');

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'water':
      case 'drinking water':
      case 'requested drinking water': return '💧';
      case 'napkin':
      case 'tissue':
      case 'extra cutlery & napkins': return '🧻';
      case 'extra_bowl':
      case 'extra bowl': return '🥣';
      case 'spoon':
      case 'cutlery': return '🥄';
      case 'salt':
      case 'pepper': return '🧂';
      case 'bill':
      case 'bill requested': return '💵';
      case 'call_waiter':
      case 'call waiter': return '🔔';
      default: return '🛎️';
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'water': return 'Drinking Water Refill';
      case 'napkin': return 'Tissue & Napkins';
      case 'extra_bowl': return 'Extra Serving Bowl';
      case 'spoon': return 'Cutlery & Spoons';
      case 'call_waiter': return 'Call Waiter to Table';
      case 'bill':
      case 'bill requested': return 'Bill Checkout Requested';
      default: return type;
    }
  };

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Waiter Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">Customer Requests & Food Re-Orders</h1>
          <p className="text-sm text-muted mt-1">
            Mid-meal food additions & table service calls. Accepted food orders dispatch directly to Kitchen KOT.
          </p>
        </div>

        {/* Waiter Scope Selector (My Tables vs All Tables) */}
        <div className="flex items-center gap-2 bg-surface2 border border-line p-1 rounded-xl">
          <button
            onClick={() => setWaiterScope('my')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5',
              waiterScope === 'my' ? 'bg-accent text-black shadow' : 'text-muted hover:text-ink'
            )}
          >
            <UserCheck size={14} /> My Tables Only
          </button>
          <button
            onClick={() => setWaiterScope('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5',
              waiterScope === 'all' ? 'bg-accent text-black shadow' : 'text-muted hover:text-ink'
            )}
          >
            🏢 All Restaurant Floor
          </button>
        </div>
      </div>

      {/* Primary Category Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-line pb-4">
        <button
          onClick={() => setActiveTab('food')}
          className={cn(
            'px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2',
            activeTab === 'food'
              ? 'bg-amber-500 text-black shadow-lg font-extrabold'
              : 'bg-surface2 text-muted hover:text-ink border border-line'
          )}
        >
          <UtensilsCrossed size={16} />
          🍽️ Food Re-Orders & Add-ons
          {foodCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black text-amber-400 text-[10px] font-black animate-pulse">
              {foodCount} NEW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={cn(
            'px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2',
            activeTab === 'service'
              ? 'bg-blue-500 text-white shadow-lg font-extrabold'
              : 'bg-surface2 text-muted hover:text-ink border border-line'
          )}
        >
          <BellRing size={16} />
          🛎️ Table Service & Amenities
          {serviceCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white text-blue-600 text-[10px] font-black">
              {serviceCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2',
            activeTab === 'all'
              ? 'bg-accent text-black shadow-lg font-extrabold'
              : 'bg-surface2 text-muted hover:text-ink border border-line'
          )}
        >
          All Requests ({scopedRequests.length})
        </button>

        <div className="ml-auto text-xs text-muted font-medium flex items-center gap-2">
          <span>Active filter:</span>
          <span className="font-bold text-accent">
            {waiterScope === 'my' ? `Assigned to You (${user?.name})` : 'Entire Floor'}
          </span>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= COLUMN 1: PENDING ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="font-bold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Pending Action ({pendingList.length})
            </h2>
            <span className="text-xs text-muted">SLA 3m response limit</span>
          </div>

          <div className="space-y-3">
            {pendingList.map(req => {
              const mins = elapsedMinutes(req.created_at);
              const isBreached = mins >= 3;
              const isMine = isMyTableRequest(req);
              const assignedName = getAssignedWaiterName(req);

              // Render Food Re-Order Card
              if (req.is_food) {
                return (
                  <div
                    key={req.id}
                    className={cn(
                      'card p-4 border transition-all rounded-2xl shadow-sm',
                      isBreached ? 'border-red-500/60 bg-red-500/10' : 'border-amber-500/40 bg-surface'
                    )}
                  >
                    {/* Top Table & Assigned Waiter Badge */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-amber-400">{req.table_number}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                            Food Re-Order
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                          <span className={cn('font-bold', isMine ? 'text-green-400' : 'text-gray-400')}>
                            👤 {assignedName}
                          </span>
                        </div>
                      </div>

                      {isBreached && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold uppercase animate-bounce">
                          <AlertTriangle size={10} /> SLA BREACH ({mins}m)
                        </span>
                      )}
                    </div>

                    {/* Food Items Ordered List */}
                    <div className="bg-surface2/80 rounded-xl p-3 border border-line mb-3">
                      <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Items Requested by Guest</span>
                        <span className="text-amber-400">{req.notes || 'Round 2 Order'}</span>
                      </div>
                      <div className="space-y-1.5">
                        {(req.food_items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-ink">
                              {item.qty}× {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.station && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-muted">
                                  {item.station}
                                </span>
                              )}
                              <span className="font-mono text-muted">{formatCurrency(item.price * item.qty)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {req.total && (
                        <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between text-xs font-bold">
                          <span className="text-muted">Total Add-on:</span>
                          <span className="text-accent text-sm font-extrabold">{formatCurrency(req.total)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatElapsed(req.created_at)} ago
                      </span>
                      <span className="font-mono text-[10px] text-muted">{req.id}</span>
                    </div>

                    {/* Action Button: Dispatches immediately to Kitchen KOT */}
                    <button
                      onClick={() => acceptRequest(req.id)}
                      className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs btn-press flex items-center justify-center gap-2 shadow-md"
                    >
                      <ChefHat size={16} /> Accept & Send to Kitchen 🍳
                    </button>
                  </div>
                );
              }

              // Render Table Service / Amenities Card
              return (
                <div
                  key={req.id}
                  className={cn(
                    'card p-4 border transition-all rounded-2xl shadow-sm',
                    isBreached ? 'border-red-500/60 bg-red-500/10' : 'border-blue-500/30 bg-surface'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{getServiceIcon(req.type)}</span>
                      <div>
                        <p className="font-extrabold text-blue-400 text-base">{req.table_number}</p>
                        <p className="text-xs font-bold text-ink">{getServiceLabel(req.type)}</p>
                      </div>
                    </div>
                    {isBreached && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold uppercase animate-bounce">
                        <AlertTriangle size={10} /> SLA BREACH ({mins}m)
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-muted mb-3 flex items-center justify-between">
                    <span>Assigned: <strong className={isMine ? 'text-green-400' : 'text-gray-300'}>{assignedName}</strong></span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatElapsed(req.created_at)} ago</span>
                  </div>

                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="w-full h-10 rounded-xl bg-accent text-black font-bold text-xs btn-press flex items-center justify-center gap-1.5"
                  >
                    <Play size={14} /> Accept Service Call
                  </button>
                </div>
              );
            })}

            {pendingList.length === 0 && (
              <div className="text-center py-12 text-muted card border-dashed rounded-2xl">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm font-medium">No pending requests in this view</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUMN 2: IN PROGRESS / ACCEPTED ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="font-bold text-sm uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              Accepted / In Progress ({acceptedList.length})
            </h2>
            <span className="text-xs text-muted">Cooking or delivering</span>
          </div>

          <div className="space-y-3">
            {acceptedList.map(req => {
              const assignedName = getAssignedWaiterName(req);

              return (
                <div key={req.id} className="card p-4 border border-blue-500/30 rounded-2xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{req.is_food ? '🍳' : getServiceIcon(req.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-400 text-base">{req.table_number}</span>
                          {req.is_food && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              KITCHEN KOT SENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-ink">
                          {req.is_food ? (req.food_items?.map(i => `${i.qty}x ${i.name}`).join(', ') || 'Food items') : getServiceLabel(req.type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted mb-3 pt-2 border-t border-line/40">
                    <span>Waiter: <strong className="text-white">{assignedName}</strong></span>
                    <span className="text-blue-400 font-semibold">{req.is_food ? 'In Kitchen Queue' : 'Attending Guest'}</span>
                  </div>

                  <button
                    onClick={() => doneRequest(req.id)}
                    className="w-full h-10 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs btn-press flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> Mark Completed / Served ✓
                  </button>
                </div>
              );
            })}

            {acceptedList.length === 0 && (
              <div className="text-center py-12 text-muted card border-dashed rounded-2xl">
                <p className="text-sm">No requests currently in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUMN 3: COMPLETED / DONE ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              Completed History ({doneList.length})
            </h2>
            <span className="text-xs text-muted">Today's logs</span>
          </div>

          <div className="space-y-2 opacity-80">
            {doneList.map(req => (
              <div key={req.id} className="card p-3 border border-line rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{req.is_food ? '🍲' : getServiceIcon(req.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink">{req.table_number}</span>
                      <span className="text-xs text-muted">
                        {req.is_food ? `${req.food_items?.length || 1} food items` : getServiceLabel(req.type)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted">Assigned: {getAssignedWaiterName(req)}</span>
                  </div>
                </div>
                <span className="text-xs text-green-400 font-extrabold flex items-center gap-1">
                  Done ✓
                </span>
              </div>
            ))}

            {doneList.length === 0 && (
              <div className="text-center py-12 text-muted card border-dashed rounded-2xl">
                <p className="text-sm">Completed items will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
