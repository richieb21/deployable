import redis
import redis.asyncio as redis_async
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

"""Cache Expiration"""
TTL_EXPIRATION = (
    30 * 60
)  # 30 minutes, honestly idk what to make this lol. I assume people don't make many changes in 30 minutes before they check again?

"""Initialize the connection pool"""
try:
    redis_pool = redis.ConnectionPool(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=5.0,
    )
    # Test the connection immediately
    test_client = redis.Redis(connection_pool=redis_pool)
    test_client.ping()
    logger.info(
        f"Redis connection pool initialized and tested at {settings.REDIS_HOST}:{settings.REDIS_PORT}"
    )
except Exception as e:
    logger.error(f"Redis pool initialization failed: {str(e)}")
    redis_pool = None

"""Add async connection pool"""
try:
    redis_async_pool = redis_async.ConnectionPool(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=2.0,
    )
    logger.info(f"Async Redis connection pool initialized")
except Exception as e:
    logger.error(f"Async Redis pool initialization failed: {str(e)}")
    redis_async_pool = None


def get_redis_client():
    """Gets a Redis client connected to the connection pool"""
    if not settings.USE_REDIS:
        logger.info("Redis is disabled via USE_REDIS=false")
        yield None
        return

    if redis_pool is None:
        logger.warning("Redis pool is not available - yielding None")
        yield None
        return

    client = redis.Redis(connection_pool=redis_pool)
    logger.info("Redis client initialized from pool")

    try:
        client.ping()
        yield client
    except redis.exceptions.ConnectionError as e:
        logger.warning(f"Redis connection failed: {str(e)}")
        yield None
    except Exception as e:
        logger.warning(f"Redis error: {str(e)}")
        yield None
    finally:
        pass


async def get_redis_async_client():
    """Gets an async Redis client connected to the async connection pool"""
    if not settings.USE_REDIS:
        logger.info("Redis is disabled via USE_REDIS=false")
        return None

    if redis_async_pool is None:
        logger.warning("Async Redis pool is not available")
        return None

    client = redis_async.Redis(connection_pool=redis_async_pool)
    logger.info("Async Redis client initialized from pool")

    try:
        await client.ping()
        return client
    except Exception as e:
        logger.warning(f"Async Redis error: {str(e)}")
        return None
