import asyncio
import logging
import json
from app.services.stats_service import StatService

logger = logging.getLogger(__name__)
POLL_INTERVAL_SECONDS = 5.0

async def poll_stats_and_publish(stat_service: StatService):
    if not stat_service or not stat_service.redis_client:
        logger.error("StatService or Redis Client not initialized")
        return
    
    while True:
        try:
            current_stats = await stat_service.get_current_stats()
            message = json.dumps(current_stats)

            try:
                await stat_service.redis_client.publish(stat_service.STATS_CHANNEL, message)
            except Exception as e:
                logger.warning(f"Failed to publish stats: {str(e)}")

            await asyncio.sleep(POLL_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            logger.info("Stats polling background tasks cancelled")
            break
        except Exception as e:
            logger.error(f"Error in stats polling task loop: {str(e)}")
            try:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                 logger.info("Stats polling task cancelled during error recovery sleep.")
                 break