from fastapi import APIRouter
from app.models.schemas import AnalysisStreamStartRequest, AnalysisStreamStartResponse
from uuid import uuid4
import asyncio

router = APIRouter(
    prefix="/stream",
    tags=["streaming"]
)

# stores mappings of current analysis queues, maybe investigate a more scalable solution
analysis_streams = {}

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