# GitHub Service that uses environment credentials to authenticate github API, get source code, count tokens, etc

from dotenv import load_dotenv
from logging import getLogger
from urllib.parse import urlparse
from typing import Optional, Dict, Any
import requests
import os
import urllib3

# Suppress the LibreSSL warning
urllib3.disable_warnings(urllib3.exceptions.NotOpenSSLWarning)

logger = getLogger(__name__)

load_dotenv()

class GithubService:
    def __init__(self, pat: Optional[str] = None):
        # use environment personal access token, fallback will be unauthenticated requests
        self.github_token = os.getenv("GITHUB_PAT")
        self.base_url = "https://api.github.com"

        if not self.github_token:
            logger.warning("No Personal Access Token provided. Using unauthenticated requests (60/hr)")

    def _parse_url(self, repo_url: str):
        """
        Given a Github repo_url, parse it's owner and repo name 

        args:
            repo_url: Github repo url
        
        returns:
            Dictionary containing both owner and repo name
        """

        parsed_url = urlparse(repo_url)
        path_components = parsed_url.path.split("/")
         
        if len(path_components) < 2:
            logger.error("Invalid GitHub repository")
            raise ValueError(f"Provided GitHub repository URL is not valid.")
        
        return {
            "owner": path_components[-2],
            "repo" : path_components[-1],
        }
    
    def _get_headers(self):
        if not self.github_token:
            logger.warning("No Personal Access Token provided. Using unauthenticated requests (60/hr)")
            return {"Accept": "application/vnd.github+json"}
            
        return {
            "Authorization": f"Bearer {self.github_token}", 
            "Accept": "application/vnd.github+json"
        }

    def _check_repo_exists(self, owner, repo_name):
        """
        Check if a repository exists and return the default branch if it does.
        
        Args:
            owner: Repository owner
            repo_name: Repository name
            
        Returns:
            Default branch name if repository exists, None otherwise
        """
        api_url = f"{self.base_url}/repos/{owner}/{repo_name}"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            return response.json().get("default_branch")
        
        logger.error(f"Unable to get repository {owner}/{repo_name}. Status code: {response.status_code}")
        return None

    def _get_latest_commit(self, owner, repo, branch):
        """
        Get the latest commit SHA given an owner, repo and branch

        args:


        """

        api_url = f"{self.base_url}/repos/{owner}/{repo}/commits/{branch}"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            return response.json().get("sha")

    def _get_file_tree(self, owner, repo, tree_sha):

        api_url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            return response.json()
        
    def list_filenames(self, repo_url: str):
        """
        Given a public GitHub repo URL, return a list of all filenames (full paths).
        """
        repo_info = self._parse_url(repo_url)
        default_branch = self._check_repo_exists(repo_info["owner"], repo_info["repo"])
        if not default_branch:
            logger.error("Default branch not found.")
            return []

        latest_commit_sha = self._get_latest_commit(repo_info["owner"], repo_info["repo"], default_branch)
        if not latest_commit_sha:
            logger.error("Could not retrieve latest commit SHA.")
            return []

        tree_data = self._get_file_tree(repo_info["owner"], repo_info["repo"], latest_commit_sha)
        if not tree_data:
            logger.error("Could not retrieve file tree.")
            return []

        return [
            item["path"]
            for item in tree_data.get("tree", [])
            if item["type"] == "blob"
        ]
        


# Only run test code when the script is executed directly
if __name__ == "__main__":
    gh = GithubService()
    repo_info = gh._parse_url("https://github.com/steventanyang/market_loo")
    print(f"Parsed repo info: {repo_info}")
    default_branch = gh._check_repo_exists(repo_info["owner"], repo_info["repo"])
    print(f"Default branch: {default_branch}")

    latest_commit_sha = gh._get_latest_commit(repo_info["owner"], repo_info["repo"], default_branch)
    print(gh.list_filenames("https://github.com/steventanyang/market_loo"))