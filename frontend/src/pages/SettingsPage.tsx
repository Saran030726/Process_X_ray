import React, { useState } from 'react';
import { Settings, Key, Sliders, Monitor } from 'lucide-react';

interface SettingsPageProps {
  isDemoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDemoMode,
  onToggleDemoMode
}) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">Application Settings</h2>
          <p className="text-xs text-slate-400">
            Configure AI explanation API parameters, local fallback options, and presentation modes.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Key className="w-4 h-4 text-cyan-400" />
          <span>AI Explanation Engine Key (Optional)</span>
        </div>
        <p className="text-xs text-slate-400">
          Process X-Ray uses an intelligent structured local rule engine by default. To connect a live cloud LLM (Gemini, OpenAI, Anthropic), enter your API key below.
        </p>

        <form onSubmit={handleSaveKey} className="space-y-3 max-w-md">
          <input
            type="password"
            placeholder="AI_API_KEY (e.g. AIzaSy...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20"
          >
            {savedKey ? 'Saved to Session!' : 'Save Key'}
          </button>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Hackathon Demo Mode</span>
        </div>
        <p className="text-xs text-slate-400">
          Enabling Demo Mode loads a controlled, realistic process dataset containing high CPU/RAM hogs, an anomaly miner process, and baseline trends for presentation.
        </p>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onToggleDemoMode(!isDemoMode)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              isDemoMode
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isDemoMode ? 'Demo Mode Active (Click to Switch to Live)' : 'Switch to Demo Mode'}
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-3 font-mono text-xs text-slate-300">
        <div className="flex items-center space-x-2 text-white font-sans font-bold text-sm mb-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>System Environment Info</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span>Application Name:</span>
          <span className="text-white font-bold">Process X-Ray</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span>Backend Framework:</span>
          <span className="text-cyan-400 font-bold">Python 3.13 + FastAPI + psutil</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span>Frontend Stack:</span>
          <span className="text-amber-400 font-bold">Vite + React + TS + Tailwind CSS</span>
        </div>
        <div className="flex justify-between">
          <span>Database Storage:</span>
          <span className="text-emerald-400 font-bold">SQLite (process_xray.db)</span>
        </div>
      </div>
    </div>
  );
};
