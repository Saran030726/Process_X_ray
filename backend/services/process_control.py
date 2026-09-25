import psutil
import time
from typing import Tuple
from models.schemas import TerminateResponse
from services.process_monitor import process_monitor, CRITICAL_SYSTEM_PROCESSES
from database.db import get_db

class ProcessControlService:
    def terminate_process(self, pid: int, force: bool = False) -> TerminateResponse:
        now = time.time()
        
        # Check if in Demo Mode
        if process_monitor.is_demo_mode():
            item = process_monitor.get_process_by_pid(pid)
            if not item:
                return TerminateResponse(
                    success=False, pid=pid, process_name="Unknown",
                    message=f"Process PID {pid} not found in Demo dataset.", recorded_at=now
                )
            
            if item.is_critical:
                return TerminateResponse(
                    success=False, pid=pid, process_name=item.name,
                    message=f"Termination blocked! '{item.name}' is a protected Windows core system process.", recorded_at=now
                )
            
            # Remove from demo cache
            with process_monitor._lock:
                if pid in process_monitor._processes_cache:
                    del process_monitor._processes_cache[pid]
                    # Adjust demo system overview CPU if crypto miner was killed
                    if item.name.lower() == "crypto_miner_sim.exe" and process_monitor._system_overview_cache:
                        process_monitor._system_overview_cache.cpu_percent = 63.4
                        process_monitor._system_overview_cache.system_health_score = 88
            
            self._log_activity("PROCESS_TERMINATED", f"Terminated process '{item.name}' (PID {pid}) in Demo Mode.", "SUCCESS")
            return TerminateResponse(
                success=True, pid=pid, process_name=item.name,
                message=f"Successfully terminated process '{item.name}' (PID {pid}). System resources updated.", recorded_at=now
            )

        # Real process termination
        try:
            proc = psutil.Process(pid)
            name = proc.name()

            if name.lower() in CRITICAL_SYSTEM_PROCESSES or pid in [0, 4]:
                return TerminateResponse(
                    success=False, pid=pid, process_name=name,
                    message=f"Action Blocked: '{name}' is a critical system process required by Windows.", recorded_at=now
                )

            if force:
                proc.kill()
            else:
                proc.terminate()

            # Log to activity history
            self._log_activity("PROCESS_TERMINATED", f"Terminated process '{name}' (PID {pid}).", "SUCCESS")
            
            # Rescan immediately
            process_monitor.trigger_rescan()

            return TerminateResponse(
                success=True, pid=pid, process_name=name,
                message=f"Successfully terminated process '{name}' (PID {pid}).", recorded_at=now
            )

        except psutil.NoSuchProcess:
            return TerminateResponse(
                success=False, pid=pid, process_name="Unknown",
                message=f"Process PID {pid} no longer exists.", recorded_at=now
            )
        except psutil.AccessDenied:
            return TerminateResponse(
                success=False, pid=pid, process_name=f"PID {pid}",
                message=f"Access Denied: Windows administrator permissions required to terminate PID {pid}.", recorded_at=now
            )
        except Exception as e:
            return TerminateResponse(
                success=False, pid=pid, process_name=f"PID {pid}",
                message=f"Failed to terminate process: {str(e)}", recorded_at=now
            )

    def _log_activity(self, action_type: str, description: str, status: str):
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO activity_log (timestamp, action_type, description, status)
                VALUES (?, ?, ?, ?)
            """, (time.time(), action_type, description, status))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Activity Log Error] {e}")

process_control_service = ProcessControlService()
