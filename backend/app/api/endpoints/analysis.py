from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import logging
import json
import concurrent.futures
from datetime import datetime
import threading

from app.models.schemas import AnalysisRequest, AnalysisResponse, Recommendation
from app.services.github import GithubService
from app.services.deepseek_service import DeepseekService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"],
    responses={404: {"description": "Not found"}},
)

github_service = GithubService()
recommendations_lock = threading.Lock()

def analyze_file_batch(files_batch: List[Dict[str, str]], api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Analyze a batch of files using a dedicated DeepSeek client.
    
    Args:
        files_batch: List of file content dictionaries to analyze
        api_key: Optional API key for DeepSeek
        
    Returns:
        List of recommendations
    """
    try:
        # Create a dedicated DeepSeek client for this batch
        deepseek_client = DeepseekService(api_key=api_key)
        
        logger.info(f"Analyzing batch of {len(files_batch)} files")
        analysis_prompt = deepseek_client.get_file_analysis_prompt(files_batch)
        analysis_response = deepseek_client.call_model(analysis_prompt)
        
        try:
            recommendations = json.loads(analysis_response)
            logger.info(f"Batch analysis complete, found {len(recommendations)} recommendations")
            return recommendations
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.error(f"Raw response snippet: {analysis_response[:200]}...")
            
            return [{
                "title": "JSON Parsing Error",
                "description": f"Failed to parse model response: {str(e)}. This is likely due to an invalid JSON format returned by the model.",
                "file_path": "N/A",
                "severity": "LOW",
                "category": "INFRASTRUCTURE",
                "action_items": ["Retry the analysis", "Check model response format"],
                "code_snippets": {
                    "before": "N/A",
                    "after": "N/A"
                },
                "references": []
            }]
        
    except Exception as e:
        logger.error(f"Error in file batch analysis: {str(e)}")
        return []  # Return empty list instead of failing the entire process

def chunk_files(files: List[Dict[str, str]], chunk_size: int = 2) -> List[List[Dict[str, str]]]:
    """
    Split files into chunks for parallel processing.
    
    Args:
        files: List of file content dictionaries
        chunk_size: Number of files per chunk
        
    Returns:
        List of file chunks
    """
    return [files[i:i + chunk_size] for i in range(0, len(files), chunk_size)]

@router.post("/", response_model=AnalysisResponse)
async def analyze_repository(request: AnalysisRequest):
    """
    Analyze a GitHub repository for deployment readiness using multiple parallel DeepSeek clients.
    """
    try:
        repo_url = str(request.repo_url)

        all_files = github_service.list_filenames(repo_url)
        
        # identify important files to analyze
        deepseek_service = DeepseekService() 
        files_prompt = deepseek_service.identify_files_prompt(all_files)
        files_response = deepseek_service.call_model(files_prompt)
        
        try:
            important_files = json.loads(files_response)
            logger.info(f"Identified important files: {important_files}")
        except json.JSONDecodeError:
            logger.error(f"Failed to parse important files response: {files_response}")
            important_files = {"frontend": [], "backend": [], "infra": []}
        
        files_to_analyze = []
        for _, file_list in important_files.items():
            files_to_analyze.extend(file_list)
        
        file_contents = github_service.get_file_content_batch(repo_url, files_to_analyze)
        
        file_chunks = chunk_files(file_contents)
        logger.info(f"Split files into {len(file_chunks)} chunks")
        
        all_recommendations = []
        
        # Use a thread pool executor for parallel processing
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(file_chunks), 8)) as executor:
            future_to_chunk = {
                executor.submit(analyze_file_batch, chunk, request.api_key if hasattr(request, 'api_key') else None): i 
                for i, chunk in enumerate(file_chunks)
            }
            
            for future in concurrent.futures.as_completed(future_to_chunk):
                chunk_index = future_to_chunk[future]
                try:
                    chunk_recommendations = future.result()
                    logger.info(f"Chunk {chunk_index} processed with {len(chunk_recommendations)} recommendations")
                    
                    # Safely append results using lock
                    with recommendations_lock:
                        all_recommendations.extend(chunk_recommendations)
                        
                except Exception as e:
                    logger.error(f"Error processing chunk {chunk_index}: {str(e)}")
        
        # Convert to Recommendation objects for validation
        # validated_recommendations = []
        # for rec in all_recommendations:
        #     try:
        #         validated_recommendations.append(Recommendation(**rec))
        #     except Exception as e:
        #         logger.error(f"Invalid recommendation format: {str(e)}")
        
        logger.info(f"Analysis complete. Found {len(all_recommendations)} recommendations")
        end_time = datetime.now()
        
        # Step 5: Return the analysis results
        return AnalysisResponse(
            repository=repo_url,
            recommendations=all_recommendations,
            analysis_timestamp=end_time.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

