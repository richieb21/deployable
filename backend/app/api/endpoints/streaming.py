from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import AnalysisStreamStartRequest, AnalysisStreamStartResponse, AnalysisHeartbeatEvent, AnalysisEventType
from uuid import uuid4
import asyncio
import json
import logging
from typing import List, Dict, Any

router = APIRouter(
    prefix="/stream",
    tags=["streaming"]
)

logger = logging.getLogger(__name__)

# stores mappings of current analysis queues, maybe investigate a more scalable solution
analysis_streams = {}

# we need an event generator to service the stream with different events and information
async def event_generator(analysis_id: str):
    logger.info(f"Starting event generator for analysis_id: {analysis_id}")
    
    if analysis_id not in analysis_streams:
        logger.error(f"Analysis Session for id: {analysis_id} not found")
        raise HTTPException(status_code=404, detail=f"Analysis Session not found")

    queue = analysis_streams[analysis_id]
    logger.info(f"Got queue for analysis_id: {analysis_id}")

    try:
        while True:
            try:
                logger.info(f"Waiting for event on analysis_id: {analysis_id}")
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
                logger.info(f"Received event for analysis_id: {analysis_id}: {data}")

                if not isinstance(data, dict):
                    logger.error(f"Invalid data type: {type(data)}")
                    continue
                
                event_type = data.get("type")
                logger.info(f"Processing event type: {event_type}")

                if event_type not in AnalysisEventType.__members__:
                    logger.error(f"Invalid event type: {event_type}")
                    continue
                
                formatted_event = f"data: {json.dumps(data)}\n\n"
                logger.info(f"Sending formatted event: {formatted_event}")
                
                if event_type == "PROGRESS":
                    yield formatted_event
                elif event_type == "COMPLETE":
                    yield formatted_event
                    logger.info("Received COMPLETE event, breaking generator")
                    break
            except asyncio.TimeoutError:
                logger.info("Timeout waiting for event, sending heartbeat")
                heartbeat = AnalysisHeartbeatEvent().dict()
                yield f"data: {json.dumps(heartbeat)}\n\n"
    finally:    
        logger.info(f"Generator closing, cleaning up analysis_id: {analysis_id}")
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
@router.get("/analysis/{analysis_id}")
async def stream_analysis_connection(analysis_id: str):
    """Establish a streaming connection to begin receiving events"""
    logger.info(f"Starting stream for analysis_id: {analysis_id}")
    
    return StreamingResponse(
        event_generator(analysis_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

def analyze_file_batch(files_batch: List[Dict[str, str]], client_pool, batch_index: int, analysis_id: str) -> List[Dict[str, Any]]:
    try:
        client = client_pool.get_client()
        queue: asyncio.Queue = analysis_streams.get(analysis_id, None)

        if not queue:
            logger.error(f"No queue found for analysis_id: {analysis_id}")
            return []
        
        logger.info(f"Batch {batch_index}: Starting analysis of {len(files_batch)} files")
        
        # ... your existing code ...

        try:
            recommendations = json.loads(analysis_response)
            logger.info(f"Batch {batch_index}: Parsed {len(recommendations)} recommendations")

            # Create progress event
            progress_event = {
                "type": "PROGRESS",
                "chunk_index": batch_index,
                "files": [file.get('name', 'unknown') for file in files_batch],  # Fixed: directly use files_batch
                "recommendations_count": len(recommendations)
            }
            
            logger.info(f"Batch {batch_index}: Created progress event: {progress_event}")

            # Create a new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                loop.run_until_complete(queue.put(progress_event))
                logger.info(f"Batch {batch_index}: Successfully queued progress event")
            except Exception as e:
                logger.error(f"Batch {batch_index}: Failed to queue progress event: {str(e)}")
            finally:
                loop.close()

            return recommendations

        except json.JSONDecodeError as e:
            logger.error(f"Batch {batch_index}: Failed to parse recommendations: {str(e)}")
            return []
            
    except Exception as e:
        logger.error(f"Batch {batch_index}: Error in batch analysis: {str(e)}")
        return []