from dotenv import load_dotenv
from logging import getLogger
from urllib.parse import urlparse
from typing import Optional, Dict, Any, List, Tuple
import redis.exceptions
import requests
import base64
from functools import lru_cache
from app.core.dependencies import TTL_EXPIRATION
import redis
from app.core.config import settings

logger = getLogger(__name__)

class GithubService:
    def __init__(self, pat: Optional[str] = None, redis_client=None):
        # use environment personal access token, fallback will be unauthenticated requests
        self.github_token = pat or settings.GITHUB_PAT
        self.base_url = "https://api.github.com"
        self.redis_client = redis_client

        # Files to exclude
        self.excluded_files = [
            "package.json",
            "package-lock.json",
            "yarn.lock",
            ".DS_Store",
            "Thumbs.db",
            ".gitignore",
            ".gitattributes",
            "LICENSE",
            "LICENCE",
            "README.md",
            ".env",
            ".env.example",
            ".env.local",
            ".env.development",
            ".env.test",
            ".env.production",
            ".deployable",
        ]

        # Directories to exclude (will exclude all contents within these directories)
        self.excluded_dirs = [
            "node_modules",
            ".git",
            "dist",
            "build",
            "coverage",
            "__pycache__",
            ".pytest_cache",
            ".next",
            ".venv",
            "venv",
            "env",
            ".idea",
            ".vscode",
        ]

        # File extensions to exclude
        self.excluded_extensions = [
            # Documentation and text files
            ".txt",
            ".md",
            ".rst",
            ".pdf",
            ".doc",
            ".docx",
            # Log files
            ".log",
            # Image files
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".ico",
            ".svg",
            # Data files
            ".csv",
            ".xls",
            ".xlsx",
            ".json",  # Exclude JSON files except specific config files we need
            # Cache and compiled files
            ".pyc",
            ".pyo",
            ".pyd",
            ".cache",
            # IDE and editor files
            ".swp",
            ".swo",
            ".swn",
            ".bak",
            # OS-specific files
            ".DS_Store",
            "Thumbs.db",
            # Other binary files
            ".zip",
            ".tar",
            ".gz",
            ".rar",
        ]

        if not self.github_token:
            logger.warning(
                "No Personal Access Token provided. Using unauthenticated requests (60/hr)"
            )

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
            "repo": path_components[-1],
        }

    def _get_headers(self) -> Dict[str, str]:
        """Get the headers for GitHub API requests."""
        if not self.github_token:
            logger.warning(
                "No Personal Access Token provided. Using unauthenticated requests (60/hr)"
            )
            return {"Accept": "application/vnd.github+json"}

        return {
            "Authorization": f"Bearer {self.github_token}",
            "Accept": "application/vnd.github+json",
        }

    @lru_cache(maxsize=128)
    def _get_repo_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """
        Get repository information and cache it to avoid redundant API calls.

        Args:
            owner: Repository owner
            repo_name: Repository name

        Returns:
            Dictionary with repository information or None if not found
        """

        api_url = f"{self.base_url}/repos/{owner}/{repo_name}"

        try:
            response = requests.get(api_url, headers=self._get_headers())
        except requests.exceptions.Timeout:
            logger.error(f"Timeout occurred while requesting: {api_url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Requests failed for {api_url}: {e}")
            return None

        if response.status_code == 200:
            repo_info = response.json()
            return repo_info

        logger.error(
            f"Unable to get repository {owner}/{repo_name}. Status code: {response.status_code}"
        )
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

        try:
            response = requests.get(api_url, headers=self._get_headers())
        except requests.exceptions.Timeout:
            logger.error(f"Timeout occurred while requesting: {api_url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Requests failed for {api_url}: {e}")
            return None

        if response.status_code == 200:
            return response.json().get("sha")

        logger.error(
            f"Unable to get latest commit for {owner}/{repo}. Status code: {response.status_code}"
        )
        return None

    def _get_file_tree(
        self, owner: str, repo: str, tree_sha: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the file tree for a repository.

        Args:
            owner: Repository owner
            repo: Repository name
            tree_sha: SHA of the tree to fetch

        Returns:
            Tree data dictionary or None if not found
        """
        api_url = (
            f"{self.base_url}/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1"
        )

        try:
            response = requests.get(api_url, headers=self._get_headers())
        except requests.exceptions.Timeout:
            logger.error(f"Timeout occurred while requesting: {api_url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Requests failed for {api_url}: {e}")
            return None

        if response.status_code == 200:
            return response.json()

        logger.error(
            f"Unable to get file tree for {owner}/{repo}. Status code: {response.status_code}"
        )
        return None

    def _get_repo_files_info(
        self, repo_url: str
    ) -> Tuple[Dict[str, str], List[Dict[str, Any]]]:
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

        latest_commit_sha = self._get_latest_commit(
            repo_info["owner"], repo_info["repo"], default_branch
        )
        if not latest_commit_sha:
            logger.error("Could not retrieve latest commit SHA.")
            return repo_info, []

        tree_data = self._get_file_tree(
            repo_info["owner"], repo_info["repo"], latest_commit_sha
        )
        if not tree_data:
            logger.error("Could not retrieve file tree.")
            return repo_info, []

        return repo_info, tree_data.get("tree", [])

    def _should_exclude_path(self, path: str) -> bool:
        """
        Check if a file path should be excluded based on excluded directories, files, and extensions.

        Args:
            path: File path to check

        Returns:
            True if path should be excluded, False otherwise
        """
        path_parts = path.split("/")

        for part in path_parts:
            if part in self.excluded_dirs:
                return True

        filename = path_parts[-1]
        if filename in self.excluded_files:
            return True

        # Check file extensions
        if "." in filename:
            extension = "." + filename.split(".")[-1].lower()
            if extension in self.excluded_extensions:
                # Special cases: Allow certain config files even if their extension is excluded
                important_config_files = {
                    "package.json",
                    "tsconfig.json",
                    "composer.json",
                    "angular.json",
                    "next.config.js",
                    "webpack.config.js",
                    "babel.config.js",
                    "jest.config.js",
                }
                if filename not in important_config_files:
                    return True

        return False

    def list_filenames(self, repo_url: str) -> List[str]:
        """
        Given a public GitHub repo URL, return a list of all filenames (full paths).
        Excludes files in excluded directories, excluded files, and files with excluded extensions.

        Args:
            repo_url: GitHub repository URL

        Returns:
            List of file paths
        """
        _, tree_items = self._get_repo_files_info(repo_url)

        return [
            item["path"]
            for item in tree_items
            if item["type"] == "blob" and not self._should_exclude_path(item["path"])
        ]

    def _get_cache_key(self, owner, repo, path):
        """Given an owner and repo, get their cache key"""

        # ideally, we should do a hash of owner:repo:path
        return f"{owner}:{repo}:{path}"

    def _cache_file_contents(self, owner: str, repo: str, path: str, contents: str):
        """Store file contents of a repositories files into the Redis cache"""
        if not self.redis_client:
            logger.info("Redis client not available, skipping cache")
            return

        try:
            cache_key = self._get_cache_key(owner, repo, path)
            self.redis_client.set(cache_key, contents, ex=TTL_EXPIRATION)
        except redis.exceptions.ConnectionError:
            logger.warning("Redis connection failed - caching disabled")
            pass

    def _get_cache_contents(self, owner: str, repo: str, path: str):
        """Retrieve file contents of a repositories files into the Redis cache"""
        if not self.redis_client:
            logger.info("Redis client not available, skipping cache")
            return None

        try:
            cache_key = self._get_cache_key(owner, repo, path)
            return self.redis_client.get(cache_key)
        except redis.exceptions.ConnectionError:
            logger.warning("Redis connection failed - caching disabled")
            return None

    def _get_file_contents(
        self, owner: str, repo: str, path: str
    ) -> Optional[Dict[str, str]]:
        """
        Get the contents of a file from GitHub.

        Args:
            owner: Repository owner
            repo: Repository name
            path: Path to the file

        Returns:
            Dictionary with file path and content or None if not found
        """

        # Only try to get from cache if Redis is available
        if self.redis_client:
            cache_contents = self._get_cache_contents(owner, repo, path)
            if cache_contents:
                return {"path": path, "content": cache_contents}

        api_url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"

        try:
            response = requests.get(api_url, headers=self._get_headers())
        except requests.exceptions.Timeout:
            logger.error(f"Timeout occurred while requesting: {api_url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Requests failed for {api_url}: {e}")
            return None

        if response.status_code == 200:
            data = response.json()
            if data.get("encoding") == "base64":
                content = base64.b64decode(data["content"]).decode("utf-8")
                # Only try to cache if Redis is available
                if self.redis_client:
                    self._cache_file_contents(owner, repo, path, content)
                return {"path": path, "content": content}

        logger.error(
            f"Unable to get file contents for {path}. Status code: {response.status_code}"
        )
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
            file_content = self._get_file_contents(
                repo_info["owner"], repo_info["repo"], file_path
            )
            if file_content:
                contents.append(file_content)

        return contents

    def get_file_content_batch(
        self, repo_url: str, file_paths: List[str]
    ) -> List[Dict[str, str]]:
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
            file_content = self._get_file_contents(
                repo_info["owner"], repo_info["repo"], file_path
            )
            if file_content:
                contents.append(file_content)

        return contents
