from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models.schemas import (
    SystemOverview, ProcessItem, ProcessDetail, AIExplanationResponse,
    DiagnosticReport, HealthScoreBreakdown, TerminateRequest, TerminateResponse,
    HistoryPoint, AlertItem, DemoModeToggle
)
from services.process_monitor import process_monitor
from services.analyzer import process_analyzer
from services.system_health import system_health_service
from services.ai_service import ai_service
from services.process_control import process_control_service
from services.history_service import history_service

router = APIRouter()

@router.get("/system", response_model=SystemOverview)
def get_system():
    overview = process_monitor.get_system_overview()
    processes = process_monitor.get_all_processes()
    anomalies = process_analyzer.detect_anomalies(processes)

    if not overview:
        raise HTTPException(status_code=503, detail="System metrics scanner still initializing...")

    # Enrich classifications
    for p in processes:
        cat, reason = process_analyzer.classify_process(p)
        p.classification = cat
        p.classification_reason = reason

    health_score, _ = system_health_service.calculate_health_score(overview, processes, len(anomalies))
    overview.system_health_score = health_score
    overview.is_demo_mode = process_monitor.is_demo_mode()
    return overview

@router.get("/processes", response_model=List[ProcessItem])
def get_processes(
    search: Optional[str] = Query(None, description="Search term for process name or PID"),
    sort_by: str = Query("cpu", description="Field to sort by: cpu, ram, pid, name"),
    status_filter: Optional[str] = Query(None, description="Filter by status: running, sleeping, etc."),
    classification_filter: Optional[str] = Query(None, description="Filter by classification category")
):
    processes = process_monitor.get_all_processes()
    
    # Classify each process
    for p in processes:
        cat, reason = process_analyzer.classify_process(p)
        p.classification = cat
        p.classification_reason = reason

    # Filter search
    if search:
        s_lower = search.lower()
        processes = [
            p for p in processes 
            if s_lower in p.name.lower() or s_lower in str(p.pid) or s_lower in p.executable_path.lower()
        ]

    # Filter classification
    if classification_filter and classification_filter != "ALL":
        processes = [p for p in processes if p.classification == classification_filter]

    # Filter status
    if status_filter and status_filter != "ALL":
        processes = [p for p in processes if p.status.lower() == status_filter.lower()]

    # Sorting
    if sort_by == "cpu":
        processes.sort(key=lambda p: p.cpu_percent, reverse=True)
    elif sort_by == "ram":
        processes.sort(key=lambda p: p.memory_bytes, reverse=True)
    elif sort_by == "name":
        processes.sort(key=lambda p: p.name.lower())
    elif sort_by == "pid":
        processes.sort(key=lambda p: p.pid)

    return processes

@router.get("/processes/{pid}", response_model=ProcessDetail)
def get_process_detail(pid: int):
    item = process_monitor.get_process_by_pid(pid)
    if not item:
        raise HTTPException(status_code=404, detail=f"Process PID {pid} not found.")

    cat, reason = process_analyzer.classify_process(item)
    item.classification = cat
    item.classification_reason = reason

    all_procs = process_monitor.get_all_processes()
    children = [p for p in all_procs if p.parent_pid == pid]
    child_pids = [c.pid for c in children]
    child_names = [c.name for c in children]

    # Check anomalies for this specific process
    anomalies = process_analyzer.detect_anomalies([item])
    is_anom = len(anomalies) > 0
    anom_reason = anomalies[0]['reason'] if is_anom else ""

    return ProcessDetail(
        **item.model_dump(),
        children_pids=child_pids,
        children_names=child_names,
        baseline_cpu_avg=12.5,
        baseline_mem_avg=round(item.memory_bytes * 0.9 / (1024*1024), 1),
        is_anomaly=is_anom,
        anomaly_reason=anom_reason
    )

