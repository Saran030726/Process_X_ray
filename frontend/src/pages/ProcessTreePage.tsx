import React, { useState, useEffect } from 'react';
import { GitFork, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface ProcessTreePageProps {
  onSelectProcessByPid: (pid: number) => void;
}

export const ProcessTreePage: React.FC<ProcessTreePageProps> = ({ onSelectProcessByPid }) => {
  const [treeData, setTreeData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchTree = () => {
    setLoading(true);
    api.getProcessTree()
      .then((data) => setTreeData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const getClassColor = (cls: string) => {
    switch (cls) {
      case 'RESOURCE INTENSIVE':
        return 'border-orange-500/60 bg-orange-950/30 text-orange-200';
      case 'INVESTIGATE':
        return 'border-cyan-500/60 bg-cyan-950/30 text-cyan-200';
      case 'LOW IMPACT':
        return 'border-amber-500/60 bg-amber-950/30 text-amber-200';
      default:
        return 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Visual Process Hierarchy Tree</h2>
            <p className="text-xs text-slate-400">
              Parent-to-child process tree mapping process execution lineages across Windows.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={fetchTree}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Refresh Hierarchy"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl overflow-hidden min-h-[600px] flex flex-col justify-between relative">
        {loading || !treeData ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-slate-400 text-xs font-mono">Building parent process dependency tree...</p>
          </div>
        ) : (
          <div
            className="overflow-auto transition-transform duration-200 p-4"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treeData.nodes.map((node) => {
                const d = node.data;
                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectProcessByPid(d.pid)}
                    className={`p-4 rounded-xl border ${getClassColor(d.classification)} hover:border-cyan-400 cursor-pointer transition-all duration-200 shadow-lg group`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {d.name}
                      </span>
                      <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded font-mono text-slate-300 border border-slate-700">
                        PID {d.pid}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parent:</span>
                        <span>{d.parent_name || 'System'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CPU Usage:</span>
                        <span className="font-bold text-orange-400">{d.cpu_percent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Memory:</span>
                        <span>{(d.memory_bytes / (1024 * 1024)).toFixed(0)} MB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
