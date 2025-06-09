from fastapi import APIRouter, HTTPException
import logging
import traceback

from app.models.schemas import PromptGenerationRequest, PromptGenerationResponse
from app.services.prompt_service import generate_cursor_prompt, get_current_timestamp

router = APIRouter(prefix="/prompt", tags=["prompt"])

# Set up logging
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=PromptGenerationResponse)
async def generate_prompt(request: PromptGenerationRequest):
    """
    Generate a Cursor IDE-compatible prompt from issue data.
    See system-design/cursor-prompt-generation.md for full design details.
    """
    try:
        logger.info(f"Received request to generate prompt for issue: {request.title}")
        logger.info(f"File path: {request.file_path}")
        logger.info(f"Severity: {request.severity}, Category: {request.category}")

        # Generate the prompt using the service
        generated_prompt = generate_cursor_prompt(request)
        
        # Get current timestamp
        timestamp = get_current_timestamp()
        
        logger.info("Successfully generated cursor prompt")
        
        return PromptGenerationResponse(
            prompt=generated_prompt,
            generated_at=timestamp
        )
        
    except ValueError as e:
        logger.error(f"Value error during prompt generation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during prompt generation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate prompt: {str(e)}"
        ) 