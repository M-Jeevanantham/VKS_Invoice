import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'create-invoice'
  | 'invoice-history'
  | 'customers'
  | 'products'
  | 'payments'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isLiveSupabase: boolean;
  logoUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  isLiveSupabase,
  logoUrl,
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-invoice' as NavigationTab, label: 'Create Invoice', icon: FilePlus, highlight: true },
    { id: 'invoice-history' as NavigationTab, label: 'Invoice History', icon: History },
    { id: 'customers' as NavigationTab, label: 'Customers', icon: Users },
    { id: 'products' as NavigationTab, label: 'Products / Items', icon: Package },
    { id: 'payments' as NavigationTab, label: 'Payments', icon: CreditCard },
    { id: 'reports' as NavigationTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as NavigationTab, label: 'Business Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#702C3B] text-white flex flex-col z-30 transition-all duration-200 border-r border-[#541626] ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Block: Logo Only per user request */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-[#541626] bg-[#541626]">
        <div className="flex items-center overflow-hidden flex-1 mr-2 justify-center">
          {collapsed ? (
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-sm">
              <img
                src={logoUrl || '/vks-logo.png'}
                alt="VKS Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-11 w-full rounded-lg bg-white px-2 py-1 flex items-center justify-center shadow-sm">
              <img
                src={logoUrl || '/vks-logo.png'}
                alt="V.K.S. Weaving Centre Logo"
                className="max-h-9 max-w-full object-contain"
              />
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#702C3B] font-semibold shadow-sm'
                  : item.highlight
                  ? 'bg-[#D4AE77] text-[#30252A] hover:bg-[#C29A60] font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Indicator */}
      <div className="p-3 border-t border-[#541626] bg-[#541626]/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLiveSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          {!collapsed && (
            <div className="text-[10px] leading-tight text-white/80">
              <div className="font-medium text-white flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#D4AE77]" />
                {isLiveSupabase ? 'Supabase Live' : 'Local Storage Mode'}
              </div>
              <span className="text-white/60">
                {isLiveSupabase ? 'PostgreSQL Connected' : 'Ready for Cloud Sync'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
