import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Sparkles,
  Eye,
  XCircle,
  ShieldCheck,
  Folder
} from 'lucide-react';
import type { ProcessItem, ProcessClassification } from '../types/process';

interface ProcessTableProps {
  processes: ProcessItem[];
  onSelectProcess: (process: ProcessItem) => void;
  onExplainProcess: (process: ProcessItem) => void;
  onTerminateProcess: (process: ProcessItem) => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  onSelectProcess,
  onExplainProcess,
  onTerminateProcess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'cpu' | 'ram' | 'name' | 'pid'>('cpu');

  const filtered = processes.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pid.toString().includes(searchTerm) ||
      p.executable_path.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass =
      classificationFilter === 'ALL' || p.classification === classificationFilter;

    return matchesSearch && matchesClass;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'cpu') return b.cpu_percent - a.cpu_percent;
    if (sortBy === 'ram') return b.memory_bytes - a.memory_bytes;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'pid') return a.pid - b.pid;
    return 0;
  });

  const getBadgeStyle = (classification: ProcessClassification) => {
    switch (classification) {
      case 'NORMAL':
        return 'badge-normal';
      case 'LOW IMPACT':
        return 'badge-low-impact';
      case 'RESOURCE INTENSIVE':
        return 'badge-resource-intensive';
      case 'INVESTIGATE':
        return 'badge-investigate';
      default:
        return 'badge-unknown';
    }
  };

  const formatMemory = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search process name, PID, or path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Categories</option>
              <option value="NORMAL" className="bg-slate-900">🟢 Normal</option>
              <option value="LOW IMPACT" className="bg-slate-900">🟡 Low Impact</option>
              <option value="RESOURCE INTENSIVE" className="bg-slate-900">🟠 Resource Intensive</option>
              <option value="INVESTIGATE" className="bg-slate-900">🔵 Investigate</option>
              <option value="UNKNOWN" className="bg-slate-900">⚪ Unknown</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="cpu" className="bg-slate-900">Sort by CPU %</option>
              <option value="ram" className="bg-slate-900">Sort by RAM Usage</option>
              <option value="name" className="bg-slate-900">Sort by Name</option>
              <option value="pid" className="bg-slate-900">Sort by PID</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-cyan-400">{sorted.length}</strong> processes
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Process & PID</th>
              <th className="py-3.5 px-4">CPU %</th>
              <th className="py-3.5 px-4">RAM Usage</th>
              <th className="py-3.5 px-4">Location / Signature</th>
              <th className="py-3.5 px-4">Parent</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
            {sorted.map((proc) => (
              <tr
                key={proc.pid}
                className="hover:bg-slate-800/30 transition-colors group"
              >
                <td className="py-3 px-4">
                  <span className={getBadgeStyle(proc.classification)}>
                    {proc.classification}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span
                      onClick={() => onSelectProcess(proc)}
                      className="font-sans font-bold text-slate-100 group-hover:text-cyan-400 cursor-pointer transition-colors"
                    >
                      {proc.name}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      PID {proc.pid}
                    </span>
                    {proc.is_critical && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 rounded font-sans">
                        CORE SYSTEM
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          proc.cpu_percent > 30 ? 'bg-orange-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${Math.min(100, proc.cpu_percent)}%` }}
                      />
                    </div>
                    <span className={`font-semibold ${proc.cpu_percent > 30 ? 'text-orange-400' : 'text-slate-300'}`}>
                      {proc.cpu_percent.toFixed(1)}%
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div>
                    <span className={`font-semibold ${proc.memory_bytes > 1024*1024*1024 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {formatMemory(proc.memory_bytes)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({proc.memory_percent.toFixed(1)}%)
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1 truncate" title={proc.executable_path}>
                    <Folder className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{proc.executable_path || 'Inaccessible'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{proc.digital_signature}</span>
                  </div>
                </td>

                <td className="py-3 px-4 text-[11px] text-slate-400">
                  {proc.parent_name ? (
                    <span>{proc.parent_name} <span className="text-slate-400">({proc.parent_pid})</span></span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2 font-sans">
                    <button
                      onClick={() => onSelectProcess(proc)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Inspect Process Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onExplainProcess(proc)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors"
                      title="AI Process Explanation"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Explain</span>
                    </button>

                    <button
                      onClick={() => onTerminateProcess(proc)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Terminate Process"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  No processes matched search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
