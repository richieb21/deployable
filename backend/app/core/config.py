from typing import List
import os
from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "deployable"
    ENV: str = os.environ.get("ENV", "development")

    FRONTEND_PROD_URL: str = os.environ.get("FRONTEND_PROD_URL", "")

    # CORS settings
    CORS_ORIGINS: List[str] = []

    # API Keys
    GITHUB_TOKEN: str = os.environ.get("GITHUB_TOKEN", "")
    GITHUB_PAT: str = os.environ.get("GITHUB_PAT", "")
    GITHUB_PERSONAL_ACCESS_TOKEN: str = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    CLAUDE_API_KEY: str = os.environ.get("CLAUDE_API_KEY", "")
    OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")

    # Rate limiting
    ANALYSIS_RATE_LIMIT: str = os.environ.get("ANALYSIS_RATE_LIMIT", "60/minute;2500/hour")
    KEY_FILES_RATE_LIMIT: str = os.environ.get("KEY_FILES_RATE_LIMIT", "60/minute;2500/hour")

    # Redis config
    USE_REDIS: bool = os.environ.get("USE_REDIS", "false").lower() == "true"
    REDIS_HOST: str = os.environ.get("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.environ.get("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.environ.get("REDIS_PASSWORD", "")
    REDIS_DB: str = os.environ.get("REDIS_DB", "0")

    @model_validator(mode="after")
    def validate_settings(self):
        if self.ENV == "development":
            self.CORS_ORIGINS = ["http://localhost:8000", "http://127.0.0.1:3000"]
        else:
            if self.FRONTEND_PROD_URL:
                self.CORS_ORIGINS = [self.FRONTEND_PROD_URL]
            else:
                raise ValueError(
                    f"Frontend Prod URL not set"
                )
        
        if self.ENV != "development":
            missing_keys = []

            if not self.GITHUB_PAT:
                missing_keys.append("GITHUB_PAT")
            if not self.OPENROUTER_API_KEY:
                missing_keys.append("OPENROUTER_API_KEY")

            if missing_keys:
                raise ValueError(
                    f"Missing critical environment variabels: {missing_keys}"
                )

        return self
    

    
    


settings = Settings()


def setup_logging():
    """Configure logging for the application"""
    import logging

    logging_level = (
        logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    )

    logging.basicConfig(
        level=logging_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
