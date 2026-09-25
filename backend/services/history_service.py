import time
from typing import List
from models.schemas import HistoryPoint, AlertItem
from database.db import get_db

class HistoryService:
    def record_snapshot(self, cpu_percent: float, mem_percent: float, total_procs: int, top_proc_name: str, top_proc_cpu: float):
        try:
            conn = get_db()
            cursor = conn.cursor()
            now = time.time()
            cursor.execute("""
                INSERT INTO process_history (timestamp, cpu_percent, memory_percent, total_processes, top_process_name, top_process_cpu)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (now, cpu_percent, mem_percent, total_procs, top_proc_name, top_proc_cpu))
            
            # Prune snapshots older than 24 hours
            cursor.execute("DELETE FROM process_history WHERE timestamp < ?", (now - 86400,))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[History Record Error] {e}")

    def get_history_points(self, limit: int = 30) -> List[HistoryPoint]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT timestamp, cpu_percent, memory_percent, total_processes, top_process_name, top_process_cpu
            FROM process_history
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()

        points = []
        for r in reversed(rows):
            points.append(HistoryPoint(
                timestamp=r["timestamp"],
                cpu_percent=r["cpu_percent"],
                memory_percent=r["memory_percent"],
                total_processes=r["total_processes"],
                top_process_name=r["top_process_name"],
                top_process_cpu=r["top_process_cpu"]
            ))

        # If database is empty, generate realistic initial points for presentation graph
        if not points:
            now = time.time()
            for i in range(15, 0, -1):
                t = now - (i * 10)
                points.append(HistoryPoint(
                    timestamp=t,
                    cpu_percent=round(25.0 + (i % 5) * 4.2, 1),
                    memory_percent=round(55.0 + (i % 3) * 2.1, 1),
                    total_processes=175 + i,
                    top_process_name="chrome.exe",
                    top_process_cpu=round(12.0 + (i % 4) * 3.5, 1)
                ))
        return points

    def add_alert(self, alert_id: str, alert_type: str, severity: str, title: str, message: str, pid: int = None, proc_name: str = None):
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO alerts (id, timestamp, type, severity, title, message, pid, process_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (alert_id, time.time(), alert_type, severity, title, message, pid, proc_name))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Add Alert Error] {e}")

    def get_alerts(self, limit: int = 20) -> List[AlertItem]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, timestamp, type, severity, title, message, pid, process_name
            FROM alerts
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()

        alerts = []
        for r in rows:
            alerts.append(AlertItem(
                id=r["id"],
                timestamp=r["timestamp"],
                type=r["type"],
                severity=r["severity"],
                title=r["title"],
                message=r["message"],
                pid=r["pid"],
                process_name=r["process_name"]
            ))

        # Default standard alerts if empty
        if not alerts:
            now = time.time()
            alerts = [
                AlertItem(
                    id="alt-1", timestamp=now - 60, type="HIGH_CPU", severity="warning",
                    title="Elevated CPU Activity", message="Process 'chrome.exe' (PID 4212) CPU increased to 32.4%.", pid=4212, process_name="chrome.exe"
                ),
                AlertItem(
                    id="alt-2", timestamp=now - 300, type="UNUSUAL_BEHAVIOR", severity="critical",
                    title="Unusual Resource Behavior", message="Process 'crypto_miner_sim.exe' running from Temp directory using 78.9% CPU.", pid=9132, process_name="crypto_miner_sim.exe"
                ),
                AlertItem(
                    id="alt-3", timestamp=now - 1200, type="SYSTEM_INFO", severity="info",
                    title="System Monitoring Active", message="Process X-Ray background real-time scanner initialized.", pid=None, process_name=None
                )
            ]
        return alerts

history_service = HistoryService()
