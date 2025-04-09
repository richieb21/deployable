from fastapi import APIRouter, WebSocket, Depends
from app.core.dependencies import get_redis_async_client
import redis.asyncio as redis_async
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/stats")
async def stats_websocket(
    websocket: WebSocket,
    redis_client: redis_async.Redis = Depends(get_redis_async_client)
):
    try:
        await websocket.accept()

        try:
            pipe = redis_client.pipeline()
            pipe.get("deployable:stats:repos")
            pipe.get("deployable:stats:files")
            pipe.get("deployable:stats:recommendations")
            
            repos, files, recs = await pipe.execute()
            
            stats = {
                "repos": int(repos or 0),
                "files": int(files or 0),
                "recommendations": int(recs or 0)
            }
            
            await websocket.send_json(stats)
        except Exception as e:
            logger.error(f"Error sending initial stats: {str(e)}")
            await websocket.close(code=1011, reason="Failed to get initial stats")
            return

        # Setup Redis PubSub with correct channel
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("deployable:stats:updates") 

        while True:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if message and message["type"] == "message":
                    stats = json.loads(message["data"])
                    await websocket.send_json(stats)
            except Exception as e:
                logger.error(f"Error in message loop: {str(e)}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        if pubsub:
            try:
                await pubsub.unsubscribe("deployable:stats:updates")  # Use correct channel
            except Exception as e:
                logger.error(f"Error unsubscribing: {str(e)}")
        try:
            await websocket.close()
        except Exception as e:
            logger.error(f"Error closing websocket: {str(e)}")
        logger.info("WebSocket connection closed")