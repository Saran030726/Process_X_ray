import httpx
from typing import Dict, Any
from models.schemas import ProcessItem, AIExplanationResponse
from config import settings

KNOWN_PROCESS_DATABASE = {
    "chrome.exe": {
        "what_is_it": "Google Chrome web browser application.",
        "what_is_it_doing": "Rendering web pages, running JavaScript applications, and managing browser extensions.",
        "why_is_it_running": "Launched by the user to browse the web or running in the background for browser notifications.",
        "default_rec": "May be closed if not needed",
        "rec_reason": "Closing Chrome will free up significant RAM, but save your open tabs first."
    },
    "msedge.exe": {
        "what_is_it": "Microsoft Edge web browser.",
        "what_is_it_doing": "Loading web pages, managing browser tabs, and syncing web user preferences.",
        "why_is_it_running": "Opened by the user or started automatically by Windows for web tasks.",
        "default_rec": "May be closed if not needed",
        "rec_reason": "Closing Edge will free up system memory."
    },
    "code.exe": {
        "what_is_it": "Visual Studio Code code editor.",
        "what_is_it_doing": "Running development environment, indexing source files, and executing editor extensions.",
        "why_is_it_running": "Opened by the user for writing or debugging software code.",
        "default_rec": "May be closed if not needed",
        "rec_reason": "Save your workspace files before closing VS Code."
    },
    "node.exe": {
        "what_is_it": "Node.js JavaScript runtime engine.",
        "what_is_it_doing": "Executing backend JavaScript code, development build tools, or web application servers.",
        "why_is_it_running": "Spawned by a developer tool (like VS Code or web dev tools) to host active projects.",
        "default_rec": "May be closed if not needed",
        "rec_reason": "Ensure you stop active local development server before terminating."
    },
    "python.exe": {
        "what_is_it": "Python programming language interpreter.",
        "what_is_it_doing": "Running Python scripts, background data processing, or backend API services.",
        "why_is_it_running": "Started by a user script or an application built with Python.",
        "default_rec": "May be closed if not needed",
        "rec_reason": "Verify which Python script is running before terminating."
    },
    "svchost.exe": {
        "what_is_it": "Windows Host Process for Service DLLs.",
        "what_is_it_doing": "Houses multiple system background services (networking, audio, Windows updates, security).",
        "why_is_it_running": "Essential Windows background process managed by services.exe.",
        "default_rec": "Do not terminate",
        "rec_reason": "Terminating svchost.exe may cause Windows instability, loss of network, or system crash."
    },
    "explorer.exe": {
        "what_is_it": "Windows Explorer Desktop Shell.",
        "what_is_it_doing": "Renders your desktop wallpaper, taskbar, Start Menu, and file folder windows.",
        "why_is_it_running": "Core user interface component of the Windows Operating System.",
        "default_rec": "Usually leave running",
        "rec_reason": "Terminating explorer.exe will make your desktop and taskbar disappear temporarily (can be restarted)."
    },
    "csrss.exe": {
        "what_is_it": "Client Server Runtime Subsystem.",
        "what_is_it_doing": "Manages Windows console windows, process creation, and thread shutdown operations.",
        "why_is_it_running": "Critical core Windows subsystem required for Windows operation.",
        "default_rec": "Do not terminate",
        "rec_reason": "Terminating csrss.exe will trigger a Blue Screen of Death (BSOD) immediately."
    },
    "services.exe": {
        "what_is_it": "Windows Service Control Manager.",
        "what_is_it_doing": "Starts, stops, and manages background system services on your computer.",
        "why_is_it_running": "Critical system service manager spawned by Windows kernel at startup.",
        "default_rec": "Do not terminate",
        "rec_reason": "System critical process. Cannot be terminated."
    },
    "lsass.exe": {
        "what_is_it": "Local Security Authority Subsystem Service.",
        "what_is_it_doing": "Enforces security policies, authenticates user logins, and generates security access tokens.",
        "why_is_it_running": "Core Windows security component.",
        "default_rec": "Do not terminate",
        "rec_reason": "Terminating lsass.exe will force Windows to reboot immediately for security."
    },
    "crypto_miner_sim.exe": {
        "what_is_it": "Simulated High-CPU Application (Demo Process).",
        "what_is_it_doing": "Executing intensive math calculations continuously in the background.",
        "why_is_it_running": "Loaded as part of Process X-Ray Demo Mode to demonstrate anomaly detection.",
        "default_rec": "May be closed if not needed",
        "rec_reason": "Safe to close in Demo Mode to observe system CPU dropping from 91% down to ~63%."
    }
}

