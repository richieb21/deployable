from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
import logging
import json
import concurrent.futures
from datetime import datetime
import threading
import time
import asyncio
import redis.asyncio as redis_async

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    IdentifyKeyFilesRequest,
    IdentifyKeyFilesResponse,
)
from app.services.github_service import GithubService
from app.services.LLM_service import create_language_service
from app.services.multithreading_service import LLMClientPool
from app.core.dependencies import get_redis_client, get_redis_async_client
from app.api.endpoints.streaming import analysis_streams
from app.services.stats_service import StatService
from app.core.limiter import limiter
from app.core.config import settings

from redis import Redis

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"],
    responses={404: {"description": "Not found"}},
)

CURRENT_LLM_PROIVDER = "deepseek"
recommendations_lock = threading.Lock()


def analyze_file_batch(
    files_batch: List[Dict[str, str]], client_pool, batch_index: int
) -> List[Dict[str, Any]]:
    """
    Analyze a batch of files using a client from the pool.
    """
    try:
        client = client_pool.get_client()

        logger.info(
            f"Batch {batch_index}: Starting analysis of {len(files_batch)} files"
        )

        prompt_start_time = time.time()
        analysis_prompt = client.get_file_analysis_prompt(files_batch)
        prompt_duration = time.time() - prompt_start_time
        logger.info(
            f"Batch {batch_index}: Prompt generation took {prompt_duration:.2f} seconds"
        )

        model_start_time = time.time()
        analysis_response = client.call_model(analysis_prompt)
        model_duration = time.time() - model_start_time
        logger.info(
            f"Batch {batch_index}: Model API call took {model_duration:.2f} seconds"
        )

        try:
            recommendations = json.loads(analysis_response)
            return recommendations

        except json.JSONDecodeError as e:
            logger.error(f"Batch {batch_index}: JSON parse error: {str(e)}")
            return []

    except Exception as e:
        logger.error(f"Batch {batch_index}: Error in batch analysis: {str(e)}")
        return []


def chunk_files(
    files: List[Dict[str, str]], chunk_size: int = 5
) -> List[List[Dict[str, str]]]:
    """
    Split files into chunks for parallel processing.

    Args:
        files: List of file content dictionaries
        chunk_size: Number of files per chunk

    Returns:
        List of file chunks
    """
    return [files[i : i + chunk_size] for i in range(0, len(files), chunk_size)]


async def process_batch(executor, chunk, client_pool, chunk_index, queue):
    """
    Takes a future from a thread executor and turns it into an asynchronous future, allowing
    asynchronous functions (queuing events) to be ran concurrently
    """
    future = executor.submit(analyze_file_batch, chunk, client_pool, chunk_index)
    try:
        chunk_recommendations = await asyncio.wrap_future(future)

        progress_event = {
            "type": "PROGRESS",
            "chunk_index": chunk_index,
            "files": [file.get("path", "unknown") for file in chunk],
            "recommendations_count": len(chunk_recommendations),
        }

        for chunk_recommendation in chunk_recommendations:
            recommendation_event = {
                "type": "RECOMMENDATION",
                "recommendation" : chunk_recommendation
            }
            await queue.put(recommendation_event)

        await queue.put(progress_event)

        return chunk_index, chunk_recommendations
    except Exception as e:
        logger.error(f"Error processing chunk {chunk_index}: {str(e)}")
        return chunk_index, []


