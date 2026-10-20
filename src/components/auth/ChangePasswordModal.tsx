import React, { useState } from 'react';
import { X, Lock, CheckCircle, AlertCircle, KeyRound, Shield } from 'lucide-react';
import { AuthUser } from '../../types';

interface ChangePasswordModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (email: string, currentPass: string, newPass: string) => Promise<boolean>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  isOpen,
  onClose,
  onChangePassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword.trim()) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onChangePassword(user.email, currentPassword, newPassword);
      setSuccessMsg('Password successfully updated and synchronized with Supabase!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#30252A]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-dialog w-full max-w-md overflow-hidden border border-[#E8DFDC]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#702C3B] text-white flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#30252A] font-serif">
                Change Admin Password
              </h3>
              <p className="text-[11px] text-[#6C5D64]">
                Account: {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#6C5D64] hover:text-[#30252A] hover:bg-[#E8DFDC]/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded-lg flex items-start gap-2">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#EBF6F1] border border-[#C1E6D6] text-[#1E7B54] rounded-lg flex items-start gap-2">
              <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
              Current Password *
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5D64]" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFDC] rounded text-xs font-medium focus:outline-none focus:border-[#702C3B] focus:ring-1 focus:ring-[#D4AE77]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
              New Password *
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5D64]" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password (min 4 chars)"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFDC] rounded text-xs font-medium focus:outline-none focus:border-[#702C3B] focus:ring-1 focus:ring-[#D4AE77]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5D64]" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFDC] rounded text-xs font-medium focus:outline-none focus:border-[#702C3B] focus:ring-1 focus:ring-[#D4AE77]"
              />
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#FAF6F5] border border-[#E8DFDC] text-[11px] text-[#6C5D64] flex items-center gap-2">
            <Shield size={14} className="text-[#702C3B] flex-shrink-0" />
            <span>Updating password syncs with live Supabase database immediately.</span>
          </div>

          <div className="pt-3 border-t border-[#E8DFDC] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-[#E8DFDC] text-[#6C5D64] hover:bg-[#FAF6F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded font-semibold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
