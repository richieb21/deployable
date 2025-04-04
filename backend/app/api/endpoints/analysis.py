from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import logging
import json
import concurrent.futures
from datetime import datetime
import threading
import time

from app.models.schemas import AnalysisRequest, AnalysisResponse, IdentifyKeyFilesRequest, IdentifyKeyFilesResponse
from app.services.github_service import GithubService
from app.services.LLM_service import create_language_service
from app.services.multithreading_service import LLMClientPool
from app.core.dependencies import get_redis_client

from redis import Redis

logger = logging.getLogger(__name__)

# time to decouple key files from analysis endpoint, provide those things as a request parameter

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"],
    responses={404: {"description": "Not found"}},
)

CURRENT_LLM_PROIVDER = "groq"
recommendations_lock = threading.Lock()

def analyze_file_batch(files_batch: List[Dict[str, str]], client_pool, batch_index: int) -> List[Dict[str, Any]]:
    """
    Analyze a batch of files using a client from the pool.
    
    Args:
        files_batch: List of file content dictionaries to analyze
        client_pool: Pool of DeepSeek clients
        batch_index: Index of the current batch for logging
        
    Returns:
        List of recommendations
    """
    batch_start_time = time.time()
    total_content_size = sum(len(file.get('content', '')) for file in files_batch)
    
    try:
        # Get a client from the pool
        deepseek_client = client_pool.get_client()
        
        logger.info(f"Batch {batch_index}: Analyzing {len(files_batch)} files ({total_content_size/1024:.1f} KB)")
        
        prompt_start_time = time.time()
        analysis_prompt = deepseek_client.get_file_analysis_prompt(files_batch)
        prompt_duration = time.time() - prompt_start_time
        logger.info(f"Batch {batch_index}: Prompt generation took {prompt_duration:.2f} seconds")
        
        model_start_time = time.time()
        analysis_response = deepseek_client.call_model(analysis_prompt)
        model_duration = time.time() - model_start_time
        logger.info(f"Batch {batch_index}: Model API call took {model_duration:.2f} seconds")
        
        try:
            parse_start_time = time.time()
            recommendations = json.loads(analysis_response)
            parse_duration = time.time() - parse_start_time
            logger.info(f"Batch {batch_index}: JSON parsing took {parse_duration:.2f} seconds")
            
            batch_duration = time.time() - batch_start_time
            logger.info(f"Batch {batch_index}: Analysis complete, found {len(recommendations)} recommendations in {batch_duration:.2f} seconds")
            
            # Return the client to the pool
            client_pool.return_client(deepseek_client)
            return recommendations
        except json.JSONDecodeError as e:
            logger.error(f"Batch {batch_index}: Failed to parse JSON response: {str(e)}")
            logger.error(f"Batch {batch_index}: Raw response snippet: {analysis_response[:200]}...")
            
            # Return the client to the pool
            client_pool.return_client(deepseek_client)
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
        logger.error(f"Batch {batch_index}: Error in file batch analysis: {str(e)}")
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
    # Group similar files together for better analysis
    grouped_files = {}
    for file in files:
        # Get file extension as a grouping key
        ext = file.get('name', '').split('.')[-1] if '.' in file.get('name', '') else 'unknown'
        if ext not in grouped_files:
            grouped_files[ext] = []
        grouped_files[ext].append(file)
    
    # Create chunks with similar files when possible
    chunks = []
    remaining_files = []
    
    # First create complete chunks of similar files
    for ext, file_group in grouped_files.items():
        for i in range(0, len(file_group), chunk_size):
            chunk = file_group[i:i + chunk_size]
            if len(chunk) == chunk_size:
                chunks.append(chunk)
            else:
                remaining_files.extend(chunk)
    
    # Then handle any remaining files
    for i in range(0, len(remaining_files), chunk_size):
        chunks.append(remaining_files[i:i + chunk_size])
    
    logger.info(f"Created {len(chunks)} chunks with up to {chunk_size} files per chunk")
    return chunks

