import sqlite3
import os
import time

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "process_xray.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Process history snapshots table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS process_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL,
        cpu_percent REAL,
        memory_percent REAL,
        total_processes INTEGER,
        top_process_name TEXT,
        top_process_cpu REAL
    )
    """)

    # Detailed process metric snapshots for baseline tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS process_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL,
        pid INTEGER,
        name TEXT,
        cpu_percent REAL,
        memory_bytes INTEGER,
        classification TEXT
    )
    """)

    # Alerts and notifications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        timestamp REAL,
        type TEXT,
        severity TEXT,
        title TEXT,
        message TEXT,
        pid INTEGER,
        process_name TEXT
    )
    """)

    # Activity center log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL,
        action_type TEXT,
        description TEXT,
        status TEXT
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
