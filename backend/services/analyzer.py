import os
from typing import List, Tuple, Dict
from models.schemas import ProcessItem
from database.db import get_db
import time

CRITICAL_SYSTEM_PROCESSES = {
    "system", "system idle process", "smss.exe", "csrss.exe", 
    "wininit.exe", "services.exe", "lsass.exe", "svchost.exe", 
    "winlogon.exe", "dwm.exe", "spoolsv.exe", "explorer.exe", "ctfmon.exe", "taskhostw.exe"
}

SUSPICIOUS_PARENTS = {
    "cmd.exe": ["svchost.exe", "spoolsv.exe", "lsass.exe"],
    "powershell.exe": ["svchost.exe", "spoolsv.exe"],
    "mshta.exe": ["svchost.exe", "explorer.exe"],
}

class ProcessAnalyzer:
    def classify_process(self, item: ProcessItem) -> Tuple[str, str]:
        """
        Rule-based classification with transparent explanation.
        Categories:
        - NORMAL
        - LOW IMPACT
        - RESOURCE INTENSIVE
        - INVESTIGATE
        - UNKNOWN
        """
        name_lower = item.name.lower()
        path_lower = item.executable_path.lower() if item.executable_path else ""
        parent_lower = item.parent_name.lower() if item.parent_name else ""
        
        reasons = []

        # Check for core Windows/System processes
        if name_lower in CRITICAL_SYSTEM_PROCESSES:
            if item.cpu_percent > 50.0:
                return "RESOURCE INTENSIVE", f"Core Windows process '{item.name}' is currently consuming high CPU ({item.cpu_percent}%)."
            elif item.memory_bytes > 1024 * 1024 * 1024:
                return "RESOURCE INTENSIVE", f"Core Windows process '{item.name}' is using >1 GB RAM."
            return "NORMAL", f"Recognized Windows core system process ({item.name})."

        # Check suspicious executable locations (e.g., Temp execution with high CPU)
        if r"\appdata\local\temp" in path_lower and item.cpu_percent > 40.0:
            return "INVESTIGATE", f"Executing from Temporary directory with sustained elevated CPU ({item.cpu_percent}%)."

        # Check suspicious parent relationships
        if name_lower in SUSPICIOUS_PARENTS and parent_lower in SUSPICIOUS_PARENTS[name_lower]:
            return "INVESTIGATE", f"Command shell '{item.name}' was spawned by system service '{item.parent_name}'."

        # High resource usage check
        if item.cpu_percent >= 30.0 or item.memory_bytes >= 1024 * 1024 * 1024:
            details = []
            if item.cpu_percent >= 30.0:
                details.append(f"CPU at {item.cpu_percent}%")
            if item.memory_bytes >= 1024 * 1024 * 1024:
                mem_gb = round(item.memory_bytes / (1024**3), 2)
                details.append(f"RAM at {mem_gb} GB")
            return "RESOURCE INTENSIVE", f"High resource utilization: {', '.join(details)}."

        # Unverified binary with notable CPU/RAM
        if "Unverified" in item.digital_signature and item.cpu_percent > 20.0:
            return "INVESTIGATE", f"Unverified digital signature combined with moderate CPU usage ({item.cpu_percent}%)."

        # Low Impact check
        if item.cpu_percent < 1.0 and item.memory_bytes < 150 * 1024 * 1024:
            return "LOW IMPACT", "Minimal background activity (CPU < 1.0%, RAM < 150 MB)."

        # Standard active app
        if r"c:\program files" in path_lower or r"c:\windows" in path_lower:
            return "NORMAL", "Standard application running from verified directory."

        if not item.executable_path and item.digital_signature == "Unknown Location":
            return "UNKNOWN", "Process path inaccessible or restricted by system permissions."

        return "NORMAL", "Standard user process operating within normal parameters."

    def detect_anomalies(self, processes: List[ProcessItem]) -> List[Dict]:
        """
        Detects resource anomalies by comparing current metrics against stored SQLite baselines.
        """
        anomalies = []
        conn = get_db()
        cursor = conn.cursor()
        now = time.time()

        for proc in processes:
            # Get historical average CPU for this process name over the last hour
            cursor.execute("""
                SELECT AVG(cpu_percent), AVG(memory_bytes) 
                FROM process_metrics 
                WHERE name = ? AND timestamp > ?
            """, (proc.name, now - 3600))
            row = cursor.fetchone()

            if row and row[0] is not None and row[0] > 0.5:
                avg_cpu = row[0]
                # If current CPU is 5x higher than average baseline and above 25%
                if proc.cpu_percent > (avg_cpu * 5.0) and proc.cpu_percent > 25.0:
                    anomalies.append({
                        "pid": proc.pid,
                        "name": proc.name,
                        "current_cpu": proc.cpu_percent,
                        "baseline_cpu": round(avg_cpu, 1),
                        "reason": f"CPU usage ({proc.cpu_percent}%) is ~{round(proc.cpu_percent / avg_cpu, 1)}x higher than recent baseline average ({round(avg_cpu, 1)}%)."
                    })

        conn.close()
        return anomalies

process_analyzer = ProcessAnalyzer()
