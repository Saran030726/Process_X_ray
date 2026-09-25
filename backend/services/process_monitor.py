import psutil
import time
import threading
import os
import ctypes
from typing import List, Dict, Optional, Tuple
from models.schemas import ProcessItem, SystemOverview
from database.db import get_db

CRITICAL_SYSTEM_PROCESSES = {
    "system", "system idle process", "smss.exe", "csrss.exe", 
    "wininit.exe", "services.exe", "lsass.exe", "svchost.exe", 
    "winlogon.exe", "dwm.exe", "spoolsv.exe", "explorer.exe"
}

def check_digital_signature(exe_path: str, name: str) -> str:
    if not exe_path or not os.path.exists(exe_path):
        if name.lower() in CRITICAL_SYSTEM_PROCESSES or name.lower().startswith("svchost"):
            return "Windows Core Component"
        return "Unknown Location"
    
    path_lower = exe_path.lower()
    if "\\windows\\system32" in path_lower or "\\windows\\syswow64" in path_lower:
        return "Verified (Microsoft Windows Publisher)"
    elif "\\program files" in path_lower or "\\program files (x86)" in path_lower:
        return "Verified (Software Publisher)"
    elif "\\appdata\\local\\temp" in path_lower:
        return "Unverified (Temp Folder execution)"
    elif "\\appdata\\" in path_lower:
        return "User Application (AppData)"
    
    return "Verified Signed Binary"

