from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import traceback
import logging

from app.mcp.github_api_client import github_api_client
from app.mcp.github_client import github_mcp_client  # Import the MCP client

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
    
class ListIssuesRequest(BaseModel):
    owner: str
    repo: str
    state: Optional[str] = "open"
    labels: Optional[List[str]] = None
    sort: Optional[str] = "created"
    direction: Optional[str] = "desc"
    page: Optional[int] = 1
    per_page: Optional[int] = 30

@router.post("/issues", response_model=IssueResponse)
async def create_issue(request: CreateIssueRequest):
    """Create a GitHub issue in the specified repository using direct API."""
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

@router.post("/mcpissues", response_model=IssueResponse)
async def create_issue_with_mcp(request: CreateIssueRequest, background_tasks: BackgroundTasks):
    """Create a GitHub issue using the MCP client."""
    try:
        logger.info(f"Received request to create issue via MCP in {request.owner}/{request.repo}")
        logger.info(f"Issue title: {request.title}")
        
        # Create the issue using MCP client
        logger.info(f"Creating issue with MCP in {request.owner}/{request.repo}")
        result = await github_mcp_client.create_issue(
            owner=request.owner,
            repo=request.repo,
            title=request.title,
            body=request.body,
            labels=request.labels,
            assignees=request.assignees
        )
        
        # Add background task to close the MCP client after response is sent
        background_tasks.add_task(github_mcp_client.close)
        
        logger.info(f"Successfully created issue with MCP #{result.get('number')}")
        return result
    except ValueError as e:
        logger.error(f"Value error in MCP: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        logger.error(f"Permission error in MCP: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in MCP: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create GitHub issue with MCP: {str(e)}")


    """Test MCP with a simple calculator server."""
    logger.info(f"Testing MCP calculator with {a} {op} {b}")
    
    # Save the original server command and args
    original_command = github_mcp_client.server_command
    original_args = github_mcp_client.server_args
    
    try:
        # Temporarily change to use the calculator server
        github_mcp_client.server_command = "npx"
        github_mcp_client.server_args = ["-y", "@modelcontextprotocol/server-calculator"]
        
        # Close any existing server process
        await github_mcp_client.close()
        
        # Get a client session
        client = await github_mcp_client._ensure_server_running()
        
        # Call the appropriate calculator method
        if op == "add" or op == "+":
            result = await client.call("add", {"a": a, "b": b})
        elif op == "subtract" or op == "-":
            result = await client.call("subtract", {"a": a, "b": b})
        elif op == "multiply" or op == "*":
            result = await client.call("multiply", {"a": a, "b": b})
        elif op == "divide" or op == "/":
            result = await client.call("divide", {"a": a, "b": b})
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operation: {op}")
        
        # Add background task to close the MCP client after response is sent
        background_tasks.add_task(github_mcp_client.close)
        
        return {
            "operation": f"{a} {op} {b}",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error testing MCP calculator: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Add background task to close the MCP client after response is sent
        background_tasks.add_task(github_mcp_client.close)
        
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to test MCP calculator: {str(e)}"
        )
    finally:
        # Restore the original server command and args
        github_mcp_client.server_command = original_command
        github_mcp_client.server_args = original_args