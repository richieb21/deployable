import asyncio
import json
import os
import subprocess
import logging
import uuid
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env

# Set up logging
logger = logging.getLogger(__name__)

class MCPClient:
    """A simple MCP client implementation that communicates with an MCP server via stdin/stdout."""
    
    def __init__(self, stdin, stdout):
        self.stdin = stdin
        self.stdout = stdout
        self.pending_requests = {}
    
    async def call(self, method, params):
        """Call a method on the MCP server with the given parameters."""
        request_id = str(uuid.uuid4())
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method,
            "params": params
        }
        
        # Special case for testing - don't actually send the request
        if params.get("_test_only") == True:
            # Just check if the method exists in the server's capabilities
            # This is a dummy implementation since we can't know without sending a request
            logger.info(f"Test-only mode for method: {method}")
            return {"test_only": True, "method": method}
        
        # Create a future to wait for the response
        future = asyncio.Future()
        self.pending_requests[request_id] = future
        
        # Send the request
        request_json = json.dumps(request) + "\n"
        self.stdin.write(request_json.encode())
        await self.stdin.drain()
        
        # Start reading responses in the background if not already started
        asyncio.create_task(self._read_responses())
        
        # Wait for the response
        return await future
    
    async def _read_responses(self):
        """Read and process responses from the MCP server."""
        while True:
            try:
                line = await self.stdout.readline()
                if not line:
                    break
                    
                response = json.loads(line.decode())
                request_id = response.get("id")
                
                if request_id in self.pending_requests:
                    future = self.pending_requests.pop(request_id)
                    
                    if "error" in response:
                        future.set_exception(Exception(f"MCP server error: {response['error']}"))
                    else:
                        future.set_result(response.get("result"))
            except Exception as e:
                logger.error(f"Error reading MCP response: {str(e)}")
                break

