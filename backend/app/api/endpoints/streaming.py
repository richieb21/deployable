from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    AnalysisStreamStartRequest,
    AnalysisStreamStartResponse,
    AnalysisHeartbeatEvent,
    AnalysisEventType,
)
from uuid import uuid4
import asyncio
import json
import logging
from datetime import datetime

router = APIRouter(prefix="/stream", tags=["streaming"])

logger = logging.getLogger(__name__)

# stores mappings of current analysis queues, maybe investigate a more scalable solution
analysis_streams = {}


# we need an event generator to service the stream with different events and information
async def event_generator(analysis_id: str):
    """Processes events in the given asynchronous async queue to yield event data"""
    if analysis_id not in analysis_streams:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis Session for the id: {analysis_id} not found",
        )

    queue = analysis_streams[analysis_id]

    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)

                if not isinstance(data, dict):
                    raise ValueError(
                        f"Invalid data type encountered while streaming events!"
                    )

                event_type = data.get("type")

                if event_type not in AnalysisEventType.__members__:
                    logger.error(f"Invalid event type: {event_type}")
                    continue

                if event_type == AnalysisEventType.PROGRESS:
                    yield f"data: {json.dumps(data)}\n\n"
                elif event_type == AnalysisEventType.RECOMMENDATION:
                    yield f"data: {json.dumps(data)}\n\n"
                elif event_type == AnalysisEventType.COMPLETE:
                    yield f"data: {json.dumps(data)}\n\n"
                    break
            except asyncio.TimeoutError:
                heartbeat = AnalysisHeartbeatEvent().dict()
                yield f"data: {json.dumps(heartbeat)}\n\n"
    finally:
        if analysis_id in analysis_streams:
            del analysis_streams[analysis_id]


# start stream
@router.post("/start", response_model=AnalysisStreamStartResponse)
async def start_analysis_stream():
    """
    Register an analysis queue that can be streamed to
    See system-design/issue-generation.md for full design details.
    """
    analysis_id = str(uuid4())
    analysis_streams[analysis_id] = asyncio.Queue()

    return AnalysisStreamStartResponse(analysis_id=analysis_id)


# connect to stream (get request)
@router.get("/analysis/{analysis_id}")
async def stream_analysis_connection(analysis_id: str):
    """
    Establish a streaming connection to begin receiving events
    See system-design/issue-generation.md for full design details.
    """
    logger.info(f"Starting stream for analysis_id: {analysis_id}")

    return StreamingResponse(
        event_generator(analysis_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
