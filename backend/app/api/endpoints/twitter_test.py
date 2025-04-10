from fastapi import APIRouter, HTTPException
import tweepy
import os
from dotenv import load_dotenv
import logging
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/twitter-test", tags=["twitter-test"])

# Twitter API credentials from environment variables
API_KEY = os.environ.get("TWITTER_API_KEY")
API_SECRET = os.environ.get("TWITTER_API_SECRET")
ACCESS_TOKEN = os.environ.get("TWITTER_ACCESS_TOKEN")
ACCESS_TOKEN_SECRET = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")
BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN")


class CredentialsTestResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None


@router.get("/test-credentials", response_model=CredentialsTestResponse)
async def test_twitter_credentials():
    """Test Twitter API credentials and return detailed information"""
    results = {}
    overall_success = True

    # Test OAuth 1.0a credentials (for tweeting)
    try:
        oauth1_client = tweepy.Client(
            consumer_key=API_KEY,
            consumer_secret=API_SECRET,
            access_token=ACCESS_TOKEN,
            access_token_secret=ACCESS_TOKEN_SECRET,
        )

        # Try to get user information (doesn't post anything)
        me = oauth1_client.get_me()
        results["oauth1"] = {
            "success": True,
            "user_id": me.data.id,
            "username": me.data.username,
        }
        logger.info(f"OAuth 1.0a credentials valid for user @{me.data.username}")
    except Exception as e:
        results["oauth1"] = {"success": False, "error": str(e)}
        overall_success = False
        logger.error(f"OAuth 1.0a credentials test failed: {e}")

    # Test Bearer Token (for streams and reading)
    try:
        bearer_client = tweepy.Client(bearer_token=BEARER_TOKEN)

        # Try to get a public tweet
        tweets = bearer_client.get_tweets(ids=["1"])
        results["bearer_token"] = {"success": True, "can_read_tweets": True}
        logger.info("Bearer token is valid")
    except Exception as e:
        results["bearer_token"] = {"success": False, "error": str(e)}
        overall_success = False
        logger.error(f"Bearer token test failed: {e}")

    # Test tweet creation (only if OAuth 1.0a is working)
    if results.get("oauth1", {}).get("success", False):
        try:
            response = oauth1_client.create_tweet(
                text="Test tweet from API credential check"
            )
            results["tweet_creation"] = {
                "success": True,
                "tweet_id": response.data["id"],
            }
            logger.info(
                f"Successfully created test tweet with ID: {response.data['id']}"
            )
        except Exception as e:
            results["tweet_creation"] = {"success": False, "error": str(e)}
            overall_success = False
            logger.error(f"Tweet creation test failed: {e}")

    # Check access level
    try:
        bearer_client = tweepy.Client(bearer_token=BEARER_TOKEN)
        # Try to access a v2 endpoint that requires Elevated access
        search = bearer_client.search_recent_tweets(query="twitter", max_results=10)
        results["access_level"] = {"success": True, "level": "Elevated or higher"}
        logger.info("Account has Elevated access or higher")
    except Exception as e:
        if "429" in str(e):
            results["access_level"] = {
                "success": False,
                "level": "Basic (rate limit exceeded)",
                "error": str(e),
            }
        else:
            results["access_level"] = {
                "success": False,
                "level": "Basic or restricted",
                "error": str(e),
            }
        logger.warning(f"Access level check indicates Basic access: {e}")

    # Prepare response
    if overall_success:
        message = "All Twitter API credentials are valid"
    else:
        message = "Some Twitter API credentials failed validation"

    return {"success": overall_success, "message": message, "details": results}
