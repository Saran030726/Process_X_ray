from typing import List, Dict, Tuple
from models.schemas import SystemOverview, ProcessItem, HealthScoreBreakdown, DiagnosticReport, DiagnosticTopConsumer

class SystemHealthService:
    def calculate_health_score(self, overview: SystemOverview, processes: List[ProcessItem], anomalies_count: int = 0) -> Tuple[int, HealthScoreBreakdown]:
        """
        Calculates a transparent 0-100 system health score based on objective metrics.
        """
        # 1. CPU Score (25 pts max)
        cpu_deduction = 0
        if overview.cpu_percent > 85:
            cpu_deduction = 20
        elif overview.cpu_percent > 70:
            cpu_deduction = 12
        elif overview.cpu_percent > 50:
            cpu_deduction = 5
        cpu_score = max(0, 25 - cpu_deduction)
        cpu_reason = f"CPU utilization at {overview.cpu_percent}% (-{cpu_deduction} pts)" if cpu_deduction > 0 else "CPU utilization normal"

        # 2. Memory Score (25 pts max)
        mem_deduction = 0
        if overview.memory_percent > 90:
            mem_deduction = 20
        elif overview.memory_percent > 80:
            mem_deduction = 12
        elif overview.memory_percent > 65:
            mem_deduction = 5
        memory_score = max(0, 25 - mem_deduction)
        memory_reason = f"RAM usage at {overview.memory_percent}% (-{mem_deduction} pts)" if mem_deduction > 0 else "RAM usage within healthy threshold"

        # 3. Disk Score (20 pts max)
        disk_deduction = 0
        if overview.disk_percent > 90:
            disk_deduction = 15
        elif overview.disk_percent > 80:
            disk_deduction = 8
        disk_score = max(0, 20 - disk_deduction)
        disk_reason = f"Primary disk space at {overview.disk_percent}% (-{disk_deduction} pts)" if disk_deduction > 0 else "Disk storage healthy"

        # 4. Process Stability (15 pts max)
        investigate_count = sum(1 for p in processes if p.classification == "INVESTIGATE")
        resource_intensive_count = sum(1 for p in processes if p.classification == "RESOURCE INTENSIVE")
        
        stability_deduction = min(15, (investigate_count * 5) + (resource_intensive_count * 2))
        process_stability_score = max(0, 15 - stability_deduction)
        stability_reason = f"Detected {investigate_count} process(es) needing investigation and {resource_intensive_count} heavy resource process(es) (-{stability_deduction} pts)" if stability_deduction > 0 else "Process load balanced"

        # 5. Anomaly Score (15 pts max)
        anomalies_deduction = min(15, anomalies_count * 7)
        anomalies_score = max(0, 15 - anomalies_deduction)
        anomalies_reason = f"Identified {anomalies_count} resource usage anomaly alert(s) (-{anomalies_deduction} pts)" if anomalies_deduction > 0 else "No active resource anomalies detected"

        total_score = cpu_score + memory_score + disk_score + process_stability_score + anomalies_score

        breakdown = HealthScoreBreakdown(
            total_score=total_score,
            cpu_score=cpu_score,
            cpu_deduction=cpu_deduction,
            cpu_reason=cpu_reason,
            memory_score=memory_score,
            memory_deduction=mem_deduction,
            memory_reason=memory_reason,
            disk_score=disk_score,
            disk_deduction=disk_deduction,
            disk_reason=disk_reason,
            process_stability_score=process_stability_score,
            stability_deduction=stability_deduction,
            stability_reason=stability_reason,
            anomalies_count=anomalies_count,
            anomalies_deduction=anomalies_deduction,
            anomalies_score=anomalies_score,
            anomalies_reason=anomalies_reason
        )

        return total_score, breakdown

    def generate_slow_pc_report(self, overview: SystemOverview, processes: List[ProcessItem], health_score: int) -> DiagnosticReport:
        """
        Generates the 'Why Is My PC Slow?' diagnostic report.
        """
        top_cpu = sorted(processes, key=lambda p: p.cpu_percent, reverse=True)[:3]
        top_mem = sorted(processes, key=lambda p: p.memory_bytes, reverse=True)[:3]

        top_cpu_list = [
            DiagnosticTopConsumer(
                pid=p.pid,
                name=p.name,
                cpu_percent=p.cpu_percent,
                memory_percent=p.memory_percent,
                memory_used_mb=round(p.memory_bytes / (1024 * 1024), 1),
                classification=p.classification
            ) for p in top_cpu
        ]

        top_mem_list = [
            DiagnosticTopConsumer(
                pid=p.pid,
                name=p.name,
                cpu_percent=p.cpu_percent,
                memory_percent=p.memory_percent,
                memory_used_mb=round(p.memory_bytes / (1024 * 1024), 1),
                classification=p.classification
            ) for p in top_mem
        ]

        possible_causes = []
        recommended_actions = []

        if overview.cpu_percent > 75:
            top_cpu_name = top_cpu[0].name if top_cpu else "Unknown process"
            possible_causes.append(f"High CPU utilization ({overview.cpu_percent}%) primarily driven by '{top_cpu_name}'.")
            recommended_actions.append(f"Inspect '{top_cpu_name}' details to see if it is running active tasks or stuck in a processing loop.")

        if overview.memory_percent > 80:
            top_mem_name = top_mem[0].name if top_mem else "Unknown process"
            possible_causes.append(f"High RAM pressure ({overview.memory_percent}% used), leading to possible system paging to disk.")
            recommended_actions.append(f"Close unused browser tabs or secondary applications like '{top_mem_name}' to free system memory.")

        if overview.disk_percent > 85:
            possible_causes.append(f"Main storage drive is near full capacity ({overview.disk_percent}%).")
            recommended_actions.append("Clear temporary cache files or remove unneeded downloads from your disk.")

        investigate_procs = [p for p in processes if p.classification == "INVESTIGATE"]
        if investigate_procs:
            possible_causes.append(f"Found {len(investigate_procs)} process(es) marked for investigation due to unusual location or activity.")
            recommended_actions.append("Review processes marked with 'INVESTIGATE' badge in the Process Table.")

        if not possible_causes:
            possible_causes.append("System resources are currently operating within comfortable parameters.")
            recommended_actions.append("No immediate intervention required. System responsiveness is optimal.")

        summary = f"System Health Score is {health_score}/100. "
        if health_score < 60:
            summary += "Your PC is under heavy resource stress. Review the top consumers below."
        elif health_score < 80:
            summary += "Your PC is experiencing moderate resource load."
        else:
            summary += "Your PC is running smoothly."

        return DiagnosticReport(
            system_health_score=health_score,
            cpu_percent=overview.cpu_percent,
            memory_percent=overview.memory_percent,
            disk_percent=overview.disk_percent,
            total_processes=len(processes),
            top_cpu_consumers=top_cpu_list,
            top_memory_consumers=top_mem_list,
            possible_causes=possible_causes,
            recommended_actions=recommended_actions,
            summary=summary
        )

system_health_service = SystemHealthService()
