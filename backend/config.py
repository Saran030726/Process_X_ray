import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "Process X-Ray"
    VERSION: str = "1.0.0"
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash") # or groq/openai
    REFRESH_INTERVAL_SECONDS: int = 3
    DEMO_MODE_DEFAULT: bool = False

settings = Settings()
