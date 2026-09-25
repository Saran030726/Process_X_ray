import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  GitFork,
  ShieldCheck,
  History,
  Bell,
  Settings,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDemoMode,
  onToggleDemoMode
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'processes', label: 'Processes', icon: Cpu },
    { id: 'tree', label: 'Process Tree', icon: GitFork },
    { id: 'health', label: 'System Health', icon: ShieldCheck },
    { id: 'history', label: 'History', icon: History },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c1222] border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0c1222]"></div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
                PROCESS <span className="text-cyan-400">X-RAY</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">v1.0 • WINDOWS OS</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Demo Toggle & Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="glass-panel p-3 rounded-xl mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isDemoMode ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-semibold text-slate-300">
              {isDemoMode ? 'Demo Mode' : 'Live System'}
            </span>
          </div>
          <button
            onClick={() => onToggleDemoMode(!isDemoMode)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isDemoMode ? 'bg-amber-500' : 'bg-cyan-600'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isDemoMode ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span>{isDemoMode ? 'DEMO DATA' : 'SYSTEM ONLINE'}</span>
          </span>
          <span>WINDOWS</span>
        </div>
      </div>
    </aside>
  );
};
