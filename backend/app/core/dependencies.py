import redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

"""Cache Expiration"""
TTL_EXPIRATION = 30*60  # 30 minutes, honestly idk what to make this lol. I assume people don't make many changes in 30 minutes before they check again?

"""Initialize the connection pool"""
try:
    redis_pool = redis.ConnectionPool(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,  
        socket_connect_timeout=2.0  
    )
    logger.info(f"Redis connection pool initialized at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis pool initialization failed: {str(e)} - caching will be disabled")
    redis_pool = None

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
        yield None  # Yield None instead of failing
    except Exception as e:
        logger.warning(f"Redis error: {str(e)}")
        yield None  # Yield None instead of failing
    finally:
        pass