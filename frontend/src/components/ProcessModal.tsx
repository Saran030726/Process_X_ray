import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  User,
  Clock,
  Terminal,
  GitCommit,
  CheckCircle,
  Info,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import type { ProcessItem, ProcessDetail, AIExplanationResponse } from '../types/process';
import { api } from '../services/api';

interface ProcessModalProps {
  process: ProcessItem | null;
  onClose: () => void;
  onTerminate: (proc: ProcessItem) => void;
}

export const ProcessModal: React.FC<ProcessModalProps> = ({
  process,
  onClose,
  onTerminate
}) => {
  const [detail, setDetail] = useState<ProcessDetail | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (process) {
      setAiExplanation(null);
      api.getProcessDetail(process.pid)
        .then((data) => setDetail(data))
        .catch((err) => console.error(err));
    } else {
      setDetail(null);
      setAiExplanation(null);
    }
  }, [process]);

  if (!process) return null;

  const handleFetchExplanation = async () => {
    setIsExplaining(true);
    try {
      const res = await api.explainProcess(process.pid);
      setAiExplanation(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  const currentProc = detail || process;

  const getRecBadge = (rec: string) => {
    switch (rec) {
      case 'Do not terminate':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Investigate first':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'May be closed if not needed':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 my-8">
        <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-white">{currentProc.name}</h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  PID {currentProc.pid}
                </span>
                <span className="badge-normal">
                  {currentProc.classification}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xl">
                {currentProc.executable_path || 'Location Restricted'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold block mb-1">CPU UTILIZATION</span>
              <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                {currentProc.cpu_percent.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold block mb-1">MEMORY (RAM)</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {(currentProc.memory_bytes / (1024 * 1024)).toFixed(1)} MB
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">({currentProc.memory_percent.toFixed(1)}%)</span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold block mb-1">DISK READ / WRITE</span>
              <span className="text-sm font-bold text-slate-200 font-mono block">
                R: {(currentProc.disk_read_bytes / (1024 * 1024)).toFixed(1)} MB
              </span>
              <span className="text-sm font-bold text-slate-200 font-mono block">
                W: {(currentProc.disk_write_bytes / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold block mb-1">ACTIVE CONNECTIONS</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {currentProc.net_connections}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">{currentProc.num_threads} Threads</span>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Classification Reason</span>
            </h4>
            <p className="text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 font-sans">
              {currentProc.classification_reason || 'Operating within normal expected parameters.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <User className="w-4 h-4 text-slate-500" />
                <span>User: <strong className="text-white font-mono">{currentProc.username}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Signature: <strong className="text-white">{currentProc.digital_signature}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span className="truncate">Command Line: <code className="text-cyan-300">{currentProc.cmdline || 'N/A'}</code></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Started: <strong className="text-white font-mono">{new Date(currentProc.create_time * 1000).toLocaleTimeString()}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Process Relationship Hierarchy</span>
            </h4>
            <div className="flex items-center space-x-3 text-xs bg-slate-950/80 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              <div className="bg-slate-800 px-3 py-2 rounded-xl text-slate-300 border border-slate-700">
                <span className="block text-[10px] text-slate-500">PARENT PROCESS</span>
                <span className="font-bold text-white">{currentProc.parent_name || 'System'}</span>
                <span className="block text-[10px] font-mono text-slate-400">PID {currentProc.parent_pid || 0}</span>
              </div>

              <div className="text-slate-600 font-bold">→</div>

              <div className="bg-cyan-500/20 border border-cyan-500/50 px-4 py-2 rounded-xl text-cyan-200">
                <span className="block text-[10px] text-cyan-400 font-bold">SELECTED PROCESS</span>
                <span className="font-bold text-white">{currentProc.name}</span>
                <span className="block text-[10px] font-mono text-cyan-300">PID {currentProc.pid}</span>
              </div>

              {detail && detail.children_names.length > 0 && (
                <>
                  <div className="text-slate-600 font-bold">→</div>
                  <div className="flex space-x-2">
                    {detail.children_names.slice(0, 3).map((childName, idx) => (
                      <div key={idx} className="bg-slate-800 px-3 py-2 rounded-xl text-slate-300 border border-slate-700">
                        <span className="block text-[10px] text-slate-500">CHILD PROCESS</span>
                        <span className="font-bold text-white">{childName}</span>
                        <span className="block text-[10px] font-mono text-slate-400">PID {detail.children_pids[idx]}</span>
                      </div>
                    ))}
                    {detail.children_names.length > 3 && (
                      <div className="bg-slate-800 px-2 py-2 rounded-xl text-slate-400 text-xs flex items-center">
                        +{detail.children_names.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-slate-900/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">AI Process Insight</h4>
                  <p className="text-xs text-slate-400">Generates beginner-friendly explanations with observed facts vs likely interpretation.</p>
                </div>
              </div>

              {!aiExplanation && (
                <button
                  onClick={handleFetchExplanation}
                  disabled={isExplaining}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isExplaining ? 'animate-spin' : ''}`} />
                  <span>{isExplaining ? 'Analyzing Process...' : 'Explain This Process'}</span>
                </button>
              )}
            </div>

            {aiExplanation && (
              <div className="space-y-4 pt-2 text-xs">
                <div className={`p-4 rounded-xl border flex items-start justify-between ${getRecBadge(aiExplanation.should_i_close_it_recommendation)}`}>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider block opacity-80">RECOMMENDATION</span>
                    <h5 className="text-sm font-extrabold mt-0.5">{aiExplanation.should_i_close_it_recommendation}</h5>
                    <p className="text-xs mt-1 opacity-90">{aiExplanation.recommendation_reason}</p>
                  </div>
                  {aiExplanation.is_ai_generated && (
                    <span className="text-[10px] bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 px-2 py-0.5 rounded font-mono">
                      AI GENERATED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">What is it?</span>
                    <p className="text-slate-300 leading-relaxed">{aiExplanation.what_is_it}</p>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">What is it doing?</span>
                    <p className="text-slate-300 leading-relaxed">{aiExplanation.what_is_it_doing}</p>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">Why is it running?</span>
                    <p className="text-slate-300 leading-relaxed">{aiExplanation.why_is_it_running}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block mb-2 flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Observed Evidence (Facts)</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {aiExplanation.observed_facts.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-950/20 p-3.5 rounded-xl border border-blue-500/30">
                    <span className="text-blue-400 font-bold block mb-2 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Likely Interpretation</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {aiExplanation.likely_interpretation.map((interp, idx) => (
                        <li key={idx}>{interp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Panel
          </button>

          <button
            onClick={() => onTerminate(currentProc)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Terminate Process</span>
          </button>
        </div>
      </div>
    </div>
  );
};