class AIService:
    async def explain_process(self, item: ProcessItem) -> AIExplanationResponse:
        """
        Attempts external AI explanation if AI_API_KEY configured; fallback to structured local engine.
        """
        if settings.AI_API_KEY:
            try:
                ai_result = await self._query_ai_api(item)
                if ai_result:
                    return ai_result
            except Exception as e:
                print(f"[AI Service] API query failed, falling back to local engine: {e}")

        return self._fallback_local_explanation(item)

    async def _query_ai_api(self, item: ProcessItem) -> AIExplanationResponse:
        # Example Gemini / REST prompt call if API key provided
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.AI_API_KEY}"
        
        prompt = f"""
You are an expert system engineer for the Process X-Ray system monitoring tool.
Analyze this Windows process and return a JSON explanation:
Process Name: {item.name}
PID: {item.pid}
CPU Percent: {item.cpu_percent}%
Memory Usage: {round(item.memory_bytes/(1024*1024),1)} MB ({item.memory_percent}%)
Path: {item.executable_path}
Parent: {item.parent_name} (PID {item.parent_pid})
Classification: {item.classification} ({item.classification_reason})
Digital Signature: {item.digital_signature}

Respond strictly in valid JSON with fields:
- what_is_it: string
- what_is_it_doing: string
- why_is_it_running: string
- observed_facts: list of strings
- likely_interpretation: list of strings
- resource_impact_assessment: string
- should_i_close_it_recommendation: string (Must be one of: "Usually leave running", "May be closed if not needed", "Investigate first", "Do not terminate")
- recommendation_reason: string
"""
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                data = resp.json()
                text = data['candidates'][0]['content']['parts'][0]['text']
                # Clean code blocks if present
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                import json
                parsed = json.loads(text)
                return AIExplanationResponse(
                    pid=item.pid,
                    process_name=item.name,
                    what_is_it=parsed.get('what_is_it', ''),
                    what_is_it_doing=parsed.get('what_is_it_doing', ''),
                    why_is_it_running=parsed.get('why_is_it_running', ''),
                    observed_facts=parsed.get('observed_facts', []),
                    likely_interpretation=parsed.get('likely_interpretation', []),
                    resource_impact_assessment=parsed.get('resource_impact_assessment', ''),
                    should_i_close_it_recommendation=parsed.get('should_i_close_it_recommendation', 'Investigate first'),
                    recommendation_reason=parsed.get('recommendation_reason', ''),
                    is_ai_generated=True
                )
        return None

    def _fallback_local_explanation(self, item: ProcessItem) -> AIExplanationResponse:
        name_lower = item.name.lower()
        kb = KNOWN_PROCESS_DATABASE.get(name_lower, {})

        what_is_it = kb.get("what_is_it") or f"Windows application executable ({item.name})."
        what_is_it_doing = kb.get("what_is_it_doing") or f"Executing code tasks under user account '{item.username}' with {item.num_threads} thread(s)."
        
        parent_info = f"parent '{item.parent_name}' (PID {item.parent_pid})" if item.parent_pid else "the Windows System Init launcher"
        why_is_it_running = kb.get("why_is_it_running") or f"Spawned by {parent_info}."

        mem_mb = round(item.memory_bytes / (1024 * 1024), 1)
        observed = [
            f"Process name is '{item.name}' with PID {item.pid}.",
            f"Currently utilizing {item.cpu_percent}% CPU and {mem_mb} MB RAM ({item.memory_percent}% system memory).",
            f"Executable path: {item.executable_path or 'Unavailable / System Restricted'}.",
            f"Digital Signature status: {item.digital_signature}."
        ]

        interpretation = [
            f"Resource classification engine categorized this as {item.classification}.",
            f"Reasoning: {item.classification_reason or 'Operating within expected limits.'}"
        ]

        if item.cpu_percent > 30.0:
            resource_impact = f"High CPU consumption ({item.cpu_percent}%). This process is actively computing intensive tasks."
        elif item.memory_bytes > 1024 * 1024 * 1024:
            resource_impact = f"High Memory consumption ({mem_mb} MB). It is reserving a significant portion of system RAM."
        else:
            resource_impact = f"Normal resource usage ({item.cpu_percent}% CPU, {mem_mb} MB RAM). Minimal impact on overall PC speed."

        rec = kb.get("default_rec")
        rec_reason = kb.get("rec_reason")

        if not rec:
            if item.is_critical:
                rec = "Do not terminate"
                rec_reason = "This is a critical Windows system component necessary for OS stability."
            elif item.classification == "INVESTIGATE":
                rec = "Investigate first"
                rec_reason = "Unusual location or high CPU activity detected. Verify whether you recognized starting this program."
            elif item.classification == "RESOURCE INTENSIVE":
                rec = "May be closed if not needed"
                rec_reason = "Closing this process will immediately free up hardware CPU/RAM resources."
            else:
                rec = "Usually leave running"
                rec_reason = "Process is operating normally without causing system bottleneck."

        return AIExplanationResponse(
            pid=item.pid,
            process_name=item.name,
            what_is_it=what_is_it,
            what_is_it_doing=what_is_it_doing,
            why_is_it_running=why_is_it_running,
            observed_facts=observed,
            likely_interpretation=interpretation,
            resource_impact_assessment=resource_impact,
            should_i_close_it_recommendation=rec,
            recommendation_reason=rec_reason,
            is_ai_generated=False
        )

ai_service = AIService()
