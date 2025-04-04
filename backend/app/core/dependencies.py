import redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

"""Cache Expiration"""
TTL_EXPIRATION=3*60*60

"""Initialize the connection pool"""
redis_client = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT
)

def get_redis_client():
    """Gets a Redis client connected to the connection pool"""
    client = redis.Redis(connection_pool=redis_client)
    logger.info("Initializing a Redis client")
    try:
        yield client
    finally:
        pass