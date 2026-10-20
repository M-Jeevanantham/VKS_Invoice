import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthSession } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onLogin: (email: string, pass: string) => Promise<AuthSession>;
  isLiveSupabase: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onLogin,
  isLiveSupabase,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both User ID / Email and Password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const session = await onLogin(email.trim(), password.trim());
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F5] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#702C3B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D4AE77]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-white rounded-2xl shadow-subtle border border-[#E8DFDC] mb-3">
            <img src="/vks-logo.png" alt="V.K.S. Weaving Centre" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#30252A] font-serif tracking-tight">
            V.K.S. WEAVING CENTRE
          </h1>
          <p className="text-xs text-[#6C5D64] mt-1 font-medium">
            Commercial Billing &amp; Invoicing Workspace • Salem
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-dialog border border-[#E8DFDC] overflow-hidden">
          <div className="h-1.5 bg-[#702C3B]" />

          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-[#30252A] font-serif uppercase tracking-wide">
                Authorized Sign-In
              </h2>
              <p className="text-[11px] text-[#6C5D64] mt-0.5">
                Enter your administrative credentials to access the billing ledger.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded-lg text-xs flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  User ID / Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5D64]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter the email here"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF6F5] border border-[#E8DFDC] rounded-lg text-[#30252A] font-medium focus:outline-none focus:border-[#702C3B] focus:ring-1 focus:ring-[#D4AE77] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-[#6C5D64]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5D64]"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-[#FAF6F5] border border-[#E8DFDC] rounded-lg text-[#30252A] font-medium focus:outline-none focus:border-[#702C3B] focus:ring-1 focus:ring-[#D4AE77] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C5D64] hover:text-[#30252A]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>


              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:ring-2 focus:ring-[#D4AE77]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Billing Workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="px-6 py-3 bg-[#FAF6F5] border-t border-[#E8DFDC] flex items-center justify-between text-[11px] text-[#6C5D64]">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isLiveSupabase ? 'bg-[#1E7B54]' : 'bg-[#B8741A]'}`} />
              {isLiveSupabase ? 'PostgreSQL Database Synced' : 'Offline Mode'}
            </span>
            <span>VKS Billing v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
