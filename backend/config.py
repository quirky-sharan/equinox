from pydantic_settings import BaseSettings
from pathlib import Path

# Resolve .env relative to this file's directory (backend/)
_env_path = Path(__file__).resolve().parent / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./meowmeow.db"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ML_SERVICE_URL: str = "http://localhost:8001"
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = str(_env_path)

settings = Settings()

