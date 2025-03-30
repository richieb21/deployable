import os
from openai import OpenAI
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from logging import getLogger

logger = getLogger(__name__)

load_dotenv()

class OpenAIService:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the OpenAI service with API key from env variables or parameter.
        
        Args:
            api_key: Optional API key, defaults to OPENAI_API_KEY environment variable
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            logger.error("No OpenAI API key provided")
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "o3-mini"
    
    def identify_files_to_analyze(self, prompt: str) -> str:
        """
        Analyze code snippets with GPT model and return recommendations.
        
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
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise
    
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
        Analyze the following list of file paths in a project and identify files that are important to determining whether an application is ready for deployment
        Focus on:
        1. Security concerns
        2. Scalability considerations
        3. Infrastructure requirements
        4. Deployment best practices

        {str(files)}
        
        Format your response as an array of file paths
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
    oai = OpenAIService()
    prompt = oai.identify_files_prompt(files)
    result = oai.identify_files_to_analyze(prompt)
    print(result)