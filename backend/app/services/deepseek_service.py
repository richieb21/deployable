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
        3. Dependency management (package.json, requirements.txt)
        4. Environment setup (.env files, config)
        5. Main application entry points

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


# Example usage 
if __name__ == "__main__":
    files = ['.gitignore', 'marketloo/.env.example', 'marketloo/.gitignore', 'marketloo/README.md', 'marketloo/agents/common/utils.ts', 'marketloo/agents/simple_trader/markets.json', 'marketloo/agents/simple_trader/package-lock.json', 'marketloo/agents/simple_trader/package.json', 'marketloo/agents/simple_trader/src/index.ts', 'marketloo/agents/simple_trader/tsconfig.json', 'marketloo/agents/thoughtful_trader/markets.json', 'marketloo/agents/thoughtful_trader/package-lock.json', 'marketloo/agents/thoughtful_trader/package.json', 'marketloo/agents/thoughtful_trader/src/index.ts', 'marketloo/agents/thoughtful_trader/tsconfig.json', 'marketloo/ai/.gitignore', 'marketloo/ai/README.md', 'marketloo/ai/project_data/links.json', 'marketloo/ai/project_data/match_project_prize.py', 'marketloo/ai/project_data/prizes.json', 'marketloo/ai/project_data/project_data_scraper.py', 'marketloo/ai/project_data/projects_data.json', 'marketloo/ai/project_data/readme.md', 'marketloo/ai/project_data/scraper.py', 'marketloo/ai/project_data/tracks.py', 'marketloo/ai/scraper/ai/scraper/data/final.json', 'marketloo/ai/scraper/ai/scraper/data/new_final.json', 'marketloo/ai/scraper/ai/scraper/data/parsed_projects.json', 'marketloo/ai/scraper/ai/scraper/data/project_details.json', 'marketloo/ai/scraper/ai/scraper/data/projects.json', 'marketloo/ai/scraper/ai/scraper/data/projects.txt', 'marketloo/ai/scraper/ai/scraper/data/tracks.json', 'marketloo/ai/scraper/parse.py', 'marketloo/ai/scraper/parse_projects.py', 'marketloo/ai/scraper/projects.py', 'marketloo/ai/scraper/scraped_pages/brainrot_jia_seed_hackathon_devpost_com__20250113_235300.html', 'marketloo/ai/scraper/test.py', 'marketloo/ai/scraper/test_tracks.py', 'marketloo/ai/scraper/url.py', 'marketloo/ai/todo.txt', 'marketloo/app/(auth-pages)/forgot-password/page.tsx', 'marketloo/app/(auth-pages)/layout.tsx', 'marketloo/app/(auth-pages)/sign-in/page.tsx', 'marketloo/app/(auth-pages)/sign-up/page.tsx', 'marketloo/app/(auth-pages)/smtp-message.tsx', 'marketloo/app/actions.ts', 'marketloo/app/api/agents/auth/route.ts', 'marketloo/app/api/cron/price-maintenance/route.ts', 'marketloo/app/api/market-summary/route.ts', 'marketloo/app/api/markets/create/route.ts', 'marketloo/app/api/orders/route.ts', 'marketloo/app/api/price-history/route.ts', 'marketloo/app/api/resolve/route.ts', 'marketloo/app/auth/callback/route.ts', 'marketloo/app/favicon.ico', 'marketloo/app/globals.css', 'marketloo/app/layout.tsx', 'marketloo/app/market/[id]/page.tsx', 'marketloo/app/opengraph-image.png', 'marketloo/app/page.tsx', 'marketloo/app/protected/page.tsx', 'marketloo/app/protected/reset-password/page.tsx', 'marketloo/app/providers.tsx', 'marketloo/app/testing/page.tsx', 'marketloo/app/testing/price-history/route.ts', 'marketloo/app/twitter-image.png', 'marketloo/components.json', 'marketloo/components/ActivityFeed.tsx', 'marketloo/components/LandingActivityFeed.tsx', 'marketloo/components/LeaderboardContent.tsx', 'marketloo/components/MarketChart.tsx', 'marketloo/components/MarketIcon.tsx', 'marketloo/components/MarketSummary.tsx', 'marketloo/components/MarketTrading.tsx', 'marketloo/components/NavigationTabs.tsx', 'marketloo/components/OrderSubscription.tsx', 'marketloo/components/ProfileContent.tsx', 'marketloo/components/ProfileStats.tsx', 'marketloo/components/TopBar.tsx', 'marketloo/components/TradeContent.tsx', 'marketloo/components/deploy-button.tsx', 'marketloo/components/env-var-warning.tsx', 'marketloo/components/form-message.tsx', 'marketloo/components/header-auth.tsx', 'marketloo/components/hero.tsx', 'marketloo/components/next-logo.tsx', 'marketloo/components/submit-button.tsx', 'marketloo/components/supabase-logo.tsx', 'marketloo/components/theme-switcher.tsx', 'marketloo/components/tutorial/code-block.tsx', 'marketloo/components/tutorial/connect-supabase-steps.tsx', 'marketloo/components/tutorial/fetch-data-steps.tsx', 'marketloo/components/tutorial/sign-up-user-steps.tsx', 'marketloo/components/tutorial/tutorial-step.tsx', 'marketloo/components/typography/inline-code.tsx', 'marketloo/components/ui/badge.tsx', 'marketloo/components/ui/button.tsx', 'marketloo/components/ui/checkbox.tsx', 'marketloo/components/ui/dropdown-menu.tsx', 'marketloo/components/ui/input.tsx', 'marketloo/components/ui/label.tsx', 'marketloo/lib/utils.ts', 'marketloo/middleware.ts', 'marketloo/next.config.ts', 'marketloo/package-lock.json', 'marketloo/package.json', 'marketloo/plan_for_graphs.txt', 'marketloo/postcss.config.js', 'marketloo/sql/add_balance.sql', 'marketloo/sql/create_superbowl_market.sql', 'marketloo/sql/create_test_market.sql', 'marketloo/sql/create_timeseries_tables.sql', 'marketloo/sql/create_trump_market.sql', 'marketloo/sql/full_schema.sql', 'marketloo/sql/increment_number.sql', 'marketloo/sql/multi_option.sql', 'marketloo/sql/reset_user.sql', 'marketloo/tailwind.config.ts', 'marketloo/todo.txt', 'marketloo/tsconfig.json', 'marketloo/types/market.ts', 'marketloo/utils/mockData.ts', 'marketloo/utils/supabase/check-env-vars.ts', 'marketloo/utils/supabase/client.ts', 'marketloo/utils/supabase/middleware.ts', 'marketloo/utils/supabase/server.ts', 'marketloo/utils/utils.ts', 'marketloo/vercel.json']
    file_contents = [
        {
            "path" : "marketloo/ai/project_data/scraper.py",
            "content" : """import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def scrape_links(base_url):
    driver = None
    try:
        # Set up Selenium WebDriver with Chrome
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode for performance
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

        all_links = []
        page = 1
        
        while True:
            url = f"{base_url}?page={page}"
            try:
                driver.get(url)
                a_tags = driver.find_elements(By.CLASS_NAME, "link-to-software")
                
                # If no links found, we've reached the end
                if not a_tags:
                    break
                    
                page_links = [a.get_attribute("href") for a in a_tags if a.get_attribute("href")]
                all_links.extend(page_links)
                print(f"Page {page}: Found {len(page_links)} links")
                
                page += 1
                
            except Exception as e:
                print(f"Error on page {page}: {e}")
                break

        # Save all collected links
        with open("links.json", "w") as json_file:
            json.dump(all_links, json_file, indent=4)

        print(f"Total scraped: {len(all_links)} links. Saved to 'links.json'.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Quit the WebDriver
        if driver:
            driver.quit()

# Example usage
if __name__ == "__main__":
    base_url = "https://hackthenorth2024.devpost.com/project-gallery"
    scrape_links(base_url)
"""
        }
    ]

    files = ['.gitignore', 'marketloo/.env.example', 'marketloo/.gitignore', 'marketloo/README.md', 'marketloo/agents/common/utils.ts', 'marketloo/agents/simple_trader/markets.json', 'marketloo/agents/simple_trader/package-lock.json', 'marketloo/agents/simple_trader/package.json', 'marketloo/agents/simple_trader/src/index.ts', 'marketloo/agents/simple_trader/tsconfig.json', 'marketloo/agents/thoughtful_trader/markets.json', 'marketloo/agents/thoughtful_trader/package-lock.json', 'marketloo/agents/thoughtful_trader/package.json', 'marketloo/agents/thoughtful_trader/src/index.ts', 'marketloo/agents/thoughtful_trader/tsconfig.json', 'marketloo/ai/.gitignore', 'marketloo/ai/README.md', 'marketloo/ai/project_data/links.json', 'marketloo/ai/project_data/match_project_prize.py', 'marketloo/ai/project_data/prizes.json', 'marketloo/ai/project_data/project_data_scraper.py', 'marketloo/ai/project_data/projects_data.json', 'marketloo/ai/project_data/readme.md', 'marketloo/ai/project_data/scraper.py', 'marketloo/ai/project_data/tracks.py', 'marketloo/ai/scraper/ai/scraper/data/final.json', 'marketloo/ai/scraper/ai/scraper/data/new_final.json', 'marketloo/ai/scraper/ai/scraper/data/parsed_projects.json', 'marketloo/ai/scraper/ai/scraper/data/project_details.json', 'marketloo/ai/scraper/ai/scraper/data/projects.json', 'marketloo/ai/scraper/ai/scraper/data/projects.txt', 'marketloo/ai/scraper/ai/scraper/data/tracks.json', 'marketloo/ai/scraper/parse.py', 'marketloo/ai/scraper/parse_projects.py', 'marketloo/ai/scraper/projects.py', 'marketloo/ai/scraper/scraped_pages/brainrot_jia_seed_hackathon_devpost_com__20250113_235300.html', 'marketloo/ai/scraper/test.py', 'marketloo/ai/scraper/test_tracks.py', 'marketloo/ai/scraper/url.py', 'marketloo/ai/todo.txt', 'marketloo/app/(auth-pages)/forgot-password/page.tsx', 'marketloo/app/(auth-pages)/layout.tsx', 'marketloo/app/(auth-pages)/sign-in/page.tsx', 'marketloo/app/(auth-pages)/sign-up/page.tsx', 'marketloo/app/(auth-pages)/smtp-message.tsx', 'marketloo/app/actions.ts', 'marketloo/app/api/agents/auth/route.ts', 'marketloo/app/api/cron/price-maintenance/route.ts', 'marketloo/app/api/market-summary/route.ts', 'marketloo/app/api/markets/create/route.ts', 'marketloo/app/api/orders/route.ts', 'marketloo/app/api/price-history/route.ts', 'marketloo/app/api/resolve/route.ts', 'marketloo/app/auth/callback/route.ts', 'marketloo/app/favicon.ico', 'marketloo/app/globals.css', 'marketloo/app/layout.tsx', 'marketloo/app/market/[id]/page.tsx', 'marketloo/app/opengraph-image.png', 'marketloo/app/page.tsx', 'marketloo/app/protected/page.tsx', 'marketloo/app/protected/reset-password/page.tsx', 'marketloo/app/providers.tsx', 'marketloo/app/testing/page.tsx', 'marketloo/app/testing/price-history/route.ts', 'marketloo/app/twitter-image.png', 'marketloo/components.json', 'marketloo/components/ActivityFeed.tsx', 'marketloo/components/LandingActivityFeed.tsx', 'marketloo/components/LeaderboardContent.tsx', 'marketloo/components/MarketChart.tsx', 'marketloo/components/MarketIcon.tsx', 'marketloo/components/MarketSummary.tsx', 'marketloo/components/MarketTrading.tsx', 'marketloo/components/NavigationTabs.tsx', 'marketloo/components/OrderSubscription.tsx', 'marketloo/components/ProfileContent.tsx', 'marketloo/components/ProfileStats.tsx', 'marketloo/components/TopBar.tsx', 'marketloo/components/TradeContent.tsx', 'marketloo/components/deploy-button.tsx', 'marketloo/components/env-var-warning.tsx', 'marketloo/components/form-message.tsx', 'marketloo/components/header-auth.tsx', 'marketloo/components/hero.tsx', 'marketloo/components/next-logo.tsx', 'marketloo/components/submit-button.tsx', 'marketloo/components/supabase-logo.tsx', 'marketloo/components/theme-switcher.tsx', 'marketloo/components/tutorial/code-block.tsx', 'marketloo/components/tutorial/connect-supabase-steps.tsx', 'marketloo/components/tutorial/fetch-data-steps.tsx', 'marketloo/components/tutorial/sign-up-user-steps.tsx', 'marketloo/components/tutorial/tutorial-step.tsx', 'marketloo/components/typography/inline-code.tsx', 'marketloo/components/ui/badge.tsx', 'marketloo/components/ui/button.tsx', 'marketloo/components/ui/checkbox.tsx', 'marketloo/components/ui/dropdown-menu.tsx', 'marketloo/components/ui/input.tsx', 'marketloo/components/ui/label.tsx', 'marketloo/lib/utils.ts', 'marketloo/middleware.ts', 'marketloo/next.config.ts', 'marketloo/package-lock.json', 'marketloo/package.json', 'marketloo/plan_for_graphs.txt', 'marketloo/postcss.config.js', 'marketloo/sql/add_balance.sql', 'marketloo/sql/create_superbowl_market.sql', 'marketloo/sql/create_test_market.sql', 'marketloo/sql/create_timeseries_tables.sql', 'marketloo/sql/create_trump_market.sql', 'marketloo/sql/full_schema.sql', 'marketloo/sql/increment_number.sql', 'marketloo/sql/multi_option.sql', 'marketloo/sql/reset_user.sql', 'marketloo/tailwind.config.ts', 'marketloo/todo.txt', 'marketloo/tsconfig.json', 'marketloo/types/market.ts', 'marketloo/utils/mockData.ts', 'marketloo/utils/supabase/check-env-vars.ts', 'marketloo/utils/supabase/client.ts', 'marketloo/utils/supabase/middleware.ts', 'marketloo/utils/supabase/server.ts', 'marketloo/utils/utils.ts', 'marketloo/vercel.json']
    deepseek = DeepseekService()
    prompt = deepseek.identify_files_prompt(files)
    result = deepseek.call_model(prompt)

    print(json.loads(result))
