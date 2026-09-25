import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProcessModal } from './components/ProcessModal';
import { PCAnalysisModal } from './components/PCAnalysisModal';
import { HealthScoreModal } from './components/HealthScoreModal';
import { TerminateConfirmModal } from './components/TerminateConfirmModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { ProcessesPage } from './pages/ProcessesPage';
import { ProcessTreePage } from './pages/ProcessTreePage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { HistoryPage } from './pages/HistoryPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './services/api';
import type { SystemOverview, ProcessItem, AlertItem } from './types/process';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Modals
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [terminateProcess, setTerminateProcess] = useState<ProcessItem | null>(null);
  const [isTerminating, setIsTerminating] = useState<boolean>(false);
  const [showPCAnalysisModal, setShowPCAnalysisModal] = useState<boolean>(false);
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshData = async () => {
    try {
      const [sys, procs, alts] = await Promise.all([
        api.getSystem(),
        api.getProcesses(),
        api.getAlerts()
      ]);
      setSystemOverview(sys);
      setProcesses(procs);
      setAlerts(alts);
      setIsDemoMode(sys.is_demo_mode);
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleScanNow = async () => {
    setIsScanning(true);
    try {
      await api.triggerScan();
      await refreshData();
      addToast('success', 'Scan Completed', 'Process list and system metrics rescanned successfully.');
    } catch (e: any) {
      addToast('error', 'Scan Error', e.message || 'Failed to trigger process scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleDemoMode = async (enabled: boolean) => {
    try {
      const res = await api.setDemoMode(enabled);
      setIsDemoMode(res.is_demo_mode);
      await refreshData();
      addToast(
        'info',
        res.is_demo_mode ? 'Demo Mode Active' : 'Live System Active',
        res.is_demo_mode
          ? 'Switched to simulated hackathon dataset.'
          : 'Switched to real Windows process scanner.'
      );
    } catch (e: any) {
      addToast('error', 'Mode Toggle Failed', e.message);
    }
  };

  const handleConfirmTerminate = async (proc: ProcessItem, force: boolean) => {
    setIsTerminating(true);
    try {
      const res = await api.terminateProcess(proc.pid, force);
      if (res.success) {
        addToast('success', 'Process Terminated', res.message);
        setTerminateProcess(null);
        setSelectedProcess(null);
        await refreshData();
      } else {
        addToast('error', 'Termination Blocked', res.message);
      }
    } catch (e: any) {
      addToast('error', 'Termination Error', e.message);
    } finally {
      setIsTerminating(false);
    }
  };

  const handleSelectProcessByPid = (pid: number) => {
    const proc = processes.find((p) => p.pid === pid);
    if (proc) {
      setSelectedProcess(proc);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070a12] text-slate-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          systemOverview={systemOverview}
          onScanNow={handleScanNow}
          onDiagnoseSlow={() => setShowPCAnalysisModal(true)}
          onOpenHealthModal={() => setShowHealthModal(true)}
          isScanning={isScanning}
        />

        <main className="p-8 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardPage
              systemOverview={systemOverview}
              processes={processes}
              alerts={alerts}
              onSelectProcess={(proc) => setSelectedProcess(proc)}
              onExplainProcess={(proc) => setSelectedProcess(proc)}
              onTerminateProcess={(proc) => setTerminateProcess(proc)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'processes' && (
            <ProcessesPage
              processes={processes}
              onSelectProcess={(proc) => setSelectedProcess(proc)}
              onExplainProcess={(proc) => setSelectedProcess(proc)}
              onTerminateProcess={(proc) => setTerminateProcess(proc)}
            />
          )}

          {activeTab === 'tree' && (
            <ProcessTreePage
              onSelectProcessByPid={handleSelectProcessByPid}
            />
          )}

          {activeTab === 'health' && (
            <SystemHealthPage
              overview={systemOverview}
              onDiagnoseSlow={() => setShowPCAnalysisModal(true)}
            />
          )}

          {activeTab === 'history' && <HistoryPage />}

          {activeTab === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              processes={processes}
              onSelectProcessByPid={handleSelectProcessByPid}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
            />
          )}
        </main>
      </div>

      {selectedProcess && (
        <ProcessModal
          process={selectedProcess}
          onClose={() => setSelectedProcess(null)}
          onTerminate={(proc) => setTerminateProcess(proc)}
        />
      )}

      {terminateProcess && (
        <TerminateConfirmModal
          process={terminateProcess}
          onClose={() => setTerminateProcess(null)}
          onConfirm={handleConfirmTerminate}
          isProcessing={isTerminating}
        />
      )}

      {showPCAnalysisModal && (
        <PCAnalysisModal
          onClose={() => setShowPCAnalysisModal(false)}
          onSelectProcess={(proc) => handleSelectProcessByPid(proc.pid)}
        />
      )}

      {showHealthModal && (
        <HealthScoreModal onClose={() => setShowHealthModal(false)} />
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
