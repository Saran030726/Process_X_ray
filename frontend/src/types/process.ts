export type ProcessClassification = 'NORMAL' | 'LOW IMPACT' | 'RESOURCE INTENSIVE' | 'INVESTIGATE' | 'UNKNOWN';

export interface ProcessItem {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_bytes: number;
  memory_percent: number;
  executable_path: string;
  parent_pid: number | null;
  parent_name: string;
  create_time: number;
  username: string;
  num_threads: number;
  status: string;
  disk_read_bytes: number;
  disk_write_bytes: number;
  net_connections: number;
  cmdline: string;
  digital_signature: string;
  classification: ProcessClassification;
  classification_reason: string;
  is_critical: boolean;
}

export interface ProcessDetail extends ProcessItem {
  children_pids: number[];
  children_names: string[];
  baseline_cpu_avg: number;
  baseline_mem_avg: number;
  is_anomaly: boolean;
  anomaly_reason: string;
}

export interface SystemOverview {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  net_sent_kbps: number;
  net_recv_kbps: number;
  total_processes: number;
  system_health_score: number;
  is_demo_mode: boolean;
  timestamp: number;
}

export interface AIExplanationResponse {
  pid: number;
  process_name: string;
  what_is_it: string;
  what_is_it_doing: string;
  why_is_it_running: string;
  observed_facts: string[];
  likely_interpretation: string[];
  resource_impact_assessment: string;
  should_i_close_it_recommendation: 'Usually leave running' | 'May be closed if not needed' | 'Investigate first' | 'Do not terminate';
  recommendation_reason: string;
  is_ai_generated: boolean;
}

export interface DiagnosticTopConsumer {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  classification: ProcessClassification;
}

export interface DiagnosticReport {
  system_health_score: number;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  total_processes: number;
  top_cpu_consumers: DiagnosticTopConsumer[];
  top_memory_consumers: DiagnosticTopConsumer[];
  possible_causes: string[];
  recommended_actions: string[];
  summary: string;
}

export interface HealthScoreBreakdown {
  total_score: number;
  cpu_score: number;
  cpu_deduction: number;
  cpu_reason: string;
  memory_score: number;
  memory_deduction: number;
  memory_reason: string;
  disk_score: number;
  disk_deduction: number;
  disk_reason: string;
  process_stability_score: number;
  stability_deduction: number;
  stability_reason: string;
  anomalies_count: number;
  anomalies_deduction: number;
  anomalies_score: number;
  anomalies_reason: string;
}

export interface AlertItem {
  id: string;
  timestamp: number;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  pid: number | null;
  process_name: string | null;
}

export interface HistoryPoint {
  timestamp: number;
  cpu_percent: number;
  memory_percent: number;
  total_processes: number;
  top_process_name: string;
  top_process_cpu: number;
}

export interface TerminateResponse {
  success: boolean;
  pid: number;
  process_name: string;
  message: string;
  recorded_at: number;
}
