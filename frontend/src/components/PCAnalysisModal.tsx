import React, { useState, useEffect } from 'react';
import { X, HelpCircle, AlertTriangle, CheckCircle2, Flame, Lightbulb } from 'lucide-react';
import type { DiagnosticReport } from '../types/process';
import { api } from '../services/api';

interface PCAnalysisModalProps {
  onClose: () => void;
  onSelectProcess: (proc: any) => void;
}

export const PCAnalysisModal: React.FC<PCAnalysisModalProps> = ({
  onClose,
  onSelectProcess
}) => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.diagnoseSlowPC()
      .then((data) => setReport(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 my-8">
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-400">
              <HelpCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">Why Is My PC Slow?</h3>
              <p className="text-xs text-amber-300/80 font-sans">Automated diagnostic report of current system bottlenecks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !report ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 text-sm font-semibold">Running deep hardware resource diagnostic scan...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="glass-panel p-5 rounded-2xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">SYSTEM HEALTH STATUS</span>
                <p className="text-sm text-slate-200">{report.summary}</p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold font-mono text-amber-400">
                  {report.system_health_score}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">CPU LOAD</span>
                <span className={`font-bold ${report.cpu_percent > 70 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {report.cpu_percent}%
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">RAM USAGE</span>
                <span className={`font-bold ${report.memory_percent > 80 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {report.memory_percent}%
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">DISK SPACE</span>
                <span className="font-bold text-slate-200">{report.disk_percent}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Top Resource Consumers</span>
              </h4>

              <div className="space-y-2">
                {report.top_cpu_consumers.map((proc, idx) => (
                  <div
                    key={proc.pid}
                    onClick={() => {
                      onClose();
                      onSelectProcess(proc);
                    }}
                    className="bg-slate-900/80 hover:bg-slate-800/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <div>
                        <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                          {proc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">PID {proc.pid}</span>
                        <span className="block text-[11px] text-slate-400">
                          Category: {proc.classification}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-extrabold text-orange-400 block">
                        {proc.cpu_percent}% CPU
                      </span>
                      <span className="text-xs text-slate-400">
                        {proc.memory_used_mb} MB RAM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Root Causes</span>
              </h4>

              <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/30 space-y-2">
                {report.possible_causes.map((cause, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-amber-200">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{cause}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <span>Safe Recommended Actions</span>
              </h4>

              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                {report.recommended_actions.map((action, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-5 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
