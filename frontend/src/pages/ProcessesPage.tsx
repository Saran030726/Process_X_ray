import React from 'react';
import { ProcessTable } from '../components/ProcessTable';
import type { ProcessItem } from '../types/process';
import { Cpu } from 'lucide-react';

interface ProcessesPageProps {
  processes: ProcessItem[];
  onSelectProcess: (proc: ProcessItem) => void;
  onExplainProcess: (proc: ProcessItem) => void;
  onTerminateProcess: (proc: ProcessItem) => void;
}

export const ProcessesPage: React.FC<ProcessesPageProps> = ({
  processes,
  onSelectProcess,
  onExplainProcess,
  onTerminateProcess
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Windows Processes Monitor</h2>
            <p className="text-xs text-slate-400">
              Live inspection of all running threads, executables, digital signatures, and resource usages.
            </p>
          </div>
        </div>
      </div>

      <ProcessTable
        processes={processes}
        onSelectProcess={onSelectProcess}
        onExplainProcess={onExplainProcess}
        onTerminateProcess={onTerminateProcess}
      />
    </div>
  );
};
