# GitHub Service that uses environment credentials to authenticate github API, get source code, count tokens, etc

from dotenv import load_dotenv
from logging import getLogger
from urllib.parse import urlparse
from typing import Optional, Dict, Any, List, Tuple
import requests
import os
import urllib3
import base64

# Suppress the LibreSSL warning
urllib3.disable_warnings(urllib3.exceptions.NotOpenSSLWarning)

logger = getLogger(__name__)

load_dotenv()

class GithubService:
    def __init__(self, pat: Optional[str] = None):
        # use environment personal access token, fallback will be unauthenticated requests
        self.github_token = pat or os.getenv("GITHUB_PAT")
        self.base_url = "https://api.github.com"
        # Cache for repository metadata to avoid redundant API calls
        self._repo_cache = {}

        self.excluded_files = [
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'node_modules',
            '.DS_Store',
            'Thumbs.db',
            '.gitignore',
            '.gitattributes',
            'LICENSE',
            'LICENCE',
        ]

        if not self.github_token:
            logger.warning("No Personal Access Token provided. Using unauthenticated requests (60/hr)")

    def _parse_url(self, repo_url: str) -> Dict[str, str]:
        """
        Given a Github repo_url, parse it's owner and repo name 

        Args:
            repo_url: Github repo url
        
        Returns:
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
    
    def _get_headers(self) -> Dict[str, str]:
        """Get the headers for GitHub API requests."""
        if not self.github_token:
            logger.warning("No Personal Access Token provided. Using unauthenticated requests (60/hr)")
            return {"Accept": "application/vnd.github+json"}
            
        return {
            "Authorization": f"Bearer {self.github_token}", 
            "Accept": "application/vnd.github+json"
        }

    def _get_repo_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """
        Get repository information and cache it to avoid redundant API calls.
        
        Args:
            owner: Repository owner
            repo_name: Repository name
            
        Returns:
            Dictionary with repository information or None if not found
        """
        cache_key = f"{owner}/{repo_name}"
        
        # Return cached info if available
        if cache_key in self._repo_cache:
            return self._repo_cache[cache_key]
        
        api_url = f"{self.base_url}/repos/{owner}/{repo_name}"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            repo_info = response.json()
            self._repo_cache[cache_key] = repo_info
            return repo_info
        
        logger.error(f"Unable to get repository {owner}/{repo_name}. Status code: {response.status_code}")
        return None

    def _check_repo_exists(self, owner: str, repo_name: str) -> Optional[str]:
        """
        Check if a repository exists and return the default branch if it does.
        
        Args:
            owner: Repository owner
            repo_name: Repository name
            
        Returns:
            Default branch name if repository exists, None otherwise
        """
        repo_info = self._get_repo_info(owner, repo_name)
        return repo_info.get("default_branch") if repo_info else None

    def _get_latest_commit(self, owner: str, repo: str, branch: str) -> Optional[str]:
        """
        Get the latest commit SHA given an owner, repo and branch

        Args:
            owner: Repository owner
            repo: Repository name
            branch: Branch name

        Returns:
            Commit SHA or None if not found
        """
        api_url = f"{self.base_url}/repos/{owner}/{repo}/commits/{branch}"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            return response.json().get("sha")
        
        logger.error(f"Unable to get latest commit for {owner}/{repo}. Status code: {response.status_code}")
        return None

    def _get_file_tree(self, owner: str, repo: str, tree_sha: str) -> Optional[Dict[str, Any]]:
        """
        Get the file tree for a repository.
        
        Args:
            owner: Repository owner
            repo: Repository name
            tree_sha: SHA of the tree to fetch
            
        Returns:
            Tree data dictionary or None if not found
        """
        api_url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            return response.json()
        
        logger.error(f"Unable to get file tree for {owner}/{repo}. Status code: {response.status_code}")
        return None
    
    def _get_repo_files_info(self, repo_url: str) -> Tuple[Dict[str, str], List[Dict[str, Any]]]:
        """
        Get repository information and file tree in a single method to avoid redundant logic.
        
        Args:
            repo_url: GitHub repository URL
            
        Returns:
            Tuple of (repo_info, file_tree_items)
        """
        repo_info = self._parse_url(repo_url)
        default_branch = self._check_repo_exists(repo_info["owner"], repo_info["repo"])
        
        if not default_branch:
            logger.error("Default branch not found.")
            return repo_info, []

        latest_commit_sha = self._get_latest_commit(repo_info["owner"], repo_info["repo"], default_branch)
        if not latest_commit_sha:
            logger.error("Could not retrieve latest commit SHA.")
            return repo_info, []

        tree_data = self._get_file_tree(repo_info["owner"], repo_info["repo"], latest_commit_sha)
        if not tree_data:
            logger.error("Could not retrieve file tree.")
            return repo_info, []
            
        return repo_info, tree_data.get("tree", [])
        
    def list_filenames(self, repo_url: str) -> List[str]:
        """
        Given a public GitHub repo URL, return a list of all filenames (full paths).
        
        Args:
            repo_url: GitHub repository URL
            
        Returns:
            List of file paths
        """
        _, tree_items = self._get_repo_files_info(repo_url)
        
        return [
            item["path"]
            for item in tree_items
            if item["type"] == "blob" and item["path"].split("/")[-1] not in self.excluded_files
        ]
    
    def _get_file_contents(self, owner: str, repo: str, path: str) -> Optional[Dict[str, str]]:
        """
        Get the contents of a file from GitHub.
        
        Args:
            owner: Repository owner
            repo: Repository name
            path: Path to the file
            
        Returns:
            Dictionary with file path and content or None if not found
        """
        api_url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        response = requests.get(api_url, headers=self._get_headers())

        if response.status_code == 200:
            data = response.json()
            if data.get('encoding') == "base64":
                return {
                    "path": path,
                    "content": base64.b64decode(data["content"]).decode('utf-8')
                }
        
        logger.error(f"Unable to get file contents for {path}. Status code: {response.status_code}")
        return None

    def get_file_content_from_list(self, repo_url: str) -> List[Dict[str, str]]:
        """
        Get the contents of all files in a repository.
        
        Args:
            repo_url: GitHub repository URL
            
        Returns:
            List of dictionaries with file paths and contents
        """
        repo_info, tree_items = self._get_repo_files_info(repo_url)
        contents = []
        
        # Only process blob items (files)
        file_paths = [item["path"] for item in tree_items if item["type"] == "blob"]
        
        for file_path in file_paths:
            file_content = self._get_file_contents(repo_info["owner"], repo_info["repo"], file_path)
            if file_content:
                contents.append(file_content)
        
        return contents

    def get_file_content_batch(self, repo_url: str, file_paths: List[str]) -> List[Dict[str, str]]:
        """
        Get contents for a specific list of files, useful when you don't need all files.
        
        Args:
            repo_url: GitHub repository URL
            file_paths: List of file paths to retrieve
            
        Returns:
            List of dictionaries with file paths and contents
        """
        repo_info = self._parse_url(repo_url)
        contents = []
        
        for file_path in file_paths:
            file_content = self._get_file_contents(repo_info["owner"], repo_info["repo"], file_path)
            if file_content:
                contents.append(file_content)
        
        return contents


# Only run test code when the script is executed directly
if __name__ == "__main__":
    gh = GithubService()
    print(gh.list_filenames("https://github.com/steventanyang/market_loo"))