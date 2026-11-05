import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { Users, Plus, Unlink, Link2, ShieldAlert, Check } from 'lucide-react';
import type { Group } from '../../types';

export function Groups() {
  const { groups, tables, user, linkTables, unlinkGroup, orders, addToast, pushNotification } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string>('');
  const [billingPref, setBillingPref] = useState<'separate' | 'combined'>('separate');
  const [confirmStep, setConfirmStep] = useState(false);

  if (!user) return null;

  // Tables eligible for linking: claimed by user or free, not already grouped
  const eligibleTables = tables.filter(t => (t.assigned_waiter_id === user.id || t.status === 'free') && !t.group_id);

  const toggleTable = (id: string) => {
    if (selectedTables.includes(id)) {
      const updated = selectedTables.filter(i => i !== id);
      setSelectedTables(updated);
      if (primaryId === id) setPrimaryId(updated[0] || '');
    } else {
      if (selectedTables.length >= 3) {
        addToast('error', 'Max 3 tables per group allowed');
        return;
      }
      const updated = [...selectedTables, id];
      setSelectedTables(updated);
      if (!primaryId) setPrimaryId(id);
    }
  };

  const handleLinkSubmit = () => {
    if (selectedTables.length < 2) {
      addToast('error', 'Select at least 2 tables to link');
      return;
    }
    if (!primaryId) {
      addToast('error', 'Select a primary table');
      return;
    }

    linkTables(selectedTables, primaryId, billingPref);
    pushNotification('group_linked', { tableIds: selectedTables, billingPref }, 'manager');
    setShowModal(false);
    setConfirmStep(false);
    setSelectedTables([]);
    setPrimaryId('');
  };

  const handleUnlink = (group: Group) => {
    // Check if any order has partial payment
    const groupOrders = orders.filter(o => group.table_ids.includes(o.table_id));
    const hasServed = groupOrders.some(o => o.status === 'served');

    if (hasServed) {
      // In real scenario ask for Manager PIN, here prompt confirmation warning
      const confirmPin = window.confirm('Orders are already served for this group. Manager PIN is required to unlink after payment/service. Proceed?');
      if (!confirmPin) return;
    }

    unlinkGroup(group.id);
    pushNotification('group_unlinked', { groupId: group.id, groupCode: group.group_code }, 'manager');
  };

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Waiter Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">Linked Tables (Approach B)</h1>
          <p className="text-sm text-muted mt-1">Group 2-3 tables for large families without physical merging. Sessions remain separate.</p>
        </div>

        <button
          onClick={() => { setShowModal(true); setConfirmStep(false); }}
          className="h-11 px-4 rounded-xl bg-accent text-black text-sm font-bold flex items-center gap-2 btn-press"
        >
          <Link2 size={16} /> Link New Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => {
          const groupTableObjs = tables.filter(t => group.table_ids.includes(t.id));
          const totalSeats = groupTableObjs.reduce((sum, t) => sum + t.max_seats, 0);
          const groupOrders = orders.filter(o => group.table_ids.includes(o.table_id) && o.status !== 'completed');
          const groupTotal = groupOrders.reduce((sum, o) => sum + o.total, 0);

          return (
            <div key={group.id} className="card p-5 border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-ink">{group.group_code}</h3>
                    <p className="text-xs text-muted">Created by Waiter</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold uppercase">
                  {group.billing_pref === 'combined' ? 'Combined Bill' : 'Separate Bills'}
                </span>
              </div>

              {/* Table Badges */}
              <div className="mb-4">
                <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wider">Linked Tables ({groupTableObjs.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {groupTableObjs.map(t => (
                    <span
                      key={t.id}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-extrabold border',
                        t.id === group.primary_table_id
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-surface2 border-line text-ink'
                      )}
                    >
                      {t.table_number} {t.id === group.primary_table_id && '(Primary)'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-surface2 border border-line mb-4">
                <div>
                  <p className="text-muted">Total Seats</p>
                  <p className="text-sm font-bold text-ink">{totalSeats} seats</p>
                </div>
                <div>
                  <p className="text-muted">Combined Bill</p>
                  <p className="text-sm font-bold text-accent tabular">{formatCurrency(groupTotal)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUnlink(group)}
                  className="w-full h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold hover:bg-red-500/20 btn-press flex items-center justify-center gap-1.5"
                >
                  <Unlink size={16} /> Unlink Tables
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-16 text-muted card border-dashed">
          <p className="text-4xl mb-3">🔗</p>
          <p className="font-medium text-lg">No Linked Table Groups Active</p>
          <p className="text-sm mt-1">Click "Link New Group" to link 2-3 tables for large party bookings.</p>
        </div>
      )}

      {/* Link Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Link Tables (Approach B)</h3>
            <p className="text-sm text-muted mb-4">Select 2-3 tables to link. Sessions & tokens remain separate.</p>

            {!confirmStep ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-2 block">
                    Select Tables (2 to 3 max):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {eligibleTables.map(t => {
                      const selected = selectedTables.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTable(t.id)}
                          className={cn(
                            'p-3 rounded-xl border text-left transition-all min-h-[50px] flex items-center justify-between',
                            selected ? 'border-accent bg-accent/15 text-accent font-bold' : 'border-line bg-surface2 text-muted hover:text-ink'
                          )}
                        >
                          <div>
                            <p className="text-sm font-extrabold">{t.table_number}</p>
                            <p className="text-[11px] opacity-75">{t.max_seats} seats · Zone {t.zone}</p>
                          </div>
                          {selected && <Check size={16} className="text-accent shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedTables.length >= 2 && (
                  <>
                    <div>
                      <label className="text-xs text-muted font-semibold uppercase mb-1 block">
                        Select Primary Table:
                      </label>
                      <select
                        value={primaryId}
                        onChange={e => setPrimaryId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                      >
                        {selectedTables.map(id => {
                          const t = tables.find(x => x.id === id);
                          return <option key={id} value={id}>{t?.table_number} ({t?.max_seats} seats)</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted font-semibold uppercase mb-1 block">
                        Billing Preference:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBillingPref('separate')}
                          className={cn(
                            'h-11 rounded-xl text-sm font-semibold border transition-all btn-press',
                            billingPref === 'separate' ? 'bg-accent text-black border-accent' : 'border-line text-muted hover:text-ink bg-surface2'
                          )}
                        >
                          Bill Separately (Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingPref('combined')}
                          className={cn(
                            'h-11 rounded-xl text-sm font-semibold border transition-all btn-press',
                            billingPref === 'combined' ? 'bg-accent text-black border-accent' : 'border-line text-muted hover:text-ink bg-surface2'
                          )}
                        >
                          Combine at Primary
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                    Cancel
                  </button>
                  <button
                    disabled={selectedTables.length < 2 || !primaryId}
                    onClick={() => setConfirmStep(true)}
                    className="flex-1 h-11 rounded-xl bg-accent text-black font-bold text-sm btn-press disabled:opacity-50"
                  >
                    Next: Review Link →
                  </button>
                </div>
              </div>
            ) : (
              /* Confirmation step */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface2 border border-line space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Selected Tables:</span>
                    <span className="font-bold">
                      {selectedTables.map(id => tables.find(t => t.id === id)?.table_number).join(' + ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Combined Seats:</span>
                    <span className="font-bold">
                      {selectedTables.reduce((sum, id) => sum + (tables.find(t => t.id === id)?.max_seats || 0), 0)} seats
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Primary Table:</span>
                    <span className="font-bold text-accent">
                      {tables.find(t => t.id === primaryId)?.table_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Billing Preference:</span>
                    <span className="font-bold capitalize">{billingPref}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setConfirmStep(false)} className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press">
                    Back
                  </button>
                  <button
                    onClick={handleLinkSubmit}
                    className="flex-1 h-11 rounded-xl bg-accent text-black font-bold text-sm btn-press"
                  >
                    Confirm Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
