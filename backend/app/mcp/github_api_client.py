import os
import requests
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env

class GitHubAPIClient:
    """Direct GitHub API client as a fallback alternative to MCP."""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }
    
    def check_repository_exists(self, owner: str, repo: str) -> bool:
        """Check if a repository exists and is accessible with current token."""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        try:
            response = requests.get(url, headers=self.headers)
            return response.status_code == 200
        except Exception:
            return False
    
    def check_issues_enabled(self, owner: str, repo: str) -> bool:
        """Check if issues are enabled for the repository."""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                repo_data = response.json()
                return repo_data.get("has_issues", False)
            return False
        except Exception:
            return False
    
    def create_issue(self, owner: str, repo: str, title: str, body: str, 
                    labels: Optional[List[str]] = None, assignees: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a GitHub issue using the GitHub API directly."""
        # First, check if repository exists
        if not self.check_repository_exists(owner, repo):
            raise ValueError(f"Repository '{owner}/{repo}' does not exist or is not accessible with current token")
        
        # Then check if issues are enabled
        if not self.check_issues_enabled(owner, repo):
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
        
        # Create the issue
        response = requests.post(url, json=data, headers=self.headers)
        
        # Improved error handling
        if response.status_code != 201:  # GitHub returns 201 Created for successful issue creation
            error_data = response.json() if response.text else {}
            error_message = error_data.get('message', 'Unknown error')
            if response.status_code == 403:
                raise PermissionError(f"Permission denied: {error_message}. Check if your token has the 'repo' scope.")
            elif response.status_code == 404:
                raise ValueError(f"Not found: {error_message}. Repository might not exist or issues might be disabled.")
            else:
                raise Exception(f"GitHub API error: {response.status_code} - {error_message}")
        
        return response.json()
    
    def validate_token(self) -> Dict[str, Any]:
        """Validate the GitHub token and return user information."""
        url = f"{self.base_url}/user"
        response = requests.get(url, headers=self.headers)
        if response.status_code != 200:
            raise ValueError("Invalid GitHub token or token has insufficient permissions")
        return response.json()

# Create a singleton instance
github_api_client = GitHubAPIClient() 