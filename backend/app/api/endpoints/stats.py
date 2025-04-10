from fastapi import APIRouter, WebSocket, Depends
from starlette.websockets import WebSocketState
from app.core.dependencies import get_redis_async_client
import redis.asyncio as redis_async
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/stats")
async def stats_websocket(
    websocket: WebSocket,
    redis_client: redis_async.Redis = Depends(get_redis_async_client),
):
    pubsub = None
    is_closing = False

    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")

        try:
            pipe = redis_client.pipeline()
            pipe.get("deployable:stats:repos")
            pipe.get("deployable:stats:files")
            pipe.get("deployable:stats:recommendations")

            repos, files, recs = await pipe.execute()

            stats = {
                "repos": int(repos or 0),
                "files": int(files or 0),
                "recommendations": int(recs or 0),
            }

            await websocket.send_json(stats)
        except Exception as e:
            logger.error(f"Error sending initial stats: {str(e)}")
            await websocket.close(code=1011, reason="Failed to get initial stats")
            return

        # subscribe to the channel and propagate notification to frontend connections
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("deployable:stats:updates")

        while not is_closing:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if message and message["type"] == "message":
                    try:
                        stats = json.loads(message["data"])
                        await websocket.send_json(stats)
                    except Exception as e:
                        logger.error(f"Error sending message: {str(e)}")
                        is_closing = True
                        break
            except Exception as e:
                logger.error(f"Error in message loop: {str(e)}")
                is_closing = True
                break

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:  # clean up
        is_closing = True
        if pubsub:
            try:
                await pubsub.unsubscribe("deployable:stats:updates")
                await pubsub.close()
            except Exception as e:
                logger.error(f"Error unsubscribing: {str(e)}")
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
        except Exception as e:
            logger.error(f"Error closing websocket: {str(e)}")
        logger.info("WebSocket connection closed")
