from typing import List, Dict, Optional, Any
from enum import Enum
from pydantic import BaseModel, HttpUrl, Field


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class RecommendationCategory(str, Enum):
    SECURITY = "SECURITY"
    PERFORMANCE = "PERFORMANCE"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    RELIABILITY = "RELIABILITY"
    COMPLIANCE = "COMPLIANCE"
    COST = "COST"

class TechStack(BaseModel):
    frontend: List[str] = Field(default_factory=list, description="Frontend technologies")
    backend: List[str] = Field(default_factory=list, description="Backend technologies")
    infra: List[str] = Field(default_factory=list, description="Project Infrastructure")

class Recommendation(BaseModel):
    title: str
    description: str
    file_path: str
    severity: Severity
    category: RecommendationCategory
    action_items: List[str]

class Insights(BaseModel):
    recommendations: List[Recommendation] = Field(default_factory=list, description="Recommendations")


class AnalysisRequest(BaseModel):
    repo_url: HttpUrl = Field(..., description="GitHub repository URL to analyze")
    # target_platforms: Optional[List[str]] = Field(
    #     default=None, description="Specific deployment platforms to target"
    # )
    # preferences: Optional[Dict[str, Any]] = Field(
    #     default=None, description="User preferences for deployment"
    # )


class AnalysisResponse(BaseModel):
    repository: str
    recommendations: List[Recommendation]
    # summary: str
    # detected_technologies: Dict[str, List[str]]
    analysis_timestamp: str 