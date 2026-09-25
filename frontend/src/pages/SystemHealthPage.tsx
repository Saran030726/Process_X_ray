import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Activity, HardDrive, Layers, AlertCircle, HelpCircle } from 'lucide-react';
import type { HealthScoreBreakdown, SystemOverview } from '../types/process';
import { api } from '../services/api';

interface SystemHealthPageProps {
  overview: SystemOverview | null;
  onDiagnoseSlow: () => void;
}

export const SystemHealthPage: React.FC<SystemHealthPageProps> = ({
  overview,
  onDiagnoseSlow
}) => {
  const [breakdown, setBreakdown] = useState<HealthScoreBreakdown | null>(null);

  useEffect(() => {
    api.getHealthBreakdown()
      .then((data) => setBreakdown(data))
      .catch((err) => console.error(err));
  }, [overview]);

  const score = overview?.system_health_score ?? 85;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">System Health Score Engine</h2>
            <p className="text-xs text-slate-400">
              Rule-based calculation engine evaluating system performance and resource health.
            </p>
          </div>
        </div>

        <button
          onClick={onDiagnoseSlow}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          <span>WHY IS MY PC SLOW?</span>
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/20">
        <div className="space-y-2">
          <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">OVERALL HEALTH SCORE</span>
          <h3 className="text-3xl font-extrabold text-white">
            {score >= 80 ? 'System is Healthy & Balanced' : score >= 60 ? 'Moderate Resource Load' : 'High System Resource Stress'}
          </h3>
          <p className="text-slate-400 text-xs max-w-xl">
            Calculated from transparent rules covering CPU utilization, RAM pressure, disk capacity, process stability, and anomalous resource behaviors.
          </p>
        </div>

        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="text-center font-mono">
            <span className="text-4xl font-extrabold text-cyan-400 block">{score}</span>
            <span className="text-xs text-slate-400">OUT OF 100</span>
          </div>
        </div>
      </div>

      {breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>CPU Score</span>
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">{breakdown.cpu_score} / 25</span>
            </div>
            <p className="text-xs text-slate-400">{breakdown.cpu_reason}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Memory (RAM) Score</span>
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">{breakdown.memory_score} / 25</span>
            </div>
            <p className="text-xs text-slate-400">{breakdown.memory_reason}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Storage Score</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{breakdown.disk_score} / 20</span>
            </div>
            <p className="text-xs text-slate-400">{breakdown.disk_reason}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Process Stability</span>
              </span>
              <span className="font-mono font-bold text-purple-400 text-sm">{breakdown.process_stability_score} / 15</span>
            </div>
            <p className="text-xs text-slate-400">{breakdown.stability_reason}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Anomalies Baseline</span>
              </span>
              <span className="font-mono font-bold text-rose-400 text-sm">{breakdown.anomalies_score} / 15</span>
            </div>
            <p className="text-xs text-slate-400">{breakdown.anomalies_reason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
