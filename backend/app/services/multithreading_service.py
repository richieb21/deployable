import threading
import logging 
from app.services.LLM_service import create_language_service

logger = logging.getLogger(__name__)


class LLMClientPool:
    def __init__(self, size=5, llm_provider=None):
        self.clients = []
        self.size = size
        self.lock = threading.Lock()
        self.llm_provider = llm_provider
        self._initialize_clients()
    
    def _initialize_clients(self):
        for _ in range(self.size):
            self.clients.append(create_language_service(self.llm_provider))
        logger.info(f"Initialized pool of {self.size} {self.llm_provider} clients")
    
    def get_client(self):
        with self.lock:
            if not self.clients:
                # If pool is empty, create a new client
                return create_language_service()
            return self.clients.pop()
    
    def return_client(self, client):
        with self.lock:
            self.clients.append(client)
