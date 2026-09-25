from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProcessItem(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_bytes: int
    memory_percent: float
    executable_path: str = ""
    parent_pid: Optional[int] = None
    parent_name: str = ""
    create_time: float = 0.0
    username: str = ""
    num_threads: int = 0
    status: str = "running"
    disk_read_bytes: int = 0
    disk_write_bytes: int = 0
    net_connections: int = 0
    cmdline: str = ""
    digital_signature: str = "Unknown"  # Verified, Unverified, Unknown, System
    classification: str = "NORMAL"      # NORMAL, LOW IMPACT, RESOURCE INTENSIVE, INVESTIGATE, UNKNOWN
    classification_reason: str = ""
    is_critical: bool = False

class ProcessDetail(ProcessItem):
    children_pids: List[int] = []
    children_names: List[str] = []
    baseline_cpu_avg: float = 0.0
    baseline_mem_avg: float = 0.0
    is_anomaly: bool = False
    anomaly_reason: str = ""

class SystemOverview(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    memory_total_gb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    net_sent_kbps: float = 0.0
    net_recv_kbps: float = 0.0
    total_processes: int
    system_health_score: int
    is_demo_mode: bool = False
    timestamp: float

class AIExplanationResponse(BaseModel):
    pid: int
    process_name: str
    what_is_it: str
    what_is_it_doing: str
    why_is_it_running: str
    observed_facts: List[str]
    likely_interpretation: List[str]
    resource_impact_assessment: str
    should_i_close_it_recommendation: str # Usually leave running, May be closed if not needed, Investigate first, Do not terminate
    recommendation_reason: str
    is_ai_generated: bool = False

class DiagnosticTopConsumer(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    classification: str

class DiagnosticReport(BaseModel):
    system_health_score: int
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    total_processes: int
    top_cpu_consumers: List[DiagnosticTopConsumer]
    top_memory_consumers: List[DiagnosticTopConsumer]
    possible_causes: List[str]
    recommended_actions: List[str]
    summary: str

class HealthScoreBreakdown(BaseModel):
    total_score: int
    cpu_score: int
    cpu_deduction: int
    cpu_reason: str
    memory_score: int
    memory_deduction: int
    memory_reason: str
    disk_score: int
    disk_deduction: int
    disk_reason: str
    process_stability_score: int
    stability_deduction: int
    stability_reason: str
    anomalies_count: int
    anomalies_deduction: int
    anomalies_score: int = 15
    anomalies_reason: str

class AlertItem(BaseModel):
    id: str
    timestamp: float
    type: str  # HIGH_CPU, HIGH_RAM, UNUSUAL_BEHAVIOR, NEW_PROCESS, PROCESS_TERMINATED, SYSTEM_INFO
    severity: str # info, warning, critical, success
    title: str
    message: str
    pid: Optional[int] = None
    process_name: Optional[str] = None

class TerminateRequest(BaseModel):
    force: bool = False

class TerminateResponse(BaseModel):
    success: bool
    pid: int
    process_name: str
    message: str
    recorded_at: float

class HistoryPoint(BaseModel):
    timestamp: float
    cpu_percent: float
    memory_percent: float
    total_processes: int
    top_process_name: str
    top_process_cpu: float

class DemoModeToggle(BaseModel):
    enabled: bool
