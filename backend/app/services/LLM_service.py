import os
from openai import OpenAI
import anthropic
from typing import List, Dict, Optional, Literal
from logging import getLogger
import re
from abc import ABC, abstractmethod
import hashlib
from app.core.dependencies import TTL_EXPIRATION
from app.core.config import settings

logger = getLogger(__name__)

class BaseLanguageModel(ABC):
    """Base class for language model services"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = None
        self.model = None
        self._initialize_client()

    @abstractmethod
    def _initialize_client(self):
        """Initialize the API client"""
        pass

    def _extract_json(self, text: str) -> str:
        """Extract JSON content from model response, ignoring text outside of triple backticks"""
        json_pattern = r"```(?:json)?\s*([\s\S]*?)```"
        matches = re.findall(json_pattern, text)

        if matches:
            return matches[0].strip()

        if text.strip().startswith("[") and text.strip().endswith("]"):
            return text.strip()

        return text

    def _build_prompt(
        self, code_snippets: List[Dict[str, str]], base_prompt: str
    ) -> str:
        """Build a prompt combining the base prompt and code snippets"""
        prompt = f"{base_prompt}\n\nHere are the code files to analyze:\n\n"
        for snippet in code_snippets:
            prompt += f"File: {snippet['filename']}\n```\n{snippet['content']}\n```\n\n"
        return prompt

    @abstractmethod
    def call_model(self, prompt: str) -> str:
        """Call the language model with a prompt"""
        pass

    def call_model_with_cache(self, prompt: str, redis_client=None):
        """Call the model with optional Redis caching"""
        if not settings.USE_REDIS or not redis_client:
            logger.info("Redis caching is disabled, calling model directly")
            return self.call_model(prompt)

        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
        cache_key = f"llm:{self.__class__.__name__}:{self.model}:{prompt_hash}"

        try:
            cached_response = redis_client.get(cache_key)
            if cached_response:
                return cached_response

            response = self.call_model(prompt)
            redis_client.set(cache_key, response, ex=TTL_EXPIRATION)
            return response
        except Exception as e:
            logger.warning(
                f"Redis cache operation failed: {str(e)}, falling back to direct model call"
            )
            return self.call_model(prompt)

    def identify_files_prompt(self, files):
        """Create a prompt to identify important deployment files"""
        prompt = f"""
        Identify ONLY the 10-15 MOST CRITICAL deployment files from this list:
        {str(files)}
        
        Focus only on:
        - Security files (auth, env)
        - Files that may have important business logic
        - Infrastructure (Docker, CI/CD)
        - Config files
        - Main app entry points
        
        Ignore tests, docs, packages, and non-essential UI components. Absolutely do not add any comments, just list the files
        
        Return strictly JSON format: 
        {{"frontend": [], "backend": [], "infra": []}}
        Maximum 15 files total.
        """
        return prompt

    def get_tech_stack_prompt(self, files):
        """Create a prompt to extract the tech stack"""
        prompt = f"""
        Analyze these files and identify the main technologies used:
        {str(files)}

        Return strictly in this JSON format:
        {{
            "frontend": [],  # Frontend technologies with versions when available (e.g. "React 18.2", "Next.js 14")
            "backend": [],   # Backend technologies with versions when available (e.g. "Python 3.9", "FastAPI 0.100")
            "infra": []     # Infrastructure technologies (e.g. "Docker", "GitHub Actions")
        }}

        Rules:
        1. Include version numbers when clearly identifiable
        2. Only include technologies that are definitively present in the files
        3. List maximum 5 most important technologies per category
        4. Focus on production dependencies, ignore dev dependencies
        5. Provide ONLY THE JSON, no justifications
        """
        return prompt

    def get_file_analysis_prompt(self, files):
        """Create a prompt for analyzing file contents with refined focus"""
        prompt = """
        You are analyzing code files to identify **significant deployment readiness issues**. Your goal is to provide actionable recommendations that directly impact the successful and stable deployment of this application.

        Focus ONLY on issues within these categories:
        SECURITY, PERFORMANCE, INFRASTRUCTURE, RELIABILITY, COMPLIANCE, COST

        Use the following severity levels with these **strict** meanings:
        - **CRITICAL**: **ONLY** issues that will **definitely prevent deployment** or cause **immediate, catastrophic failure or major security breach** (e.g., hardcoded production secrets in code, fatally incorrect Dockerfile command, SQL injection vulnerability in public endpoint). Be very conservative with this level.
        - **HIGH**: **ONLY** issues that pose a **clear and present danger** to production stability, security, or performance if deployed (e.g., missing essential input validation on critical APIs, N+1 database query in a core feature, no error handling on vital external calls, potential secrets leak via verbose errors). **Do NOT use HIGH for general best practice violations, missing comments, minor config tweaks, or potential future problems.**
        - **MEDIUM**: Important best practices violations that could lead to future problems, introduce moderate security risks, or noticeably degrade performance/reliability under load (e.g., missing rate limiting, inadequate logging for key operations, slightly suboptimal caching, using deprecated library versions without known critical flaws). This should be used for most standard recommendations.
        - **LOW**: Minor improvements, suggestions for better maintainability, or adherence to best practices with less immediate impact (e.g., dependency updates for non-critical flaws, minor config optimizations, code clarity suggestions).
        - **INFO**: Observations or points of interest that don't necessarily require action but are relevant context.

        **IMPORTANT INSTRUCTIONS:**
        1.  **Be Conservative with Severity:** Critically evaluate if an issue truly warrants CRITICAL or HIGH severity based on the strict definitions above. **When in doubt, prefer MEDIUM or LOW.** Avoid exaggerating the impact of findings.
        2.  **Prioritize Blocking Issues:** Focus primarily on problems that would actively block a deployment or cause immediate, significant issues post-deployment.
        3.  **Ignore Trivial Matters:** Do NOT report minor code style issues, formatting, naming preferences, missing comments, or lack of documentation unless it directly causes a functional or security bug.
        4.  **Actionability is Key:** Ensure each identified issue has clear, actionable steps for resolution.
        5.  **Context Matters:** Assume standard libraries are functional unless their *configuration* or *usage* poses a specific deployment risk. Don't flag theoretical "what-ifs" unless there's concrete evidence in the code.
        6.  **Be Concise:** Provide brief titles and descriptions.

        Return ONLY a valid JSON array of issues in the following format. Do not include any other text or explanations outside the JSON structure:
        [
          {
            "title": "Brief issue title (Max 10 words)",
            "description": "Concise problem description focusing on deployment impact (Max 3 sentences)",
            "file_path": "path/to/relevant/file",
            "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
            "category": "SECURITY|PERFORMANCE|INFRASTRUCTURE|RELIABILITY|COMPLIANCE|COST",
            "action_items": ["Specific Action 1", "Specific Action 2"]
          }
          // ... more issues if found
        ]
        """
        prompt += "\n\nFiles to analyze:\n\n"
        for file in files:
            path = file.get(
                "path", file.get("filename", "unknown_file")
            )  # Handle potential key differences
            content = file.get("content", "")
            prompt += f"File: {path}\n```\n{content}\n```\n\n"
        return prompt


class DeepseekService(BaseLanguageModel):
    """Deepseek-specific implementation"""

    def _initialize_client(self):
        self.api_key = self.api_key or os.getenv("DEEPSEEK_API_KEY")
        if not self.api_key:
            logger.error("No Deepseek API key provided")
            raise ValueError("DEEPSEEK_API_KEY environment variable not set")

        self.client = OpenAI(api_key=self.api_key, base_url="https://api.deepseek.com")
        self.model = "deepseek-chat"

    def call_model(self, prompt: str) -> str:
        messages = [
            {
                "role": "system",
                "content": "You are a staff engineer who is amazing at making deployment ready applications.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, temperature=0.3
            )
            raw_content = response.choices[0].message.content
            return self._extract_json(raw_content)
        except Exception as e:
            logger.error(f"Error calling Deepseek API: {str(e)}")
            raise


class OpenAIService(BaseLanguageModel):
    """OpenAI-specific implementation"""

    def _initialize_client(self):
        self.api_key = self.api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            logger.error("No OpenAI API key provided")
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4o"

    def call_model(self, prompt: str) -> str:
        messages = [
            {
                "role": "system",
                "content": "You are a staff engineer who is amazing at making deployment ready applications.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, temperature=0.3
            )
            raw_content = response.choices[0].message.content
            return self._extract_json(raw_content)
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise


class GroqService(BaseLanguageModel):
    """Groq Implementation"""

    def _initialize_client(self):
        self.api_key = self.api_key or settings.GROQ_API_KEY
        if not self.api_key:
            logger.error("No Groq API key provided")
            raise ValueError("GROQ_API_KEY environment variable not set")

        self.client = OpenAI(
            api_key=self.api_key, base_url="https://api.groq.com/openai/v1"
        )
        self.model = "llama-3.1-8b-instant"

    def call_model(self, prompt: str):
        messages = [
            {
                "role": "system",
                "content": "You are a staff engineer who is amazing at making deployment ready applications.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, temperature=0.3
            )
            raw_content = response.choices[0].message.content
            logger.info(f"Raw LLM response: {raw_content}")
            extracted = self._extract_json(raw_content)
            logger.info(f"Extracted JSON: {extracted}")
            return extracted
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise


class ClaudeService(BaseLanguageModel):
    """Claude Sonnet Implementation"""

    def _initialize_client(self):
        self.api_key = self.api_key or settings.CLAUDE_API_KEY
        if not self.api_key:
            logger.error("No Claude API key provided")
            raise ValueError("CLAUDE_API_KEY environment variable not set")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-3-7-sonnet-20250219"

    def call_model(self, prompt: str):
        messages = [{"role": "user", "content": prompt}]

        try:
            response = self.client.messages.create(
                model=self.model, messages=messages, max_tokens=1024
            )
            raw_content = response.content[0].text
            logger.info(raw_content)
            return self._extract_json(raw_content)
        except Exception as e:
            logger.error(f"Error calling Claude API: {str(e)}")
            raise


class QuasarService(BaseLanguageModel):
    """OpenRouter Quasar Implementation"""

    def _initialize_client(self):
        self.api_key = self.api_key or settings.OPENROUTER_API_KEY
        if not self.api_key:
            logger.error("No OpenRouter API key provided")
            raise ValueError("OPENROUTER_API_KEY environment variable not set")

        self.client = OpenAI(
            api_key=self.api_key, base_url="https://openrouter.ai/api/v1"
        )
        self.model = "openrouter/quasar-alpha"

    def call_model(self, prompt: str):
        messages = [
            {
                "role": "system",
                "content": "You are a staff engineer who is amazing at making deployment ready applications.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
            )
            raw_content = response.choices[0].message.content
            logger.info(f"Raw LLM response: {raw_content}")
            extracted = self._extract_json(raw_content)
            logger.info(f"Extracted JSON: {extracted}")
            return extracted
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            raise


# Fallback to deepseek bc its cheap lol
def create_language_service(
    provider: Literal["deepseek", "openai", "groq", "claude", "quasar"] = "deepseek",
    api_key: Optional[str] = None,
) -> BaseLanguageModel:
    """Factory function to create the appropriate language model service"""
    if provider == "deepseek":
        return DeepseekService(api_key)
    elif provider == "openai":
        return OpenAIService(api_key)
    elif provider == "groq":
        return GroqService()
    elif provider == "claude":
        return ClaudeService()
    elif provider == "quasar":
        return QuasarService()
