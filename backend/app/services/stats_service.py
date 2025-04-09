from typing import Optional, Dict
import redis.asyncio as redis_async 
import logging
import json

logger = logging.getLogger(__name__)

class StatService:
    # initialize with redis client
    def __init__(self, redis_client: Optional[redis_async.Redis] = None):
        self.redis_client = redis_client
        self.STATS_KEYS = {
            "repos": "deployable:stats:repos",
            "files": "deployable:stats:files",
            "recommendations": "deployable:stats:recommendations"
        }
        self.STATS_CHANNEL = "deployable:stats:updates"

    async def get_current_stats(self) -> Dict[str, int]:
        if not self.redis_client:
            return {
                "repos": 0,
                "files": 0,
                "recommendations": 0
            }        

        try:
            pipe = self.redis_client.pipeline()
            pipe.get(self.STATS_KEYS["repos"])
            pipe.get(self.STATS_KEYS["files"])
            pipe.get(self.STATS_KEYS["recommendations"])

            repos, files, recs = await pipe.execute()

            return {
                "repos": int(repos or 0),
                "files": int(files or 0),
                "recommendations": int(recs or 0)
            }
        except (ValueError, TypeError) as e:
            logger.error(f"Error converting Redis {str(e)}")
            return {
                "repos": 0,
                "files": 0,
                "recommendations": 0
            }

    async def increment_analysis_stats(self, num_files: int, num_recommendations):
        """Increments the repo stats"""
        if not self.redis_client:
            logger.info("Redis Async Client not configured")
            return
    
        pipe = self.redis_client.pipeline()
        pipe.incr("deployable:stats:repos")
        pipe.incrby("deployable:stats:files", num_files)
        pipe.incrby("deployable:stats:recommendations", num_recommendations)
        await pipe.execute()

        new_stats = await self.get_current_stats()
        message = json.dumps(new_stats)
        await self.redis_client.publish(self.STATS_CHANNEL, message)

