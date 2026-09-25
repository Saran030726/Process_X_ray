from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading
import time
from database.db import init_db
from api.routes import router
from services.process_monitor import process_monitor
from services.history_service import history_service
from config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Powered System Observability and Troubleshooting Application"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()
    print("=========================================")
    print(" Process X-Ray Backend Started ")
    print(" http://localhost:8000/api/system ")
    print("=========================================")
    
    # Start periodic history snapshot recorder thread
    def history_loop():
        while True:
            time.sleep(10)
            try:
                overview = process_monitor.get_system_overview()
                processes = process_monitor.get_all_processes()
                if overview and processes:
                    top_p = max(processes, key=lambda p: p.cpu_percent) if processes else None
                    history_service.record_snapshot(
                        cpu_percent=overview.cpu_percent,
                        memory_percent=overview.memory_percent,
                        total_procs=len(processes),
                        top_proc_name=top_p.name if top_p else "N/A",
                        top_proc_cpu=top_p.cpu_percent if top_p else 0.0
                    )
            except Exception as e:
                print(f"[History Loop Exception] {e}")

    threading.Thread(target=history_loop, daemon=True).start()

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
