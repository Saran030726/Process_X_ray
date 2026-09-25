import type {
  SystemOverview, ProcessItem, ProcessDetail, AIExplanationResponse,
  DiagnosticReport, HealthScoreBreakdown, AlertItem, HistoryPoint, TerminateResponse
} from '../types/process';

const BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }
  return res.json();
}

export const api = {
  getSystem: (): Promise<SystemOverview> => 
    fetchJson<SystemOverview>(`${BASE_URL}/system`),

  getProcesses: (params?: { search?: string; sort_by?: string; classification_filter?: string }): Promise<ProcessItem[]> => {
    const qp = new URLSearchParams();
    if (params?.search) qp.append('search', params.search);
    if (params?.sort_by) qp.append('sort_by', params.sort_by);
    if (params?.classification_filter && params.classification_filter !== 'ALL') {
      qp.append('classification_filter', params.classification_filter);
    }
    return fetchJson<ProcessItem[]>(`${BASE_URL}/processes?${qp.toString()}`);
  },

  getProcessDetail: (pid: number): Promise<ProcessDetail> =>
    fetchJson<ProcessDetail>(`${BASE_URL}/processes/${pid}`),

  getProcessTree: (): Promise<{ nodes: any[]; edges: any[]; total: number }> =>
    fetchJson<{ nodes: any[]; edges: any[]; total: number }>(`${BASE_URL}/tree`),

  explainProcess: (pid: number): Promise<AIExplanationResponse> =>
    fetchJson<AIExplanationResponse>(`${BASE_URL}/processes/${pid}/explain`, { method: 'POST' }),

  terminateProcess: (pid: number, force: boolean = false): Promise<TerminateResponse> =>
    fetchJson<TerminateResponse>(`${BASE_URL}/processes/${pid}/terminate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force })
    }),

  diagnoseSlowPC: (): Promise<DiagnosticReport> =>
    fetchJson<DiagnosticReport>(`${BASE_URL}/diagnose-slow`, { method: 'POST' }),

  getHealthBreakdown: (): Promise<HealthScoreBreakdown> =>
    fetchJson<HealthScoreBreakdown>(`${BASE_URL}/health`),

  getHistory: (limit: number = 30): Promise<HistoryPoint[]> =>
    fetchJson<HistoryPoint[]>(`${BASE_URL}/history?limit=${limit}`),

  getAlerts: (limit: number = 20): Promise<AlertItem[]> =>
    fetchJson<AlertItem[]>(`${BASE_URL}/alerts?limit=${limit}`),

  triggerScan: (): Promise<{ message: string }> =>
    fetchJson<{ message: string }>(`${BASE_URL}/scan`, { method: 'POST' }),

  setDemoMode: (enabled: boolean): Promise<{ message: string; is_demo_mode: boolean }> =>
    fetchJson<{ message: string; is_demo_mode: boolean }>(`${BASE_URL}/demo-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    })
};
