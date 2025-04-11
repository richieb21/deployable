from fastapi import APIRouter, WebSocket, Depends
from starlette.websockets import WebSocketState
from app.core.dependencies import get_redis_async_client
from app.services.stats_service import StatService
import redis.asyncio as redis_async
import logging


router = APIRouter()
logger = logging.getLogger(__name__)

POLLING_INTERVAL = 5.0

@router.websocket("/ws/stats")
async def stats_websocket(
    websocket: WebSocket,
    redis_client: redis_async.Redis = Depends(get_redis_async_client),
):
    pubsub = None
    is_connected = False
    stats_service = StatService(redis_client=redis_client)

    try:
        await websocket.accept()
        is_connected = True

        logger.info("Websocket connection accepted for stats pub/sub")
    
        initial_stats = await stats_service.get_current_stats()
        await websocket.send_json(initial_stats)

        try:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(stats_service.STATS_CHANNEL)
        except Exception as e:
            logger.error(f"Failed to subscribe to REDIS channel: {str(e)}")
            await websocket.close(code=1011, reason="Failed to subscribe")
            return
        
        while True:
            if websocket.client_state != WebSocketState.CONNECTED:
                logger.info("Webscoekt disconneded")
                break

            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=5.0)
                if message and message["type"] == "message":
                    try:
                        stats_data = message["data"]
                        if websocket.client_state == WebSocketState.CONNECTED:
                            await websocket.send_text(stats_data)
                        else:
                            break
                    except Exception as e:
                        logger.error(f"Error processing/sending message: {str(e)}")
                        break
            except Exception as e:
                logger.error(f"Error in Redis pub sub loop: {str(e)}")
                break
    except Exception as e:
        logger.error(f"Websocket error during setup or initial send: {str(e)}")
    finally:
        await pubsub.unsubscribe(stats_service.STATS_CHANNEL)
        await pubsub.close()

        if is_connected and websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close()