@router.post("/", response_model=AnalysisResponse)
async def analyze_repository(
    request: AnalysisRequest,
    redis_client: Redis = Depends(get_redis_client)
):
    """
    Analyze a GitHub repository for deployment readiness using multiple parallel LLM clients.
    """
    overall_start_time = time.time()
    logger.info(f"Starting analysis for repository: {request.repo_url}")

    github_service = GithubService(redis_client=redis_client)
    
    try:
        repo_url = str(request.repo_url)

        list_files_start = time.time()
        all_files = github_service.list_filenames(repo_url)
        list_files_duration = time.time() - list_files_start
        logger.info(f"Listed {len(all_files)} files in {list_files_duration:.2f} seconds")
        
        # identify important files to analyze
        llm_service = create_language_service(CURRENT_LLM_PROIVDER) 
        
        identify_start = time.time()
        logger.info(all_files)
        files_prompt = llm_service.identify_files_prompt(all_files)
        
        model_start = time.time()
        files_response = llm_service.call_model(files_prompt)
        logger.info(files_response)
        model_duration = time.time() - model_start
        logger.info(f"Files identification model call took {model_duration:.2f} seconds")
        
        try:
            important_files = json.loads(files_response)
            identify_duration = time.time() - identify_start
            logger.info(f"Identified important files in {identify_duration:.2f} seconds")
            
            # Count files by category
            file_counts = {category: len(files) for category, files in important_files.items()}
            logger.info(f"File counts by category: {file_counts}")
        except json.JSONDecodeError:
            logger.error(f"Failed to parse important files response: {files_response}")
            important_files = {"frontend": [], "backend": [], "infra": []}
        
        files_to_analyze = []
        for _, file_list in important_files.items():
            files_to_analyze.extend(file_list)
        
        fetch_start = time.time()
        file_contents = github_service.get_file_content_batch(repo_url, files_to_analyze)
        fetch_duration = time.time() - fetch_start
        logger.info(f"Fetched content for {len(file_contents)} files in {fetch_duration:.2f} seconds")
        
        file_chunks = chunk_files(file_contents, chunk_size=5) 
        logger.info(f"Split files into {len(file_chunks)} chunks for processing")
        
        all_recommendations = []
        
        # Create a pool of LLM clients
        max_workers = max(1, min(len(file_chunks), 10))  # Ensure at least 1 worker
        client_pool = LLMClientPool(size=max_workers, llm_provider=CURRENT_LLM_PROIVDER)
        
        # Use a thread pool executor for parallel processing
        analysis_start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_chunk = {
                executor.submit(analyze_file_batch, chunk, client_pool, i): i 
                for i, chunk in enumerate(file_chunks)
            }
            
            completed = 0
            for future in concurrent.futures.as_completed(future_to_chunk):
                chunk_index = future_to_chunk[future]
                try:
                    chunk_recommendations = future.result()
                    completed += 1
                    progress_pct = (completed / len(file_chunks)) * 100
                    logger.info(f"Chunk {chunk_index} processed with {len(chunk_recommendations)} recommendations ({completed}/{len(file_chunks)} complete, {progress_pct:.1f}%)")
                    
                    # Locking to avoid race conditions
                    with recommendations_lock:
                        all_recommendations.extend(chunk_recommendations)
                        
                except Exception as e:
                    logger.error(f"Error processing chunk {chunk_index}: {str(e)}")
        
        analysis_duration = time.time() - analysis_start
        logger.info(f"All chunks processed in {analysis_duration:.2f} seconds")
        
        logger.info(f"Analysis complete. Found {len(all_recommendations)} recommendations")
        overall_duration = time.time() - overall_start_time
        logger.info(f"Total analysis completed in {overall_duration:.2f} seconds")
        
        end_time = datetime.now()
        
        return AnalysisResponse(
            repository=repo_url,
            recommendations=all_recommendations,
            analysis_timestamp=end_time.isoformat()
        )
        
    except Exception as e:
        overall_duration = time.time() - overall_start_time
        logger.error(f"Analysis failed after {overall_duration:.2f} seconds: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/key-files", response_model=IdentifyKeyFilesResponse)
async def identify_key_files(
    request: IdentifyKeyFilesRequest,
    redis_client: Redis = Depends(get_redis_client)
):
    """
    Identify all files and key files within a Github Repository
    """
    repo_url = str(request.repo_url)

    github_service = GithubService(redis_client=redis_client)
    all_files = github_service.list_filenames(repo_url)

    llm = create_language_service("claude")

    prompt_identify = llm.identify_files_prompt(all_files)
    prompt_tech_stack = llm.get_tech_stack_prompt(all_files)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_identify = executor.submit(llm.call_model, prompt_identify)
        future_tech_stack = executor.submit(llm.call_model, prompt_tech_stack)

        # Get results from both futures
        key_files = json.loads(future_identify.result())
        tech_stack = json.loads(future_tech_stack.result())

    return IdentifyKeyFilesResponse(
        all_files=all_files,
        key_files=key_files,
        tech_stack=tech_stack
    )