from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Deployment Readiness Analyzer",
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

# app.include_router(analysis.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to Deployable"}

@app.get("/health")
async def health_check():
    return {"status": "All systems functional at Deployable!"} 