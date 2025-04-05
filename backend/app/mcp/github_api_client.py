import os
import requests
import logging
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env

# Set up logging
logger = logging.getLogger(__name__)

class GitHubAPIClient:
    """Direct GitHub API client as a fallback alternative to MCP."""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
        if not self.token:
            logger.warning("GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set")
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }
    
    def check_repository_exists(self, owner: str, repo: str) -> bool:
        """Check if a repository exists and is accessible with current token."""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        try:
            logger.info(f"Checking if repository exists: {owner}/{repo}")
            response = requests.get(url, headers=self.headers)
            exists = response.status_code == 200
            logger.info(f"Repository {owner}/{repo} exists: {exists}")
            if not exists:
                logger.error(f"Repository check failed with status {response.status_code}: {response.text}")
            return exists
        except Exception as e:
            logger.error(f"Error checking repository: {str(e)}")
            return False
    
    def check_issues_enabled(self, owner: str, repo: str) -> bool:
        """Check if issues are enabled for the repository."""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        try:
            logger.info(f"Checking if issues are enabled for: {owner}/{repo}")
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                repo_data = response.json()
                issues_enabled = repo_data.get("has_issues", False)
                logger.info(f"Issues enabled for {owner}/{repo}: {issues_enabled}")
                return issues_enabled
            logger.error(f"Issues check failed with status {response.status_code}: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Error checking issues enabled: {str(e)}")
            return False
    
    def create_issue(self, owner: str, repo: str, title: str, body: str, 
                    labels: Optional[List[str]] = None, assignees: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a GitHub issue using the GitHub API directly."""
        # First, check if repository exists
        if not self.check_repository_exists(owner, repo):
            logger.error(f"Repository '{owner}/{repo}' does not exist or is not accessible")
            raise ValueError(f"Repository '{owner}/{repo}' does not exist or is not accessible with current token")
        
        # Then check if issues are enabled
        if not self.check_issues_enabled(owner, repo):
            logger.error(f"Issues are disabled for repository '{owner}/{repo}'")
            raise ValueError(f"Issues are disabled for repository '{owner}/{repo}'")
        
        url = f"{self.base_url}/repos/{owner}/{repo}/issues"
        
        # Prepare the issue data
        data = {
            "title": title,
            "body": body
        }
        
        if labels:
            data["labels"] = labels
            
        if assignees:
            data["assignees"] = assignees
        
        logger.info(f"Creating issue in {owner}/{repo} with title: {title}")
        logger.debug(f"Issue data: {data}")
        
        # Create the issue
        response = requests.post(url, json=data, headers=self.headers)
        
        # Log the response
        logger.info(f"GitHub API response status: {response.status_code}")
        logger.debug(f"GitHub API response: {response.text[:500]}...")
        
        # Improved error handling
        if response.status_code != 201:  # GitHub returns 201 Created for successful issue creation
            error_data = response.json() if response.text else {}
            error_message = error_data.get('message', 'Unknown error')
            logger.error(f"Failed to create issue: {error_message}")
            
            if response.status_code == 403:
                raise PermissionError(f"Permission denied: {error_message}. Check if your token has the 'repo' scope.")
            elif response.status_code == 404:
                raise ValueError(f"Not found: {error_message}. Repository might not exist or issues might be disabled.")
            else:
                raise Exception(f"GitHub API error: {response.status_code} - {error_message}")
        
        return response.json()
    
    def validate_token(self) -> Dict[str, Any]:
        """Validate the GitHub token and return user information."""
        if not self.token:
            logger.error("GitHub token is not set")
            raise ValueError("GitHub token is not set. Please set the GITHUB_PERSONAL_ACCESS_TOKEN environment variable.")
            
        url = f"{self.base_url}/user"
        logger.info("Validating GitHub token")
        response = requests.get(url, headers=self.headers)
        
        if response.status_code != 200:
            logger.error(f"Token validation failed with status {response.status_code}: {response.text}")
            raise ValueError("Invalid GitHub token or token has insufficient permissions")
            
        user_info = response.json()
        logger.info(f"Token validated for user: {user_info.get('login')}")
        return user_info

# Create a singleton instance
github_api_client = GitHubAPIClient() 