class GitHubMCPClient:
    """GitHub API client using MCP protocol to communicate with a GitHub MCP server."""
    
    def __init__(self):
        # MCP server configuration
        self.server_command = os.getenv("MCP_GITHUB_SERVER_COMMAND", "npx")
        self.server_args = os.getenv("MCP_GITHUB_SERVER_ARGS", "-y @modelcontextprotocol/server-github").split()
        self.server_process = None
        self.client = None
        
        # Get GitHub token from environment
        self.github_token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
        if not self.github_token:
            logger.warning("GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set")
        
    async def _ensure_server_running(self):
        """Ensure the MCP server is running and return a client session."""
        # Start the MCP server process if not already running
        if self.server_process is None:
            logger.info(f"Starting MCP GitHub server with command: {self.server_command} {' '.join(self.server_args)}")
            try:
                # Set up environment with GitHub token
                env = os.environ.copy()
                if self.github_token:
                    env["GITHUB_PERSONAL_ACCESS_TOKEN"] = self.github_token
                
                self.server_process = await asyncio.create_subprocess_exec(
                    self.server_command,
                    *self.server_args,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env  # Pass the environment with the token
                )
                logger.info(f"MCP GitHub server started with PID: {self.server_process.pid}")
                
                # Start a task to log stderr output
                asyncio.create_task(self._log_stderr())
                
                # Create a new client
                self.client = MCPClient(self.server_process.stdin, self.server_process.stdout)
                logger.info("MCP client created successfully")
                
            except Exception as e:
                logger.error(f"Failed to start MCP GitHub server: {str(e)}")
                raise RuntimeError(f"Failed to start MCP GitHub server: {str(e)}")
        
        return self.client
    
    async def _log_stderr(self):
        """Log stderr output from the server process."""
        while self.server_process:
            try:
                line = await self.server_process.stderr.readline()
                if not line:
                    break
                stderr_output = line.decode().strip()
                if stderr_output:
                    logger.warning(f"MCP GitHub server stderr: {stderr_output}")
            except Exception as e:
                logger.error(f"Error reading stderr: {str(e)}")
                break
    
    async def create_issue(self, owner: str, repo: str, title: str, body: str, 
                    labels: Optional[List[str]] = None, assignees: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a GitHub issue using the MCP GitHub server."""
        logger.info(f"Creating issue with MCP in {owner}/{repo} with title: {title}")
        
        # Prepare the issue data
        data = {
            "owner": owner,
            "repo": repo,
            "title": title,
            "body": body
        }
        
        if labels:
            data["labels"] = labels
            
        if assignees:
            data["assignees"] = assignees
        
        try:
            # Get a client session
            client = await self._ensure_server_running()
            
            # Try different method names that might be used by the MCP server
            methods_to_try = [
                "create_issue",           # Standard name from docs
                "issues.create",          # Possible alternative format
                "github.issues.create",   # Another possible format
                "createIssue"             # Camel case variant
            ]
            
            last_error = None
            for method in methods_to_try:
                try:
                    logger.info(f"Trying method: {method} with data: {json.dumps(data)}")
                    response = await client.call(method, data)
                    logger.info(f"Success with method {method}")
                    logger.info(f"MCP server response: {json.dumps(response)}")
                    return response
                except Exception as e:
                    error_msg = str(e)
                    if "Method not found" in error_msg:
                        logger.warning(f"Method {method} not found, trying next method")
                        last_error = e
                        continue
                    else:
                        # If it's another error, it might be a parameter issue
                        logger.error(f"Error with method {method}: {error_msg}")
                        raise e
            
            # If we get here, none of the methods worked
            if last_error:
                raise last_error
            else:
                raise Exception("No create_issue method found on MCP server")
            
        except Exception as e:
            logger.error(f"Error creating issue with MCP: {str(e)}")
            raise Exception(f"Failed to create issue with MCP: {str(e)}")
    
    async def get_issue(self, owner: str, repo: str, issue_number: int) -> Dict[str, Any]:
        """Get a GitHub issue using the MCP GitHub server."""
        logger.info(f"Getting issue with MCP from {owner}/{repo} with number: {issue_number}")
        
        # Prepare the request data
        data = {
            "owner": owner,
            "repo": repo,
            "issue_number": issue_number
        }
        
        try:
            # Get a client session
            client = await self._ensure_server_running()
            
            # Call the get_issue method on the MCP server
            logger.info(f"Sending get_issue request to MCP server with data: {json.dumps(data)}")
            response = await client.call("get_issue", data)
            
            logger.info(f"MCP server response: {json.dumps(response)}")
            return response
        except Exception as e:
            logger.error(f"Error getting issue with MCP: {str(e)}")
            raise Exception(f"Failed to get issue with MCP: {str(e)}")
    
    async def list_issues(self, owner: str, repo: str, state: str = "open", 
                         labels: Optional[List[str]] = None, sort: str = "created",
                         direction: str = "desc", page: int = 1, per_page: int = 30) -> Dict[str, Any]:
        """List GitHub issues using the MCP GitHub server."""
        logger.info(f"Listing issues with MCP from {owner}/{repo}")
        
        # Prepare the request data
        data = {
            "owner": owner,
            "repo": repo,
            "state": state,
            "sort": sort,
            "direction": direction,
            "page": page,
            "per_page": per_page
        }
        
        if labels:
            data["labels"] = labels
        
        try:
            # Get a client session
            client = await self._ensure_server_running()
            
            # Call the list_issues method on the MCP server
            logger.info(f"Sending list_issues request to MCP server with data: {json.dumps(data)}")
            response = await client.call("list_issues", data)
            
            logger.info(f"MCP server response received")
            return response
        except Exception as e:
            logger.error(f"Error listing issues with MCP: {str(e)}")
            raise Exception(f"Failed to list issues with MCP: {str(e)}")
    
    async def close(self):
        """Close the MCP client and server."""
        logger.info("Closing MCP GitHub client")
        self.client = None
        
        if self.server_process:
            logger.info(f"Terminating MCP GitHub server (PID: {self.server_process.pid})")
            try:
                self.server_process.terminate()
                await asyncio.wait_for(self.server_process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Server process did not terminate gracefully, killing it")
                self.server_process.kill()
                await self.server_process.wait()
            except Exception as e:
                logger.error(f"Error closing server process: {str(e)}")
            finally:
                self.server_process = None

# Create a singleton instance
github_mcp_client = GitHubMCPClient()

# Helper functions for synchronous code
def create_github_issue(owner: str, repo: str, title: str, body: str, 
                       labels: Optional[list] = None, assignees: Optional[list] = None) -> Dict[str, Any]:
    """Synchronous wrapper for creating GitHub issues."""
    return asyncio.run(_create_issue(owner, repo, title, body, labels, assignees))
    
async def _create_issue(owner: str, repo: str, title: str, body: str, 
                      labels: Optional[list] = None, assignees: Optional[list] = None) -> Dict[str, Any]:
    """Internal async function for creating an issue."""
    try:
        result = await github_mcp_client.create_issue(owner, repo, title, body, labels, assignees)
        return result
    finally:
        await github_mcp_client.close() 