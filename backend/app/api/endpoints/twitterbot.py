from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import tweepy
import requests
import os
from dotenv import load_dotenv
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel
import asyncio
import re

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/twitter", tags=["twitter"])

# Twitter API credentials from environment variables
API_KEY = os.environ.get("TWITTER_API_KEY")
API_SECRET = os.environ.get("TWITTER_API_SECRET")
ACCESS_TOKEN = os.environ.get("TWITTER_ACCESS_TOKEN")
ACCESS_TOKEN_SECRET = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")
BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN")

# Your endpoint URL from environment variable
TEST_URL = os.environ.get("TEST_URL")

# Your bot's Twitter handle from environment variable
BOT_HANDLE = os.environ.get("BOT_HANDLE")

# Authenticate with Twitter
auth = tweepy.OAuth1UserHandler(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
api = tweepy.API(auth)
client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET,
)

# Global variable to store the stream instance
stream_instance = None


# Custom Stream class to listen for mentions
class MentionStream(tweepy.StreamingClient):
    def on_tweet(self, tweet):
        # Check if the tweet mentions your bot
        if BOT_HANDLE.lower().replace("@", "") in tweet.text.lower():
            logger.info(f"Mention detected: {tweet.text}")

            # Try to extract a GitHub repository URL from the tweet
            github_url_pattern = r"https?://github\.com/[\w-]+/[\w.-]+"
            repo_urls = re.findall(github_url_pattern, tweet.text)

            if repo_urls:
                repo_url = repo_urls[0]  # Use the first GitHub URL found
                logger.info(f"Found repository URL in tweet: {repo_url}")
            else:
                # Default repository if none is provided
                repo_url = "https://github.com/richieb21/deployable"
                logger.info(
                    f"No repository URL found in tweet, using default: {repo_url}"
                )

            # Prepare data to send to the key files endpoint
            payload = {"repo_url": repo_url}

            # Send POST request to the key files endpoint
            try:
                response = requests.post(TEST_URL, json=payload)
                response.raise_for_status()  # Raise an error if the request fails

                # Parse the JSON response
                key_files_data = response.json()

                # Format a simple response with the number of key files found
                frontend_count = len(
                    key_files_data.get("key_files", {}).get("frontend", [])
                )
                backend_count = len(
                    key_files_data.get("key_files", {}).get("backend", [])
                )
                infra_count = len(key_files_data.get("key_files", {}).get("infra", []))

                reply_text = f"I analyzed {repo_url} and found {frontend_count} frontend files, {backend_count} backend files, and {infra_count} infrastructure files."
            except requests.exceptions.RequestException as e:
                reply_text = f"Sorry, something went wrong while analyzing the repository: {str(e)[:100]}"
                logger.error(f"Error with endpoint: {e}")

            # Reply to the tweet
            try:
                client.create_tweet(text=reply_text, in_reply_to_tweet_id=tweet.id)
                logger.info(f"Replied with: {reply_text}")
            except tweepy.TweepyException as e:
                logger.error(f"Error tweeting: {e}")

    def on_errors(self, errors):
        logger.error(f"Stream errors: {errors}")
        return True  # Keep the stream alive

    def on_exception(self, exception):
        logger.error(f"Stream exception: {exception}")
        return True  # Keep the stream alive


# Request and response models
class TweetRequest(BaseModel):
    text: str
    reply_to_id: Optional[str] = None


class TweetResponse(BaseModel):
    id: str
    text: str
    created_at: str


def start_stream_listener():
    """Start the Twitter stream listener in the background"""
    global stream_instance
    try:
        logger.info("Starting Twitter stream listener")

        # Check if all required credentials are available
        if not all(
            [API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET, BEARER_TOKEN]
        ):
            logger.error("One or more Twitter API credentials are missing")
            return

        # Validate bearer token with a simple API call first
        try:
            test_client = tweepy.Client(bearer_token=BEARER_TOKEN)
            test_client.get_user(username="twitter")  # Simple test call
            logger.info("Bearer token validated successfully")
        except Exception as e:
            logger.error(f"Bearer token validation failed: {e}")
            logger.error(
                "Please ensure your Twitter API credentials are associated with a Project in the Developer Portal"
            )
            return

        stream_instance = MentionStream(bearer_token=BEARER_TOKEN)

        # Clear existing rules
        rules = stream_instance.get_rules()
        if rules.data:
            rule_ids = [rule.id for rule in rules.data]
            stream_instance.delete_rules(rule_ids)

        # Add new rule to track mentions of the bot
        bot_handle_clean = BOT_HANDLE.replace("@", "")
        stream_instance.add_rules(tweepy.StreamRule(f"@{bot_handle_clean}"))

        # Start filtering in a separate thread
        import threading

        thread = threading.Thread(
            target=stream_instance.filter, kwargs={"threaded": True}, daemon=True
        )
        thread.start()
        logger.info(
            f"Twitter stream listener started successfully, tracking mentions of @{bot_handle_clean}"
        )
    except tweepy.TweepyException as e:
        logger.error(f"Twitter API error in stream: {e}")
        if "403" in str(e):
            logger.error(
                "This is likely due to incorrect API credentials or insufficient permissions."
            )
            logger.error(
                "Ensure your Twitter API credentials are associated with a Project in the Developer Portal"
            )
        elif "429" in str(e):
            logger.error("Rate limit exceeded. Consider implementing backoff strategy.")
    except Exception as e:
        logger.error(f"Error in Twitter stream: {e}")

# Don't start the stream listener automatically on import
# start_stream_listener()

# Add init function that will be called when the router is included
def init_twitter():
    """Initialize Twitter functionality when router is included"""
    start_stream_listener()

@router.post("/tweet", response_model=TweetResponse)
async def send_tweet(request: TweetRequest):
    """Send a tweet, optionally as a reply to another tweet"""
    try:
        logger.info(f"Sending tweet: {request.text}")

        # Create tweet parameters
        tweet_params = {"text": request.text}
        if request.reply_to_id:
            tweet_params["in_reply_to_tweet_id"] = request.reply_to_id

        # Send the tweet
        response = client.create_tweet(**tweet_params)

        tweet_data = response.data
        logger.info(f"Tweet sent successfully with ID: {tweet_data['id']}")

        return {
            "id": tweet_data["id"],
            "text": request.text,
            "created_at": str(tweet_data.get("created_at", "")),
        }
    except tweepy.TweepyException as e:
        logger.error(f"Twitter API error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to send tweet: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send tweet: {str(e)}")


@router.get("/stream-status")
async def get_stream_status():
    """Check if the Twitter stream is currently running"""
    global stream_instance
    if stream_instance is not None:
        return {"status": "running"}
    else:
        return {"status": "not running"}


@router.post("/restart-stream", status_code=202)
async def restart_stream():
    """Restart the Twitter stream listener"""
    global stream_instance
    try:
        # Stop existing stream if it exists
        if stream_instance is not None:
            logger.info("Stopping existing Twitter stream")
            stream_instance.disconnect()

        # Start a new stream
        start_stream_listener()
        return {"status": "Stream listener restarted"}
    except Exception as e:
        logger.error(f"Failed to restart Twitter stream: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to restart Twitter stream: {str(e)}"
        )
