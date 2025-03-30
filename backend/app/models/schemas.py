from typing import List, Dict, Optional, Any
from enum import Enum
from pydantic import BaseModel, HttpUrl, Field


class RecommendationSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class RecommendationCategory(str, Enum):
    SECURITY = "security"
    PERFORMANCE = "performance"
    INFRASTRUCTURE = "infrastructure"
    RELIABILITY = "reliability"
    COMPLIANCE = "compliance"
    COST = "COST"

class Recommendation(BaseModel):
    title: str
    description: str
    severity: RecommendationSeverity
    category: RecommendationCategory
    action_items: List[str]
    code_snippets: Optional[Dict[str, str]] = None
    references: Optional[List[str]] = None


class AnalysisRequest(BaseModel):
    repo_url: HttpUrl = Field(..., description="GitHub repository URL to analyze")
    target_platforms: Optional[List[str]] = Field(
        default=None, description="Specific deployment platforms to target"
    )
    preferences: Optional[Dict[str, Any]] = Field(
        default=None, description="User preferences for deployment"
    )


class AnalysisResponse(BaseModel):
    repository: str
    recommendations: List[Recommendation]
    summary: str
    detected_technologies: Dict[str, List[str]]
    analysis_timestamp: str 