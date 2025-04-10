import asyncio
import json
import os
import subprocess
from typing import Dict, Any, Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env


class GitHubMCPClient:
    """GitHub MCP client for interacting with GitHub API through an MCP server."""

    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.is_connected = False

    async def connect(self):
        """Connect to the GitHub MCP server."""
        if self.is_connected:
            return

        # Install node-fetch explicitly first (only needs to be done once)
        try:
            subprocess.run(["npm", "install", "-g", "node-fetch"], check=True)
        except Exception as e:
            print(f"Warning: Could not install node-fetch: {str(e)}")

        # Option 1: Use the GitHub MCP server with node-fetch
        server_params = StdioServerParameters(
            command="npx",
            args=["-y", "@modelcontextprotocol/server-github"],
            env={
                "GITHUB_PERSONAL_ACCESS_TOKEN": os.getenv(
                    "GITHUB_PERSONAL_ACCESS_TOKEN"
                ),
                "NODE_OPTIONS": "--require=node-fetch",  # Add node-fetch as a requirement
            },
        )

        # Option 2: If Option 1 doesn't work, we could directly use the GitHub API
        # through the standard Python 'requests' library instead of MCP

        stdio_transport = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(self.stdio, self.write)
        )

        await self.session.initialize()
        self.is_connected = True

        # List available tools (optional, for debugging)
        response = await self.session.list_tools()
        tools = response.tools
        print(
            "\nConnected to GitHub MCP server with tools:",
            [tool.name for tool in tools],
        )

    async def create_issue(
        self,
        owner: str,
        repo: str,
        title: str,
        body: str,
        labels: Optional[list] = None,
        assignees: Optional[list] = None,
    ) -> Dict[str, Any]:
        """Create a GitHub issue using the MCP server.

        Args:
            owner: Repository owner (username or organization)
            repo: Repository name
            title: Issue title
            body: Issue description
            labels: Optional list of labels to add
            assignees: Optional list of usernames to assign

        Returns:
            Dict containing the created issue details
        """
        if not self.is_connected:
            await self.connect()

        # Prepare the tool arguments
        args = {"owner": owner, "repo": repo, "title": title, "body": body}

        if labels:
            args["labels"] = labels

        if assignees:
            args["assignees"] = assignees

        # Call the create_issue tool
        result = await self.session.call_tool("create_issue", args)
        return json.loads(result.content)

    async def close(self):
        """Close the connection to the MCP server."""
        if self.is_connected:
            await self.exit_stack.aclose()
            self.is_connected = False


# Create a singleton instance
github_client = GitHubMCPClient()


# Helper functions for synchronous code
def create_github_issue(
    owner: str,
    repo: str,
    title: str,
    body: str,
    labels: Optional[list] = None,
    assignees: Optional[list] = None,
) -> Dict[str, Any]:
    """Synchronous wrapper for creating GitHub issues."""
    return asyncio.run(_create_issue(owner, repo, title, body, labels, assignees))


async def _create_issue(
    owner: str,
    repo: str,
    title: str,
    body: str,
    labels: Optional[list] = None,
    assignees: Optional[list] = None,
) -> Dict[str, Any]:
    """Internal async function for creating an issue."""
    try:
        result = await github_client.create_issue(
            owner, repo, title, body, labels, assignees
        )
        return result
    finally:
        await github_client.close()
