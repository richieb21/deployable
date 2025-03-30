from typing import List
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Deployment Readiness Analyzer"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://localhost:3000"]
    
    # API Keys
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

def setup_logging():
    """Configure logging for the application"""
    import logging
    
    logging_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    
    logging.basicConfig(
        level=logging_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    ) 