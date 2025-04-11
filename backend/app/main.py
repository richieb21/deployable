import os
import logging
import redis.asyncio as redis_async
from contextlib import asynccontextmanager
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
from app.background_manager import BackgroundManager
from app.core.dependencies import redis_async_pool
from app.services.stats_service import StatService
from app.background_tasks import poll_stats_and_publish
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

import warnings

setup_logging("INFO")
logger = logging.getLogger(__name__)

background_manager = BackgroundManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup...")

    redis_client_for_task = None
    if redis_async_pool:
        try:
            redis_client_for_task = redis_async.Redis(connection_pool=redis_async_pool)
            await redis_client_for_task.ping()

            background_manager.add_resource(redis_client_for_task)
            stat_service_for_task = StatService(redis_client=redis_client_for_task)

            background_manager.add_task(poll_stats_and_publish(stat_service=stat_service_for_task))
        except Exception as e:
            logger.error(f"Failed to initialize Redis or add background task")
            if redis_client_for_task and hasattr(redis_client_for_task, 'close'):
                 try:
                      await redis_client_for_task.close()
                 except Exception: pass
    else:
        logger.info("Async redis pool unavailable, background stats task will not start")

    yield

    logger.info("Application shutdown initiated...")
    await background_manager.shutdown()
    logger.info("Background manager shutdown complete.")

app = FastAPI(
    title="deployable API",
    lifespan=lifespan,
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

load_dotenv()

TWITTER_ENABLED = os.getenv("TWITTER_ENABLED", "false").lower() == "true"

app.include_router(analysis.router)
app.include_router(github.router)
app.include_router(streaming.router)

if TWITTER_ENABLED:
    app.include_router(twitterbot.router)
    app.include_router(twitter_test.router)
    # Only initialize Twitter stream when feature flag is enabled
    twitterbot.init_twitter()

app.include_router(stats.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Deployable"}


@app.get("/health")
async def health_check():
    return {"status": "All systems functional at Deployable!"}
