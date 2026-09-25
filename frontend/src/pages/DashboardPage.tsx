import React from 'react';
import { SystemGauge } from '../components/SystemGauge';
import { ProcessTable } from '../components/ProcessTable';
import type { ProcessItem, SystemOverview, AlertItem } from '../types/process';
import { Flame, Bell, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  systemOverview: SystemOverview | null;
  processes: ProcessItem[];
  alerts: AlertItem[];
  onSelectProcess: (proc: ProcessItem) => void;
  onExplainProcess: (proc: ProcessItem) => void;
  onTerminateProcess: (proc: ProcessItem) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  systemOverview,
  processes,
  alerts,
  onSelectProcess,
  onExplainProcess,
  onTerminateProcess,
  onNavigateTab
}) => {
  const topResourceHogs = [...processes]
    .sort((a, b) => b.cpu_percent - a.cpu_percent)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <SystemGauge overview={systemOverview} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-sm">Top Resource Consumers</h3>
              </div>
              <button
                onClick={() => onNavigateTab('processes')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
              >
                <span>View All Processes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topResourceHogs.map((proc) => (
                <div
                  key={proc.pid}
                  onClick={() => onSelectProcess(proc)}
                  className="bg-slate-900/80 hover:bg-slate-800/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-all hover:border-cyan-500/40 group"
                >
                  <div>
                    <span className="font-bold text-white text-xs block group-hover:text-cyan-400 transition-colors">
                      {proc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PID {proc.pid}</span>
                    <span className="text-[10px] text-slate-400 block font-sans capitalize mt-0.5">
                      {proc.classification}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-sm font-extrabold text-orange-400 block">
                      {proc.cpu_percent.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(proc.memory_bytes / (1024 * 1024)).toFixed(0)} MB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Recent Activity</h3>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                View Alerts
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alt) => (
                <div key={alt.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{alt.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(alt.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2">{alt.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-white tracking-wide uppercase font-mono text-slate-400 flex items-center space-x-2">
          <span>Active System Processes</span>
        </h3>
        <ProcessTable
          processes={processes}
          onSelectProcess={onSelectProcess}
          onExplainProcess={onExplainProcess}
          onTerminateProcess={onTerminateProcess}
        />
      </div>
    </div>
  );
};
