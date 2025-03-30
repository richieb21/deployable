# GitHub Service that uses environment credentials to authenticate github API, get source code, count tokens, etc

from dotenv import load_dotenv
from logging import getLogger

load_dotenv()

class GithubService:
    def __init__(self, pat: str | None = None):
        # use environment personal access token, fallback will be unauthenticated requests
        self.github_token = pat

        if not self.github_token:
            return