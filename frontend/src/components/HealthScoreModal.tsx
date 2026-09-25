import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Cpu, Activity, HardDrive, AlertCircle, Layers } from 'lucide-react';
import type { HealthScoreBreakdown } from '../types/process';
import { api } from '../services/api';

interface HealthScoreModalProps {
  onClose: () => void;
}

export const HealthScoreModal: React.FC<HealthScoreModalProps> = ({ onClose }) => {
  const [breakdown, setBreakdown] = useState<HealthScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealthBreakdown()
      .then((data) => setBreakdown(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30">
        <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">System Health Score Calculation</h3>
              <p className="text-xs text-slate-400">Transparent rule breakdown (0 to 100 points)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !breakdown ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            Loading health score rules calculation...
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">TOTAL SYSTEM HEALTH SCORE</span>
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {breakdown.total_score} / 100
                </span>
              </div>
              <span className="text-xs text-slate-400 max-w-xs text-right">
                Score is calculated deterministically from transparent hardware and process metrics rules.
              </span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-white block">CPU Utilization (Max 25 pts)</span>
                    <span className="text-slate-400">{breakdown.cpu_reason}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {breakdown.cpu_score} pts
                </span>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-white block">Memory (RAM) Health (Max 25 pts)</span>
                    <span className="text-slate-400">{breakdown.memory_reason}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {breakdown.memory_score} pts
                </span>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block">Storage Capacity (Max 20 pts)</span>
                    <span className="text-slate-400">{breakdown.disk_reason}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {breakdown.disk_score} pts
                </span>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-bold text-white block">Process Stability (Max 15 pts)</span>
                    <span className="text-slate-400">{breakdown.stability_reason}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-purple-400 text-sm">
                  {breakdown.process_stability_score} pts
                </span>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-bold text-white block">Resource Anomalies (Max 15 pts)</span>
                    <span className="text-slate-400">{breakdown.anomalies_reason}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {breakdown.anomalies_score} pts
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