@router.post("/", response_model=AnalysisResponse)
@limiter.limit(settings.ANALYSIS_RATE_LIMIT)
async def analyze_repository(
    request: Request,
    analysis_request: AnalysisRequest,
    redis_client: Redis = Depends(get_redis_client),
    async_redis_client: redis_async.Redis = Depends(get_redis_async_client),
):
    """
    Analyze a GitHub repository for deployment readiness using multiple parallel LLM clients.
    Can operate in streaming mode if analysis_id is provided, otherwise runs synchronously.
    """
    overall_start_time = time.time()
    logger.info(f"Starting analysis for repository: {analysis_request.repo_url}")

    if getattr(analysis_request, "is_reprompt", False):
        logger.info("Reprompt requested, bypassing cache")
        redis_client = None

    github_service = GithubService(redis_client=redis_client)

    try:
        repo_url = str(analysis_request.repo_url)
        important_files = analysis_request.important_files

        files_to_analyze = []
        files_to_analyze.extend(important_files.frontend)
        files_to_analyze.extend(important_files.backend)
        files_to_analyze.extend(important_files.infra)

        fetch_start = time.time()
        file_contents = github_service.get_file_content_batch(
            repo_url, files_to_analyze
        )
        fetch_duration = time.time() - fetch_start
        logger.info(
            f"Fetched content for {len(file_contents)} files in {fetch_duration:.2f} seconds"
        )

        file_chunks = chunk_files(file_contents, chunk_size=3)
        logger.info(f"Split files into {len(file_chunks)} chunks for processing")

        all_recommendations = []
        max_workers = max(1, min(len(file_chunks), 10))
        client_pool = LLMClientPool(size=max_workers, llm_provider=CURRENT_LLM_PROIVDER)

        analysis_start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            if analysis_request.analysis_id:  # we need to stream
                queue = analysis_streams.get(analysis_request.analysis_id)
                if not queue:
                    raise HTTPException(
                        status_code=404, detail="Analysis stream not found"
                    )

                tasks = []
                for i, chunk in enumerate(file_chunks):
                    task = process_batch(executor, chunk, client_pool, i, queue)
                    tasks.append(task)

                results = await asyncio.gather(*tasks)
                for _, chunk_recommendations in results:
                    with recommendations_lock:
                        all_recommendations.extend(chunk_recommendations)

                await queue.put(
                    {
                        "type": "COMPLETE",
                        "recommendations": all_recommendations,
                        "analysis_timestamp": datetime.now().isoformat(),
                    }
                )
            else:  # don't stream events, process synchronously in parallel
                futures = {
                    executor.submit(analyze_file_batch, chunk, client_pool, i): i
                    for i, chunk in enumerate(file_chunks)
                }

                for future in concurrent.futures.as_completed(futures):
                    chunk_index = futures[future]
                    try:
                        chunk_recommendations = future.result()
                        logger.info(f"Chunk {chunk_index} processed")
                        with recommendations_lock:
                            all_recommendations.extend(chunk_recommendations)
                    except Exception as e:
                        logger.error(f"Error processing chunk {chunk_index}: {str(e)}")

        analysis_duration = time.time() - analysis_start
        logger.info(f"All chunks processed in {analysis_duration:.2f} seconds")

        logger.info(
            f"Analysis complete. Found {len(all_recommendations)} recommendations"
        )
        overall_duration = time.time() - overall_start_time
        logger.info(f"Total analysis completed in {overall_duration:.2f} seconds")

        stats_service = StatService(redis_client=async_redis_client)
        key_files = analysis_request.important_files
        num_files = (
            len(key_files.frontend) + len(key_files.backend) + len(key_files.infra)
        )
        try:
            await stats_service.increment_analysis_stats(
                num_files=num_files, num_recommendations=len(all_recommendations)
            )
            logger.info("Successfully incremented analysis stats")
        except Exception as e:
            logger.error(f"Error incrementing analysis stats: {str(e)}")

        return AnalysisResponse(
            repository=repo_url,
            recommendations=all_recommendations,
            analysis_timestamp=datetime.now().isoformat(),
        )

    except Exception as e:
        overall_duration = time.time() - overall_start_time
        logger.error(
            f"Analysis failed after {overall_duration:.2f} seconds: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/key-files", response_model=IdentifyKeyFilesResponse)
@limiter.limit(settings.KEY_FILES_RATE_LIMIT)
async def identify_key_files(
    request: Request,
    key_files_request: IdentifyKeyFilesRequest,
    redis_client: Redis = Depends(get_redis_client),
):
    """
    Identify all files and key files within a Github Repository
    """
    repo_url = str(key_files_request.repo_url)

    if getattr(
        key_files_request, "is_reprompt", False
    ):  # if we are reprompting, don't use redis client so we regenerate everything
        logger.info("Reprompt requested, bypassing cache")
        redis_client = None

    github_service = GithubService(redis_client=redis_client)
    all_files = github_service.list_filenames(repo_url)

    llm = create_language_service(CURRENT_LLM_PROIVDER)

    prompt_identify = llm.identify_files_prompt(all_files)
    prompt_tech_stack = llm.get_tech_stack_prompt(all_files)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_identify = executor.submit(
            llm.call_model_with_cache, prompt_identify, redis_client
        )
        future_tech_stack = executor.submit(
            llm.call_model_with_cache, prompt_tech_stack, redis_client
        )

        # Get results from both futures
        key_files = json.loads(future_identify.result())
        tech_stack = json.loads(future_tech_stack.result())

    return IdentifyKeyFilesResponse(
        all_files=all_files, key_files=key_files, tech_stack=tech_stack
    )
