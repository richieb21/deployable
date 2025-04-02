from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from app.mcp.github_api_client import github_api_client

router = APIRouter(prefix="/github", tags=["github"])

class CreateIssueRequest(BaseModel):
    owner: str
    repo: str
    title: str
    body: str
    labels: Optional[List[str]] = None
    assignees: Optional[List[str]] = None

class IssueResponse(BaseModel):
    url: str
    html_url: str
    number: int
    title: str
    state: str
    
@router.post("/issues", response_model=IssueResponse)
async def create_issue(request: CreateIssueRequest):
    """Create a GitHub issue in the specified repository."""
    try:
        # Validate token first
        try:
            user_info = github_api_client.validate_token()
            print(f"Using GitHub token for user: {user_info.get('login')}")
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        # Check if repository exists and is accessible
        if not github_api_client.check_repository_exists(request.owner, request.repo):
            raise HTTPException(
                status_code=404, 
                detail=f"Repository '{request.owner}/{request.repo}' does not exist or is not accessible with your token"
            )
        
        # Check if issues are enabled
        if not github_api_client.check_issues_enabled(request.owner, request.repo):
            raise HTTPException(
                status_code=400, 
                detail=f"Issues are disabled for repository '{request.owner}/{request.repo}'"
            )
        
        # Create the issue
        result = github_api_client.create_issue(
            owner=request.owner,
            repo=request.repo,
            title=request.title,
            body=request.body,
            labels=request.labels,
            assignees=request.assignees
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create GitHub issue: {str(e)}") 