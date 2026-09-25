import React from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { AlertItem, ProcessItem } from '../types/process';

interface AlertsPageProps {
  alerts: AlertItem[];
  processes?: ProcessItem[];
  onSelectProcessByPid: (pid: number) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onSelectProcessByPid
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">Activity Center & Anomaly Alerts</h2>
          <p className="text-xs text-slate-400">
            Real-time feed of detected resource spikes, unusual behavior alerts, and user process actions.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="space-y-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              onClick={() => {
                if (alt.pid) onSelectProcessByPid(alt.pid);
              }}
              className={`p-4 rounded-xl border bg-slate-900/60 transition-all ${
                alt.pid ? 'hover:border-cyan-500/50 cursor-pointer' : ''
              } border-slate-800 flex items-start justify-between`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {alt.severity === 'critical' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                  {alt.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {alt.severity === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {alt.severity === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{alt.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase font-bold ${getSeverityBadge(alt.severity)}`}>
                      {alt.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{alt.message}</p>
                  {alt.process_name && (
                    <span className="text-[11px] font-mono text-cyan-400 mt-1 block">
                      Target Process: {alt.process_name} {alt.pid ? `(PID ${alt.pid})` : ''}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs font-mono text-slate-500">
                {new Date(alt.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-sans text-sm">
              No recent alerts or notifications recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
