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


class AnalysisEventType(str, Enum):
    PROGRESS = "PROGRESS"
    RECOMMENDATION = "RECOMMENDATION"
    COMPLETE = "COMPLETE"
    HEARTBEAT = "HEARTBEAT"


class TechStack(BaseModel):
    frontend: List[str] = Field(
        default_factory=list, description="Frontend technologies"
    )
    backend: List[str] = Field(default_factory=list, description="Backend technologies")
    infra: List[str] = Field(default_factory=list, description="Project Infrastructure")


class KeyFiles(BaseModel):
    frontend: List[str] = Field(
        default_factory=list, description="Frontend configuration and source files"
    )
    backend: List[str] = Field(
        default_factory=list, description="Backend configuration and source files"
    )
    infra: List[str] = Field(
        default_factory=list, description="Infrastructure and deployment files"
    )


class Recommendation(BaseModel):
    title: str
    description: str
    file_path: str
    severity: Severity
    category: RecommendationCategory
    action_items: List[str]


"""Streaming Specific Types"""


class AnalysisProgressEvent(BaseModel):
    type: AnalysisEventType = AnalysisEventType.PROGRESS
    chunk_index: int
    files: List[str]
    recommendations_count: int

class AnalysisRecommendationEvent(BaseModel):
    type: AnalysisEventType = AnalysisEventType.RECOMMENDATION
    recommendation: Recommendation
    

class AnalysisCompleteEvent(BaseModel):
    type: AnalysisEventType = AnalysisEventType.COMPLETE
    recommendations: List[Recommendation]
    analysis_timestamp: str


class AnalysisHeartbeatEvent(BaseModel):
    type: AnalysisEventType = AnalysisEventType.HEARTBEAT


class AnalysisRequest(BaseModel):
    repo_url: HttpUrl = Field(..., description="GitHub repository URL to analyze")
    important_files: KeyFiles = Field(
        default_factory=KeyFiles, description="Key Files for Analysis"
    )
    is_reprompt: Optional[bool] = False
    analysis_id: Optional[str] = (
        None  # if not provided, we will not stream events, backwords compatible
    )


class AnalysisResponse(BaseModel):
    repository: str
    recommendations: List[Recommendation]
    # summary: str
    # detected_technologies: Dict[str, List[str]]
    analysis_timestamp: str


class IdentifyKeyFilesRequest(BaseModel):
    repo_url: str
    is_reprompt: Optional[bool] = False


class IdentifyKeyFilesResponse(BaseModel):
    all_files: List[str]
    key_files: KeyFiles = Field(
        default_factory=KeyFiles, description="Categorized key files for analysis"
    )
    tech_stack: TechStack = Field(
        default_factory=TechStack, description="Technology stack detected"
    )


class AnalysisStreamStartRequest(BaseModel):
    repo_url: str


class AnalysisStreamStartResponse(BaseModel):
    analysis_id: str


# Prompt Generation Models
class CodeSnippets(BaseModel):
    before: Optional[str] = None
    after: Optional[str] = None


class PromptGenerationRequest(BaseModel):
    title: str = Field(..., description="Issue title")
    description: str = Field(..., description="Issue description")
    file_path: str = Field(..., description="File path where the issue is located")
    severity: str = Field(..., description="Issue severity level")
    category: str = Field(..., description="Issue category")
    action_items: Optional[List[str]] = Field(default_factory=list, description="Action items to fix the issue")
    code_snippets: Optional[CodeSnippets] = Field(default=None, description="Code snippets before and after")
    references: Optional[List[str]] = Field(default_factory=list, description="References and documentation links")


class PromptGenerationResponse(BaseModel):
    prompt: str = Field(..., description="Generated cursor-compatible prompt")
    generated_at: str = Field(..., description="Timestamp when prompt was generated")
