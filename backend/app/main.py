from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import analysis, github, streaming, twitterbot, twitter_test
from app.core.logging_config import setup_logging

import warnings

setup_logging("INFO")

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
    allow_headers=["*"]
)

warnings.filterwarnings(
    "ignore",
    message="urllib3 .* only supports OpenSSL .*",
    category=UserWarning
)

app.include_router(analysis.router)
app.include_router(github.router)
app.include_router(streaming.router)
app.include_router(twitterbot.router)
app.include_router(twitter_test.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Deployable"}

@app.get("/health")
async def health_check():
    return {"status": "All systems functional at Deployable!"} 