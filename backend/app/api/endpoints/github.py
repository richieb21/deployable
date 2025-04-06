from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import traceback
import logging

from app.mcp.github_api_client import github_api_client

router = APIRouter(prefix="/github", tags=["github"])

# Set up logging
logger = logging.getLogger(__name__)

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
        logger.info(f"Received request to create issue in {request.owner}/{request.repo}")
        logger.info(f"Issue title: {request.title}")
        
        # Validate token first
        try:
            user_info = github_api_client.validate_token()
            logger.info(f"Using GitHub token for user: {user_info.get('login')}")
        except ValueError as e:
            logger.error(f"Token validation failed: {str(e)}")
            raise HTTPException(status_code=401, detail=str(e))
        
        # Check if repository exists and is accessible
        logger.info(f"Checking if repository {request.owner}/{request.repo} exists")
        if not github_api_client.check_repository_exists(request.owner, request.repo):
            logger.error(f"Repository '{request.owner}/{request.repo}' does not exist or is not accessible")
            raise HTTPException(
                status_code=404, 
                detail=f"Repository '{request.owner}/{request.repo}' does not exist or is not accessible with your token"
            )
        
        # Check if .deployable file exists
        logger.info(f"Checking if .deployable file exists in {request.owner}/{request.repo}")
        if not github_api_client.check_deployable_file_exists(request.owner, request.repo):
            logger.error(f"Repository '{request.owner}/{request.repo}' does not have a .deployable file")
            raise HTTPException(
                status_code=403, 
                detail=f"Repository '{request.owner}/{request.repo}' does not have a .deployable file in the root directory"
            )
        
        # Check if issues are enabled
        logger.info(f"Checking if issues are enabled for {request.owner}/{request.repo}")
        if not github_api_client.check_issues_enabled(request.owner, request.repo):
            logger.error(f"Issues are disabled for repository '{request.owner}/{request.repo}'")
            raise HTTPException(
                status_code=400, 
                detail=f"Issues are disabled for repository '{request.owner}/{request.repo}'"
            )
        
        # Create the issue
        logger.info(f"Creating issue in {request.owner}/{request.repo}")
        result = github_api_client.create_issue(
            owner=request.owner,
            repo=request.repo,
            title=request.title,
            body=request.body,
            labels=request.labels,
            assignees=request.assignees
        )
        
        logger.info(f"Successfully created issue #{result.get('number')}")
        return result
    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        logger.error(f"Permission error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create GitHub issue: {str(e)}") 