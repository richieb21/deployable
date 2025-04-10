from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import (
    analysis,
    github,
    streaming,
    twitterbot,
    twitter_test,
    stats,
)
from app.core.logging_config import setup_logging
from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

import warnings

setup_logging("INFO")
load_dotenv()

app = FastAPI(
    title="deployable API",
    description="API for analyzing GitHub repositories for deployment readiness",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

warnings.filterwarnings(
    "ignore", message="urllib3 .* only supports OpenSSL .*", category=UserWarning
)

app.include_router(analysis.router)
app.include_router(github.router)
app.include_router(streaming.router)
app.include_router(twitterbot.router)
app.include_router(twitter_test.router)
app.include_router(stats.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Deployable"}


@app.get("/health")
async def health_check():
    return {"status": "All systems functional at Deployable!"}
