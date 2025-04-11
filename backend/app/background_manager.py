import asyncio
from typing import Set, Coroutine, Any

class BackgroundManager:
    def __init__(self):
        self._tasks: Set[asyncio.Task] = set()
        self._resources_to_cleanup: list = []

    def add_task(self, coroutine: Coroutine[Any, Any, Any]):
        """Creates a task from a coroutine and manager it"""

        task = asyncio.create_task(coroutine)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        return task
    
    def add_resource(self, resource):
        """Adds a resource that needs cleanup during shutdown"""
        if hasattr(resource, 'close') and callable(resource.close):
            self._resources_to_cleanup.append(resource)

    async def shutdown(self):
        """Cancels all managed tasks and cleans up resources"""
        if self._tasks:
            tasks_to_await = []
            for task in list(self._tasks):
                try:
                    task.cancel()
                    tasks_to_await.append(task)
                except Exception:
                    pass
            
            if tasks_to_await:
                await asyncio.gather(*tasks_to_await, return_exceptions=True)
            self._tasks.clear()

        if self._resources_to_cleanup:
            for resource in self._resources_to_cleanup:
                try:
                    await resource.close()
                except Exception:
                    pass
            
            self._resources_to_cleanup.clear()