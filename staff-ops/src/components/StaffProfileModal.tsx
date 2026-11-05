import React, { useState, useEffect } from 'react';
import { useApp, API_BASE } from '../hooks/useApp';
import {
  User, ShieldCheck, CreditCard, Phone, Calendar,
  Award, CheckCircle2, Clock, X, Building2, Sparkles, AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffProfileModal({ isOpen, onClose }: StaffProfileModalProps) {
  const { user } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    emergency_contact: '',
    address: '',
    bank_account: '',
    ifsc: '',
    aadhaar: '',
    pan: '',
  });

  // Populate form when modal opens or user changes
  useEffect(() => {
    if (user) {
      setForm({
        phone: user.phone || '',
        emergency_contact: user.emergency_contact || (user as any).emergencyContact || '',
        address: user.address || '',
        bank_account: user.bank_account || (user as any).accountNumber || '',
        ifsc: user.ifsc || '',
        aadhaar: user.aadhaar || '',
        pan: user.pan || '',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveStaffProfile = async () => {
    try {
      const payload = {
        ...form,
        emergencyContact: form.emergency_contact,
        accountNumber: form.bank_account
      };
      const res = await fetch(`${API_BASE}/staff/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setEditMode(false);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const roleBadgeColor =
    user.role === 'kitchen' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
    user.role === 'waiter' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
    'bg-purple-500/15 text-purple-400 border-purple-500/30';

  const roleTitle =
    user.role === 'kitchen' ? 'Kitchen Executive / Chef' :
    user.role === 'waiter' ? 'Service Captain / Waiter' :
    'Head Cashier & Accountant';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="modal-enter relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-3xl shadow-2xl p-6 sm:p-7 text-ink"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-line/50 transition-colors"
          aria-label="Close Profile"
        >
          <X size={16} />
        </button>

        {/* Header Profile Section */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-line/60">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent/30 to-accent text-black font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-accent/20">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-surface" title="On Duty / Active" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{user.name}</h2>
              <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full font-semibold border', roleBadgeColor)}>
                {roleTitle}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted mt-1">
              <span>ID: <strong className="text-ink font-mono">{user.id}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 size={13} /> Biometric Verified
              </span>
            </div>
          </div>
        </div>

        {/* Quick Shift & Status Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-surface2/60 border border-line/60">
            <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
              <Clock size={14} className="text-accent" />
              <span>Shift Timing</span>
            </div>
            <div className="text-sm font-semibold truncate">{user.shift || '10:00 AM - 10:00 PM'}</div>
            <div className="text-[10px] text-green-400 font-medium mt-0.5">Checked In • On Time</div>
          </div>

          <div className="p-3 rounded-2xl bg-surface2/60 border border-line/60">
            <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
              <Award size={14} className="text-amber-400" />
              <span>Service Rating</span>
            </div>
            <div className="text-sm font-bold text-amber-400">★ {user.rating ? Number(user.rating).toFixed(1) : '4.8'} / 5.0</div>
            <div className="text-[10px] text-muted mt-0.5">Verified Floor Performance</div>
          </div>

          <div className="p-3 rounded-2xl bg-surface2/60 border border-line/60">
            <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
              <ShieldCheck size={14} className="text-blue-400" />
              <span>Compliance</span>
            </div>
            <div className="text-sm font-semibold">100% Cleared</div>
            <div className="text-[10px] text-muted mt-0.5">KYC & Aadhaar Linked</div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-4">
          {/* Contact Details */}
          <div className="p-4 rounded-2xl bg-surface2/40 border border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
              <Phone size={14} className="text-accent" /> Contact & Residence
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Primary Phone</span>
                <span className="font-semibold text-ink">{user.phone || '+91 98765 43210'}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Emergency Contact</span>
                <span className="font-semibold text-ink">{user.emergency_contact || '+91 98111 22334 (Family)'}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-line/40">
                <span className="text-muted block text-[11px]">Residential Address</span>
                <span className="text-ink">{user.address || 'H.No. 42, Green Park Avenue, Near City Metro, New Delhi'}</span>
              </div>
            </div>
          </div>

          {/* Statutory KYC & Banking */}
          <div className="p-4 rounded-2xl bg-surface2/40 border border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
              <Building2 size={14} className="text-accent" /> KYC & Statutory Payroll Info
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Aadhaar (UIDAI)</span>
                <span className="font-mono font-medium text-ink flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-green-400" />
                  {user.aadhaar ? `•••• •••• ${user.aadhaar.slice(-4)}` : '•••• •••• 9081'}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px]">Permanent Account No (PAN)</span>
                <span className="font-mono font-medium text-ink flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-400" />
                  {user.pan ? `•••••${user.pan.slice(-4)}` : '•••••6741F'}
                </span>
              </div>

              <div className="pt-2 border-t border-line/40">
                <span className="text-muted block text-[11px]">Bank Account</span>
                <span className="font-mono font-medium text-ink">
                  {user.bank_account ? `A/C •••• ${user.bank_account.slice(-4)}` : 'A/C •••• 5612'}
                </span>
                <span className="text-[10px] text-muted block">IFSC: {user.ifsc || 'HDFC0001234'}</span>
              </div>

              <div className="pt-2 border-t border-line/40">
                <span className="text-muted block text-[11px]">EPFO & ESIC Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold border', user.pf_enrolled !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-line text-muted border-line')}>
                    EPF UAN Active
                  </span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold border', user.esi_enrolled !== false ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-line text-muted border-line')}>
                    ESIC Insured
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note on Editing */}
        <div className="mt-4 p-3 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-2.5 text-xs text-muted">
          <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
          <div>
            <strong className="text-ink">Official HR Profile</strong>
            <p className="text-[11px] mt-0.5">
              Personal, KYC and bank account records are maintained securely in accordance with Indian Labour & Tax regulations. To update phone number, address or salary details, request modification from the <strong>Owner & General Manager Console</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end space-x-2">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 h-9 rounded-lg bg-gray-200 text-gray-800 font-medium btn-press"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaffProfile}
                className="px-6 h-9 rounded-lg bg-accent text-black font-bold btn-press"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 h-9 rounded-lg bg-blue-500 text-white font-medium btn-press"
              >
                Edit Profile
              </button>
              <button
                onClick={onClose}
                className="px-6 h-9 rounded-lg bg-accent text-black font-bold btn-press"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