@router.get("/processes/{pid}/children", response_model=List[ProcessItem])
def get_process_children(pid: int):
    all_procs = process_monitor.get_all_processes()
    children = [p for p in all_procs if p.parent_pid == pid]
    for c in children:
        cat, reason = process_analyzer.classify_process(c)
        c.classification = cat
        c.classification_reason = reason
    return children

@router.get("/tree")
def get_process_tree():
    """
    Returns full process hierarchy formatted as nodes and edges for React Flow.
    """
    processes = process_monitor.get_all_processes()
    for p in processes:
        cat, reason = process_analyzer.classify_process(p)
        p.classification = cat
        p.classification_reason = reason

    nodes = []
    edges = []
    proc_map = {p.pid: p for p in processes}

    # Group by parent to layout nicely
    parent_map = {}
    for p in processes:
        ppid = p.parent_pid or 0
        if ppid not in parent_map:
            parent_map[ppid] = []
        parent_map[ppid].append(p)

    for p in processes:
        nodes.append({
            "id": str(p.pid),
            "type": "processNode",
            "data": {
                "pid": p.pid,
                "name": p.name,
                "cpu_percent": p.cpu_percent,
                "memory_bytes": p.memory_bytes,
                "memory_percent": p.memory_percent,
                "classification": p.classification,
                "parent_name": p.parent_name,
                "is_critical": p.is_critical
            }
        })

        if p.parent_pid and p.parent_pid in proc_map:
            edges.append({
                "id": f"e-{p.parent_pid}-{p.pid}",
                "source": str(p.parent_pid),
                "target": str(p.pid),
                "animated": p.cpu_percent > 20.0
            })

    return {"nodes": nodes, "edges": edges, "total": len(nodes)}

@router.post("/processes/{pid}/explain", response_model=AIExplanationResponse)
async def explain_process(pid: int):
    item = process_monitor.get_process_by_pid(pid)
    if not item:
        raise HTTPException(status_code=404, detail=f"Process PID {pid} not found.")

    cat, reason = process_analyzer.classify_process(item)
    item.classification = cat
    item.classification_reason = reason

    explanation = await ai_service.explain_process(item)
    return explanation

@router.post("/processes/{pid}/terminate", response_model=TerminateResponse)
def terminate_process(pid: int, req: TerminateRequest = TerminateRequest()):
    return process_control_service.terminate_process(pid, force=req.force)

@router.post("/diagnose-slow", response_model=DiagnosticReport)
def diagnose_slow_pc():
    overview = process_monitor.get_system_overview()
    processes = process_monitor.get_all_processes()
    anomalies = process_analyzer.detect_anomalies(processes)

    for p in processes:
        cat, reason = process_analyzer.classify_process(p)
        p.classification = cat
        p.classification_reason = reason

    health_score, _ = system_health_service.calculate_health_score(overview, processes, len(anomalies))
    return system_health_service.generate_slow_pc_report(overview, processes, health_score)

@router.get("/health", response_model=HealthScoreBreakdown)
def get_health_breakdown():
    overview = process_monitor.get_system_overview()
    processes = process_monitor.get_all_processes()
    anomalies = process_analyzer.detect_anomalies(processes)

    for p in processes:
        cat, reason = process_analyzer.classify_process(p)
        p.classification = cat
        p.classification_reason = reason

    _, breakdown = system_health_service.calculate_health_score(overview, processes, len(anomalies))
    return breakdown

@router.get("/history", response_model=List[HistoryPoint])
def get_history(limit: int = 30):
    return history_service.get_history_points(limit=limit)

@router.get("/alerts", response_model=List[AlertItem])
def get_alerts(limit: int = 20):
    return history_service.get_alerts(limit=limit)

@router.post("/scan")
def trigger_scan():
    process_monitor.trigger_rescan()
    return {"message": "Process scan completed successfully."}

@router.post("/demo-mode")
def set_demo_mode(body: DemoModeToggle):
    process_monitor.set_demo_mode(body.enabled)
    return {
        "message": f"Demo Mode {'enabled' if body.enabled else 'disabled'}.",
        "is_demo_mode": process_monitor.is_demo_mode()
    }
