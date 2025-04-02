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
                temperature=0.3
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
        Identify ONLY the 10-15 MOST CRITICAL deployment files from this list:
        {str(files)}
        
        Focus only on:
        - Security files (auth, env)
        - Files that may have important business logic
        - Infrastructure (Docker, CI/CD)
        - Config files
        - Main app entry points
        
        Ignore tests, docs, packages, and UI components.
        
        Return strictly JSON format: 
        {{"frontend": [], "backend": [], "infra": []}}
        Maximum 15 files total.
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
        
        prompt = """
        Analyze these files for deployment readiness issues in these categories:
        SECURITY, PERFORMANCE, INFRASTRUCTURE, RELIABILITY, COMPLIANCE, COST
        
        Return ONLY a JSON array of issues:
        [
          {
            "title": "Brief issue title",
            "description": "Concise problem description",
            "file_path": "path/to/file",
            "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
            "category": "SECURITY|PERFORMANCE|INFRASTRUCTURE|RELIABILITY|COMPLIANCE|COST",
            "action_items": ["Action 1", "Action 2"]
          }
        ]
        
        Focus ONLY on significant deployment issues. Ignore minor code style issues.
        """
        
        prompt += "\n\nFiles to analyze:\n\n"
        
        for file in files:
            prompt += f"File: {file['path']}\n```\n{file['content']}\n```\n\n"
        
        return prompt

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate the number of tokens in a text string.
        More accurate estimation - approx 4 chars per token for english text,
        but code and special characters often use more.
        
        Args:
            text: The input text
            
        Returns:
            Estimated token count
        """
        # More accurate token estimation
        # Count code blocks and special characters more heavily
        char_count = len(text)
        code_block_count = text.count("```")
        special_char_count = sum(1 for c in text if not c.isalnum() and not c.isspace())
        
        # Adjust for code blocks and special characters
        adjusted_count = char_count + (code_block_count * 5) + (special_char_count * 0.5)
        
        return int(adjusted_count // 3.5)  # Slightly more conservative than 4
