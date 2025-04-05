from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import AnalysisStreamStartRequest, AnalysisStreamStartResponse, AnalysisHeartbeatEvent, AnalysisEventType
from uuid import uuid4
import asyncio
import json

router = APIRouter(
    prefix="/stream",
    tags=["streaming"]
)

# stores mappings of current analysis queues, maybe investigate a more scalable solution
analysis_streams = {}

# we need an event generator to service the stream with different events and information
async def event_generator(analysis_id: str):
    if analysis_id not in analysis_streams:
        raise HTTPException(status_code=404, detail=f"Analysis Session for the id: {analysis_id} not found")

    queue = analysis_streams[analysis_id]

    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)

                if not isinstance(data, dict):
                    raise ValueError(f"Invalid data type encountered while streaming events!")
                
                event_type = data.get("type")

                if event_type == AnalysisEventType.PROGRESS:
                    yield json.dumps(data)
                
                if event_type == AnalysisEventType.COMPLETE:
                    yield json.dumps(data)
                    break
            except asyncio.TimeoutError:
                heartbeat = AnalysisHeartbeatEvent().dict()
                yield json.dumps(heartbeat)
    finally:    
        if analysis_id in analysis_streams:
            del analysis_streams[analysis_id]        
# start stream
@router.post("/start", response_model=AnalysisStreamStartResponse)
async def start_analysis_stream(
    request: AnalysisStreamStartRequest
):
    analysis_id = str(uuid4())
    analysis_streams[analysis_id] = asyncio.Queue()

    return AnalysisStreamStartResponse(
        analysis_id=analysis_id
    )

# connect to stream (get request)
@router.get("/connect/{analysis_id}")
async def stream_analysis_connection(analysis_id: str):
    return StreamingResponse(
        event_generator(analysis_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )