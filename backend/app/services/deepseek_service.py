import os
from openai import OpenAI
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from logging import getLogger
import json
import re

logger = getLogger(__name__)

load_dotenv()

class DeepseekService:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Deepseek service with API key from env variables or parameter.
        
        Args:
            api_key: Optional API key, defaults to DEEPSEEK_API_KEY environment variable
        """
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        
        if not self.api_key:
            logger.error("No Deepseek API key provided")
            raise ValueError("DEEPSEEK_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=self.api_key, base_url="https://api.deepseek.com")
        self.model = "deepseek-chat"
    
    def call_model(self, prompt: str) -> str:
        """
        Analyze code snippets with Deepseek model and return recommendations.
        
        Args:
            prompt: The analysis instruction prompt
            
        Returns:
            Analysis results as a string
        """
        messages = [
            {"role": "system", "content": "You are a staff engineer who is amazing at making deployment ready applications."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
            )
            raw_content = response.choices[0].message.content
            json_content = self._extract_json(raw_content)
            return json_content
        except Exception as e:
            logger.error(f"Error calling Deepseek API: {str(e)}")
            raise
    
    def _extract_json(self, text: str) -> str:
        """
        Extract JSON content from model response that might contain markdown code blocks
        or other non-JSON text.
        
        Args:
            text: Raw text response from the model
            
        Returns:
            Cleaned JSON string
        """
        # regex to parse out json
        json_pattern = r"```(?:json)?\s*([\s\S]*?)```"
        matches = re.findall(json_pattern, text)
        
        if matches:
            # Return the first JSON block found
            return matches[0].strip()
        
        if text.strip().startswith("[") and text.strip().endswith("]"):
            return text.strip()
        
        return text
    
    def _build_prompt(self, code_snippets: List[Dict[str, str]], base_prompt: str) -> str:
        """
        Build a prompt combining the base prompt and code snippets.
        
        Args:
            code_snippets: List of dictionaries with filename and content
            base_prompt: The core instruction
            
        Returns:
            Combined prompt string
        """
        prompt = f"{base_prompt}\n\nHere are the code files to analyze:\n\n"
        
        for snippet in code_snippets:
            prompt += f"File: {snippet['filename']}\n```\n{snippet['content']}\n```\n\n"
        
        return prompt
    
    def identify_files_prompt(self, files):
        """
        Create a prompt to identify important deployment files.
        
        Args:
            files: List of file paths in the repository
            
        Returns:
            Formatted prompt string
        """
        prompt = f"""
        Analyze the following list of file paths in a project and identify ONLY the 10-15 MOST CRITICAL files for deployment readiness.
        Focus strictly on:
        1. Security concerns (auth files, env files)
        2. Infrastructure configuration (Docker, CI/CD, serverless)
        3. Environment setup (.env files, config)
        4. Main application entry points

        IGNORE test files, documentation, package files and non-essential UI components.

        {str(files)}
        
        Format your response as JSON with keys frontend, backend and infra each with a respective array of file paths. 
        LIMIT your selection to only the most important files - no more than 15 files total across all categories.
        """

        return prompt

    def get_file_analysis_prompt(self, files):
        """
        Create a prompt for analyzing file contents to determine deployment readiness.

        Args:
            files: List of dictionaries, each containing 'path' and 'content' keys

        Returns:
            Formatted prompt string for the LLM
        """
        
        # Start with the base instruction
        prompt = """
        As a deployment specialist, analyze these files for an application that is preparing for deployment.
        Identify specific issues related to deployment readiness across these categories:
        
        1. SECURITY: Authentication, authorization, secrets management, input validation, etc.
        2. PERFORMANCE: Caching, asset optimization, database queries, API optimization
        3. INFRASTRUCTURE: Containerization, CI/CD configuration, environment setup
        4. RELIABILITY: Error handling, rate limiting, retry logic, fallback mechanisms
        5. COMPLIANCE: License compliance, documentation, test coverage
        6. COST: Resource usage, optimization opportunities
        
        For each issue found, provide:
        - A clear title describing the issue
        - A description explaining the problem
        - The exact file path where the issue was identified
        - Severity level (CRITICAL, HIGH, MEDIUM, LOW, INFO)
        - Appropriate category (SECURITY, PERFORMANCE, INFRASTRUCTURE, RELIABILITY, COMPLIANCE, COST)
        - Actionable steps to resolve the issue
        
        Format your response as a JSON array of recommendations following this structure:
        ```
        [
          {
            "title": "Hardcoded API Keys",
            "description": "API keys are hardcoded in the source code, which is a security risk.",
            "file_path": "path/to/file.js",
            "severity": "CRITICAL",
            "category": "SECURITY",
            "action_items": ["Move API keys to environment variables", "Use a secrets management solution"],
          }
        ]
        ```
        
        Focus on genuine deployment concerns rather than minor code style issues. Provide concrete, specific recommendations.
        """
        
        # Add the files to analyze
        prompt += "\n\nFiles to analyze:\n\n"
        
        for file in files:
            prompt += f"File: {file['path']}\n```\n{file['content']}\n```\n\n"
        
        # Add a reminder about the response format
        prompt += """
        Remember to return ONLY a valid JSON array of recommendations. Each recommendation should include all fields mentioned above.
        If no issues are found in a particular file, do not include it in the recommendations.
        """
        
        return prompt

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate the number of tokens in a text string.
        Very rough estimation - 1 token ~= 4 characters for English text.
        
        Args:
            text: The input text
            
        Returns:
            Estimated token count
        """
        return len(text) // 4
