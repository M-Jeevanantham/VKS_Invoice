import React, { useState, useRef, useEffect } from 'react';
import { NavigationTab } from './Sidebar';
import { PlusCircle, Search, Database, KeyRound, LogOut, Settings as SettingsIcon, ChevronDown, Shield } from 'lucide-react';
import { AuthUser } from '../../types';

interface HeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  collapsed: boolean;
  isLiveSupabase: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser?: AuthUser;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  collapsed,
  isLiveSupabase,
  searchQuery,
  onSearchChange,
  currentUser,
  onLogout,
  onOpenChangePassword,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Commercial Overview',
      subtitle: 'Real-time billing performance, receivables & turnover',
    },
    'create-invoice': {
      title: 'New Commercial Invoice',
      subtitle: 'Prepare and calculate GST compliant textile bill',
    },
    'invoice-history': {
      title: 'Invoice Register & Archive',
      subtitle: 'Audit, print, export, and track historical bills',
    },
    customers: {
      title: 'Customer Directory',
      subtitle: 'Manage client accounts, GSTIN details & credit profiles',
    },
    products: {
      title: 'Product & Yarn Catalogue',
      subtitle: 'Viscose, cotton, fabrics, default rates & HSN codes',
    },
    payments: {
      title: 'Payment Tracking & Ledger',
      subtitle: 'Record bank remittances, cash, UPI and outstanding balances',
    },
    reports: {
      title: 'Financial & GST Reports',
      subtitle: 'Tax summaries, customer-wise statements, and sales audits',
    },
    settings: {
      title: 'Business & Print Settings',
      subtitle: 'Bank details, print preferences, numbering format & terms',
    },
  };

  const { title, subtitle } = titles[currentTab] || {
    title: 'Billing System',
    subtitle: 'V.K.S. Weaving Centre',
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-[#E8DFDC] z-20 flex items-center justify-between px-6 transition-all duration-200 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6C5D64]">
            VKS Weaving Centre
          </span>
          <span className="text-[#6C5D64] text-xs">/</span>
          <h2 className="text-sm font-bold text-[#30252A] font-serif">{title}</h2>
        </div>
        <p className="text-[11px] text-[#6C5D64] leading-none mt-0.5">{subtitle}</p>
      </div>

      {/* Center/Right: Search, Status & Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search Input */}
        <div className="relative hidden md:block">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C5D64]"
          />
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 text-xs bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] placeholder-[#6C5D64] focus:outline-none focus:border-[#702C3B] focus:ring-1 focus:ring-[#D4AE77]/40 transition-all"
          />
        </div>

        {/* Live Database Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${
            isLiveSupabase
              ? 'bg-[#EBF6F1] text-[#1E7B54] border-[#C1E6D6]'
              : 'bg-[#FDF6EC] text-[#B8741A] border-[#F7DEB8]'
          }`}
          title={
            isLiveSupabase
              ? 'Connected directly to Supabase PostgreSQL database'
              : 'Running in Local Storage Mode'
          }
        >
          <Database size={13} />
          <span>{isLiveSupabase ? 'PostgreSQL Active' : 'Local Mode'}</span>
        </div>

        {/* Quick Action: New Invoice Button */}
        {currentTab !== 'create-invoice' && (
          <button
            onClick={() => onNavigate('create-invoice')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all focus:ring-2 focus:ring-[#D4AE77]"
          >
            <PlusCircle size={15} />
            <span>New Invoice</span>
          </button>
        )}

        {/* User Profile dropdown */}
        <div className="relative pl-2 border-l border-[#E8DFDC]" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#FAF6F5] transition-colors focus:outline-none"
            title="User Profile & Security"
          >
            <div className="w-8 h-8 rounded-full bg-[#702C3B] text-white font-bold text-xs flex items-center justify-center border border-[#D4AE77] shadow-xs">
              VK
            </div>
            <div className="hidden lg:block text-left text-[11px] leading-tight">
              <div className="font-semibold text-[#30252A] flex items-center gap-1">
                <span>{currentUser?.full_name || 'Salem Admin'}</span>
                <ChevronDown size={12} className="text-[#6C5D64]" />
              </div>
              <div className="text-[10px] text-[#6C5D64] font-mono">{currentUser?.email || 'vks@admin.in'}</div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E8DFDC] rounded-xl shadow-dialog py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-[#E8DFDC] bg-[#FAF6F5]">
                <div className="font-bold text-[#30252A]">{currentUser?.full_name || 'Salem Admin'}</div>
                <div className="text-[11px] text-[#6C5D64] font-mono">{currentUser?.email || 'vks@admin.in'}</div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#1E7B54] font-semibold">
                  <Shield size={11} />
                  <span>Authorized Role: {currentUser?.role || 'ADMIN'}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onOpenChangePassword) onOpenChangePassword();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#FAF6F5] text-[#30252A] flex items-center gap-2.5 transition-colors"
                >
                  <KeyRound size={14} className="text-[#702C3B]" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#FAF6F5] text-[#30252A] flex items-center gap-2.5 transition-colors"
                >
                  <SettingsIcon size={14} className="text-[#6C5D64]" />
                  <span>Security &amp; Business Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#E8DFDC]">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#FCECEE] text-[#B82A3A] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