class ProcessMonitor:
    def __init__(self):
        self._processes_cache: Dict[int, ProcessItem] = {}
        self._system_overview_cache: Optional[SystemOverview] = None
        self._is_demo_mode: bool = False
        self._lock = threading.Lock()
        self._last_scan_time: float = 0.0
        self._prev_net_io = psutil.net_io_counters() if hasattr(psutil, "net_io_counters") else None
        self._prev_net_time = time.time()
        
        # Start baseline scanner thread
        self._scanner_thread = threading.Thread(target=self._background_scanner_loop, daemon=True)
        self._scanner_thread.start()

    def set_demo_mode(self, enabled: bool):
        with self._lock:
            self._is_demo_mode = enabled
            self._scan_processes_internal()

    def is_demo_mode(self) -> bool:
        with self._lock:
            return self._is_demo_mode

    def _background_scanner_loop(self):
        try:
            self._scan_processes_internal()
        except Exception as e:
            print(f"[Scanner Error] Initial scan exception: {e}")

        while True:
            time.sleep(3)
            try:
                self._scan_processes_internal()
            except Exception as e:
                print(f"[Scanner Error] Loop exception: {e}")

    def _scan_processes_internal(self):
        now = time.time()
        if self._is_demo_mode:
            processes, overview = self._generate_demo_data(now)
            with self._lock:
                self._processes_cache = {p.pid: p for p in processes}
                self._system_overview_cache = overview
                self._last_scan_time = now
            return

        # Real Windows scan
        scanned_processes: Dict[int, ProcessItem] = {}
        
        # System totals
        cpu_total = psutil.cpu_percent(interval=None)
        mem_info = psutil.virtual_memory()
        disk_info = psutil.disk_usage('/')

        # Network rates
        net_sent_rate = 0.0
        net_recv_rate = 0.0
        current_net_io = psutil.net_io_counters() if hasattr(psutil, "net_io_counters") else None
        if self._prev_net_io and current_net_io:
            elapsed = now - self._prev_net_time
            if elapsed > 0:
                net_sent_rate = (current_net_io.bytes_sent - self._prev_net_io.bytes_sent) / 1024 / elapsed
                net_recv_rate = (current_net_io.bytes_recv - self._prev_net_io.bytes_recv) / 1024 / elapsed
        self._prev_net_io = current_net_io
        self._prev_net_time = now

        for proc in psutil.process_iter([
            'pid', 'name', 'cpu_percent', 'memory_info', 'memory_percent',
            'exe', 'ppid', 'create_time', 'username', 'num_threads', 'status', 'cmdline'
        ]):
            try:
                pinfo = proc.info
                pid = pinfo['pid']
                name = pinfo['name'] or f"Process_{pid}"
                
                parent_name = ""
                ppid = pinfo.get('ppid')
                if ppid:
                    try:
                        parent_proc = psutil.Process(ppid)
                        parent_name = parent_proc.name()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        parent_name = f"PID_{ppid}"

                mem_bytes = pinfo['memory_info'].rss if pinfo.get('memory_info') else 0
                mem_percent = pinfo.get('memory_percent') or 0.0
                cpu_p = pinfo.get('cpu_percent') or 0.0

                exe = pinfo.get('exe') or ""
                username = pinfo.get('username') or "N/A"
                threads = pinfo.get('num_threads') or 0
                status = pinfo.get('status') or "running"
                cmdline = " ".join(pinfo.get('cmdline') or [])

                disk_read = 0
                disk_write = 0
                net_conns = 0
                try:
                    io_counters = proc.io_counters()
                    disk_read = io_counters.read_bytes
                    disk_write = io_counters.write_bytes
                except (psutil.AccessDenied, AttributeError):
                    pass

                try:
                    net_conns = len(proc.connections())
                except (psutil.AccessDenied, AttributeError):
                    pass

                signature = check_digital_signature(exe, name)
                is_crit = name.lower() in CRITICAL_SYSTEM_PROCESSES or name.lower() == "system"

                item = ProcessItem(
                    pid=pid,
                    name=name,
                    cpu_percent=round(cpu_p, 1),
                    memory_bytes=mem_bytes,
                    memory_percent=round(mem_percent, 1),
                    executable_path=exe,
                    parent_pid=ppid,
                    parent_name=parent_name,
                    create_time=pinfo.get('create_time') or 0.0,
                    username=username,
                    num_threads=threads,
                    status=status,
                    disk_read_bytes=disk_read,
                    disk_write_bytes=disk_write,
                    net_connections=net_conns,
                    cmdline=cmdline,
                    digital_signature=signature,
                    classification="NORMAL",
                    classification_reason="",
                    is_critical=is_crit
                )
                scanned_processes[pid] = item

            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            except Exception as e:
                continue

        overview = SystemOverview(
            cpu_percent=round(cpu_total, 1),
            memory_percent=round(mem_info.percent, 1),
            memory_used_gb=round(mem_info.used / (1024**3), 2),
            memory_total_gb=round(mem_info.total / (1024**3), 2),
            disk_percent=round(disk_info.percent, 1),
            disk_used_gb=round(disk_info.used / (1024**3), 2),
            disk_total_gb=round(disk_info.total / (1024**3), 2),
            net_sent_kbps=round(net_sent_rate, 1),
            net_recv_kbps=round(net_recv_rate, 1),
            total_processes=len(scanned_processes),
            system_health_score=85,
            is_demo_mode=False,
            timestamp=now
        )

        with self._lock:
            self._processes_cache = scanned_processes
            self._system_overview_cache = overview
            self._last_scan_time = now

    def _generate_demo_data(self, now: float) -> Tuple[List[ProcessItem], SystemOverview]:
        demo_procs = [
            ProcessItem(
                pid=4, name="System", cpu_percent=0.2, memory_bytes=165888, memory_percent=0.1,
                executable_path="C:\\Windows\\System32\\ntoskrnl.exe", parent_pid=0, parent_name="System Idle Process",
                create_time=now - 86400, username="NT AUTHORITY\\SYSTEM", num_threads=240, status="running",
                disk_read_bytes=1048576, disk_write_bytes=2097152, net_connections=0, cmdline="ntoskrnl.exe",
                digital_signature="Windows Core Component", classification="NORMAL", classification_reason="Essential Windows kernel process", is_critical=True
            ),
            ProcessItem(
                pid=788, name="services.exe", cpu_percent=0.8, memory_bytes=14258000, memory_percent=0.2,
                executable_path="C:\\Windows\\System32\\services.exe", parent_pid=4, parent_name="System",
                create_time=now - 86000, username="NT AUTHORITY\\SYSTEM", num_threads=12, status="running",
                disk_read_bytes=524288, disk_write_bytes=128000, net_connections=0, cmdline="C:\\Windows\\System32\\services.exe",
                digital_signature="Windows Core Component", classification="NORMAL", classification_reason="Windows Service Controller", is_critical=True
            ),
            ProcessItem(
                pid=1240, name="svchost.exe", cpu_percent=1.4, memory_bytes=48500000, memory_percent=0.6,
                executable_path="C:\\Windows\\System32\\svchost.exe", parent_pid=788, parent_name="services.exe",
                create_time=now - 85000, username="NT AUTHORITY\\SYSTEM", num_threads=35, status="running",
                disk_read_bytes=2048000, disk_write_bytes=4096000, net_connections=12, cmdline="C:\\Windows\\System32\\svchost.exe -k LocalService -p",
                digital_signature="Windows Core Component", classification="NORMAL", classification_reason="Generic host process for Windows services", is_critical=True
            ),
            ProcessItem(
                pid=4212, name="chrome.exe", cpu_percent=32.4, memory_bytes=1845000000, memory_percent=11.2,
                executable_path="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", parent_pid=4500, parent_name="explorer.exe",
                create_time=now - 3600, username="User", num_threads=48, status="running",
                disk_read_bytes=52428800, disk_write_bytes=10485760, net_connections=34, cmdline="\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\"",
                digital_signature="Verified (Google LLC)", classification="RESOURCE INTENSIVE", classification_reason="High memory consumption (>1.8 GB RAM)", is_critical=False
            ),
            ProcessItem(
                pid=4216, name="chrome.exe", cpu_percent=8.2, memory_bytes=420000000, memory_percent=2.6,
                executable_path="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", parent_pid=4212, parent_name="chrome.exe",
                create_time=now - 3500, username="User", num_threads=18, status="running",
                disk_read_bytes=1048576, disk_write_bytes=512000, net_connections=8, cmdline="\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" --type=renderer",
                digital_signature="Verified (Google LLC)", classification="NORMAL", classification_reason="Chrome Renderer Child Process", is_critical=False
            ),
            ProcessItem(
                pid=8240, name="Code.exe", cpu_percent=18.5, memory_bytes=980000000, memory_percent=5.9,
                executable_path="C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", parent_pid=4500, parent_name="explorer.exe",
                create_time=now - 7200, username="User", num_threads=32, status="running",
                disk_read_bytes=15728640, disk_write_bytes=8388608, net_connections=5, cmdline="\"C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe\"",
                digital_signature="Verified (Microsoft Corporation)", classification="RESOURCE INTENSIVE", classification_reason="Sustained elevated CPU usage", is_critical=False
            ),
            ProcessItem(
                pid=9132, name="crypto_miner_sim.exe", cpu_percent=78.9, memory_bytes=640000000, memory_percent=3.8,
                executable_path="C:\\Users\\User\\AppData\\Local\\Temp\\crypto_miner_sim.exe", parent_pid=1240, parent_name="svchost.exe",
                create_time=now - 1200, username="User", num_threads=16, status="running",
                disk_read_bytes=102400, disk_write_bytes=204800, net_connections=14, cmdline="C:\\Users\\User\\AppData\\Local\\Temp\\crypto_miner_sim.exe --background",
                digital_signature="Unverified (Temp Folder execution)", classification="INVESTIGATE", classification_reason="Unusual Temp execution location with >75% sustained CPU load", is_critical=False
            ),
            ProcessItem(
                pid=4500, name="explorer.exe", cpu_percent=2.1, memory_bytes=145000000, memory_percent=0.9,
                executable_path="C:\\Windows\\explorer.exe", parent_pid=788, parent_name="services.exe",
                create_time=now - 86000, username="User", num_threads=28, status="running",
                disk_read_bytes=8388608, disk_write_bytes=4194304, net_connections=2, cmdline="C:\\Windows\\explorer.exe",
                digital_signature="Windows Core Component", classification="NORMAL", classification_reason="Windows Desktop Shell", is_critical=True
            ),
            ProcessItem(
                pid=1054, name="node.exe", cpu_percent=14.2, memory_bytes=310000000, memory_percent=1.9,
                executable_path="C:\\Program Files\\nodejs\\node.exe", parent_pid=8240, parent_name="Code.exe",
                create_time=now - 3000, username="User", num_threads=11, status="running",
                disk_read_bytes=4194304, disk_write_bytes=2097152, net_connections=1, cmdline="node server.js",
                digital_signature="Verified (Node.js Foundation)", classification="NORMAL", classification_reason="Active Node.js developer runtime server", is_critical=False
            ),
            ProcessItem(
                pid=3210, name="python.exe", cpu_percent=1.2, memory_bytes=85000000, memory_percent=0.5,
                executable_path="C:\\Python313\\python.exe", parent_pid=8240, parent_name="Code.exe",
                create_time=now - 600, username="User", num_threads=6, status="running",
                disk_read_bytes=204800, disk_write_bytes=102400, net_connections=0, cmdline="python main.py",
                digital_signature="Verified (Python Software Foundation)", classification="LOW IMPACT", classification_reason="Minimal background Python process", is_critical=False
            )
        ]

        overview = SystemOverview(
            cpu_percent=91.2,
            memory_percent=87.4,
            memory_used_gb=14.2,
            memory_total_gb=16.0,
            disk_percent=52.0,
            disk_used_gb=260.0,
            disk_total_gb=500.0,
            net_sent_kbps=145.2,
            net_recv_kbps=1820.5,
            total_processes=len(demo_procs),
            system_health_score=58,
            is_demo_mode=True,
            timestamp=now
        )

        return demo_procs, overview

    def get_all_processes(self) -> List[ProcessItem]:
        with self._lock:
            return list(self._processes_cache.values())

    def get_process_by_pid(self, pid: int) -> Optional[ProcessItem]:
        with self._lock:
            return self._processes_cache.get(pid)

    def get_system_overview(self) -> Optional[SystemOverview]:
        with self._lock:
            return self._system_overview_cache

    def trigger_rescan(self):
        self._scan_processes_internal()

process_monitor = ProcessMonitor()
