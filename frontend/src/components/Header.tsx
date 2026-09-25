import React from 'react';
import { RefreshCw, HelpCircle, Activity } from 'lucide-react';
import type { SystemOverview } from '../types/process';

interface HeaderProps {
  systemOverview: SystemOverview | null;
  onScanNow: () => void;
  onDiagnoseSlow: () => void;
  onOpenHealthModal: () => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemOverview,
  onScanNow,
  onDiagnoseSlow,
  onOpenHealthModal,
  isScanning
}) => {
  const healthScore = systemOverview?.system_health_score ?? 85;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <header className="bg-[#090d18]/90 backdrop-blur-md border-b border-slate-800/80 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Your System, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Explained.</span>
          </h2>
          {systemOverview?.is_demo_mode && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
              DEMO MODE
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm mt-0.5">
          Understand what your computer is doing in real time. Task Manager tells you what is running — Process X-Ray tells you what it means.
        </p>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <button
          onClick={onOpenHealthModal}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-transform hover:scale-105 ${getHealthColor(healthScore)}`}
          title="Click to view health score breakdown"
        >
          <Activity className="w-4 h-4" />
          <span>HEALTH:</span>
          <span className="font-mono text-sm font-bold">{healthScore}/100</span>
        </button>

        <button
          onClick={onScanNow}
          disabled={isScanning}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
        </button>

        <button
          onClick={onDiagnoseSlow}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <HelpCircle className="w-4 h-4 text-slate-950" />
          <span>WHY IS MY PC SLOW?</span>
        </button>
      </div>
    </header>
  );
};
