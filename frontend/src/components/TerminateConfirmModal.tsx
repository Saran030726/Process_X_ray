import React, { useState } from 'react';
import { AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import type { ProcessItem } from '../types/process';

interface TerminateConfirmModalProps {
  process: ProcessItem | null;
  onClose: () => void;
  onConfirm: (proc: ProcessItem, force: boolean) => void;
  isProcessing: boolean;
}

export const TerminateConfirmModal: React.FC<TerminateConfirmModalProps> = ({
  process,
  onClose,
  onConfirm,
  isProcessing
}) => {
  const [forceKill, setForceKill] = useState(false);

  if (!process) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-rose-500/40 animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border-b border-rose-500/30 flex items-center space-x-3">
          <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/40 text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Confirm Process Termination</h3>
            <p className="text-xs text-rose-300/80 font-mono">Process X-Ray Safety Guard</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-200">
            Are you sure you want to terminate process <strong className="text-white font-mono">{process.name}</strong> (PID {process.pid})?
          </p>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Process Name:</span>
              <span className="font-bold text-white">{process.name}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>PID:</span>
              <span className="font-bold text-cyan-400">{process.pid}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Current CPU:</span>
              <span className="font-bold text-orange-400">{process.cpu_percent}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Current RAM:</span>
              <span className="font-bold text-amber-400">
                {(process.memory_bytes / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Executable Path:</span>
              <span className="font-sans text-[11px] text-slate-400 truncate max-w-[200px]" title={process.executable_path}>
                {process.executable_path || 'Restricted'}
              </span>
            </div>
          </div>

          {process.is_critical && (
            <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-500/50 flex items-start space-x-3 text-rose-200 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-300 font-bold uppercase tracking-wider mb-1">SYSTEM CRITICAL WARNING</strong>
                This process is marked as a core Windows component. Terminating it may cause Windows system instability or reboot.
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="forceKill"
              checked={forceKill}
              onChange={(e) => setForceKill(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
            />
            <label htmlFor="forceKill" className="text-xs text-slate-400 cursor-pointer">
              Force termination immediately (SIGKILL)
            </label>
          </div>
        </div>

        <div className="p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(process, forceKill)}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>{isProcessing ? 'Terminating...' : 'Confirm Termination'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
