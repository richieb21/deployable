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
        
        # Parse the response and return recommendations
        recommendations = json.loads(analysis_response)
        logger.info(f"Batch analysis complete, found {len(recommendations)} recommendations")
        return recommendations
        
    except Exception as e:
        logger.error(f"Error in file batch analysis: {str(e)}")
        return []  # Return empty list instead of failing the entire process

def chunk_files(files: List[Dict[str, str]], chunk_size: int = 5) -> List[List[Dict[str, str]]]:
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
        start_time = datetime.now()
        logger.info(f"Starting analysis for repository: {request.repo_url}")
        
        # Step 1: List all files in the repository
        logger.info("Listing all files in repository")
        all_files = github_service.list_filenames(request.repo_url)
        logger.info(f"Found {len(all_files)} files in repository")
        
        logger.info("Identifying important files for analysis")
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
        for category, file_list in important_files.items():
            logger.info(f"Category {category}: {len(file_list)} files")
            files_to_analyze.extend(file_list)
        
        logger.info(f"Fetching content for {len(files_to_analyze)} files")
        file_contents = github_service.get_file_content_batch(request.repo_url, files_to_analyze)
        logger.info(f"Successfully fetched {len(file_contents)} file contents")
        
        file_chunks = chunk_files(file_contents)
        logger.info(f"Split files into {len(file_chunks)} chunks")
        
        all_recommendations = []
        
        # Use a thread pool executor for parallel processing
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(file_chunks), 5)) as executor:
            future_to_chunk = {
                executor.submit(analyze_file_batch, chunk): i 
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
        validated_recommendations = []
        for rec in all_recommendations:
            try:
                validated_recommendations.append(Recommendation(**rec))
            except Exception as e:
                logger.error(f"Invalid recommendation format: {str(e)}")
        
        logger.info(f"Analysis complete. Found {len(validated_recommendations)} recommendations")
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Step 5: Return the analysis results
        return AnalysisResponse(
            repository=str(request.repo_url),
            recommendations=validated_recommendations,
            summary=f"Analysis completed in {duration:.2f} seconds. Found {len(validated_recommendations)} issues across {len(file_contents)} files.",
            detected_technologies=important_files,
            analysis_timestamp=end_time.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/test")
async def test_analysis():
    try:
        start_time = datetime.now()
        repo_url = "https://github.com/steventanyang/market_loo"
        
        hardcoded_files = [
            '.gitignore', 
            'marketloo/.env.example', 
            'marketloo/.gitignore', 
            'marketloo/README.md', 
            'marketloo/agents/common/utils.ts', 
            'marketloo/agents/simple_trader/package.json', 
            'marketloo/agents/simple_trader/src/index.ts', 
            'marketloo/agents/simple_trader/tsconfig.json', 
            'marketloo/agents/thoughtful_trader/markets.json', 
        ]
            
        file_contents = github_service.get_file_content_batch(repo_url, hardcoded_files)
        file_chunks = chunk_files(file_contents, chunk_size=4)
        
        all_recommendations = []
        deepseek_client = DeepseekService()
        
        for i, chunk in enumerate(file_chunks):
            logger.info(f"Processing chunk {i} with {len(chunk)} files")
            
            try:
                analysis_prompt = deepseek_client.get_file_analysis_prompt(chunk)
                analysis_response = deepseek_client.call_model(analysis_prompt)
                
                try:
                    parsed_recommendations = json.loads(analysis_response)
                    if isinstance(parsed_recommendations, list):
                        all_recommendations.extend(parsed_recommendations)
                    else:
                        logger.warning(f"Response from chunk {i} is not a list: {type(parsed_recommendations)}")
                        all_recommendations.append(parsed_recommendations)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from chunk {i}: {str(e)}")
                    logger.error(f"Raw response snippet: {analysis_response[:200]}...")
                    # Store the raw response for debugging
                    all_recommendations.append({
                        "error": "JSON parsing failed",
                        "raw_response_preview": analysis_response[:500],
                        "chunk_index": i
                    })
                    
            except Exception as e:
                logger.error(f"Error processing chunk {i}: {str(e)}")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Test analysis complete in {duration:.2f} seconds. Found {len(all_recommendations)} recommendations")
        
        return {
            "recommendations": all_recommendations,
            "duration_seconds": duration
        }
        
    except Exception as e:
        logger.error(f"Test analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Test analysis failed: {str(e)}")
