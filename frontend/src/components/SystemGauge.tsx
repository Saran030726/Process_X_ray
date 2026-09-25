import React from 'react';
import { Cpu, HardDrive, Network, Layers, Activity } from 'lucide-react';
import type { SystemOverview } from '../types/process';

interface SystemGaugeProps {
  overview: SystemOverview | null;
}

export const SystemGauge: React.FC<SystemGaugeProps> = ({ overview }) => {
  const cpu = overview?.cpu_percent ?? 0;
  const ram = overview?.memory_percent ?? 0;
  const ramUsed = overview?.memory_used_gb ?? 0;
  const ramTotal = overview?.memory_total_gb ?? 0;
  const disk = overview?.disk_percent ?? 0;
  const netSent = overview?.net_sent_kbps ?? 0;
  const netRecv = overview?.net_recv_kbps ?? 0;
  const totalProcesses = overview?.total_processes ?? 0;

  const getGaugeColor = (pct: number) => {
    if (pct >= 85) return 'stroke-rose-500 text-rose-400';
    if (pct >= 70) return 'stroke-amber-500 text-amber-400';
    return 'stroke-cyan-500 text-cyan-400';
  };

  const CircleGauge = ({ value, label, subtext, icon: Icon }: { value: number; label: string; subtext: string; icon: any }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="glass-panel glass-panel-hover p-5 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <Icon className="w-4 h-4 text-cyan-400" />
            <span>{label}</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {value}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">{subtext}</p>
        </div>

        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`transition-all duration-700 ease-out ${getGaugeColor(value)}`}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-xs font-bold text-slate-300 font-mono">
            {Math.round(value)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <CircleGauge
        value={cpu}
        label="CPU UTILIZATION"
        subtext={cpu > 70 ? 'High CPU Load' : 'Optimal CPU balance'}
        icon={Cpu}
      />

      <CircleGauge
        value={ram}
        label="MEMORY (RAM)"
        subtext={`${ramUsed} GB / ${ramTotal} GB Used`}
        icon={Activity}
      />

      <CircleGauge
        value={disk}
        label="DISK STORAGE"
        subtext={`${overview?.disk_used_gb ?? 0} GB / ${overview?.disk_total_gb ?? 0} GB`}
        icon={HardDrive}
      />

      <div className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>RUNNING PROCESSES</span>
          </div>
          <Network className="w-4 h-4 text-slate-500" />
        </div>

        <div className="my-2">
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {totalProcesses}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Active System Threads: ~{totalProcesses * 8}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>NET ↑ {netSent} KB/s</span>
          <span>NET ↓ {netRecv} KB/s</span>
        </div>
      </div>
    </div>
  );
};
