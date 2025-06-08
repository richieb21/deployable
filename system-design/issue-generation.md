# System Design: Issue Generation

This document outlines the end-to-end process of analyzing a GitHub repository and generating deployment-related issues.

## 1. Overview

The issue generation flow is initiated when a user submits a GitHub repository URL on the frontend. The system analyzes the repository, identifies key files, uses a Large Language Model (LLM) to find potential deployment issues, and streams the results back to the user in real-time.

## 2. Frontend Flow

The process starts on the landing page and continues on the stats/analysis page.

### Key Components

- **`frontend/src/app/components/landing/Hero.tsx`**: The main landing page component where the user submits the repository URL.
- **`frontend/src/app/stats/page.tsx`**: The main page for displaying the analysis progress and results.
- **`frontend/src/app/hooks/useStreamingAnalysis.ts`**: A custom React hook that encapsulates the entire logic for communicating with the backend API.

### Step-by-Step

1.  **User Submission (`Hero.tsx`)**:

    - The user enters a GitHub URL into the input field.
    - The `handleSubmit` function is triggered on form submission.
    - It performs a client-side redirect to `/stats?repo=<encoded_repo_url>`.

2.  **Analysis Page (`StatsPage.tsx`)**:

    - The page mounts and extracts the `repo` URL from the query parameters.
    - It calls the `startAnalysis` function provided by the `useStreamingAnalysis` hook. This triggers the backend analysis.
    - While the analysis is in progress (`isAnalyzing` is true), it renders the `AnalysisView` component, which displays real-time progress (e.g., files being analyzed and issues as they are found).
    - Once the analysis is complete, it renders the `StatsDisplay` and `IssuesList` components to show the final report.

3.  **Streaming Hook (`useStreamingAnalysis.ts`)**:
    - This hook orchestrates the communication with the backend.
    - **`startAnalysis` function**:
      1.  Makes a `POST` request to `/analysis/key-files` to get a list of important files from the repo.
      2.  Makes a `POST` request to `/stream/start` to initialize a server-sent events (SSE) stream and get an `analysis_id`.
      3.  Opens an `EventSource` connection to `/stream/analysis/{analysis_id}` to listen for real-time updates.
      4.  Makes a final `POST` request to `/analysis` to trigger the main analysis, passing the `repo_url`, key files, and `analysis_id`.
    - **Event Handling**:
      - The `EventSource` listens for messages from the backend.
      - `PROGRESS` events update the UI to show which files are currently being analyzed.
      - `RECOMMENDATION` events add new issues to a list, which are displayed to the user in real-time.
      - A `COMPLETE` event signals the end of the analysis, closes the connection, and triggers the final results view.

## 3. Backend Flow

The backend is a FastAPI application that exposes several endpoints to handle the analysis.

### Key Components

- **`backend/app/main.py`**: The main entry point of the FastAPI application. It sets up middleware and includes the API routers.
- **`backend/app/api/endpoints/analysis.py`**: Contains the core logic for repository analysis.
- **`backend/app/api/endpoints/streaming.py`**: Manages the SSE connections for real-time updates.
- **`backend/app/services/github_service.py`**: A service for interacting with the GitHub API (listing files, fetching content).
- **`backend/app/services/LLM_service.py`**: A service for interacting with a Large Language Model to perform code analysis.

### Step-by-Step

1.  **Identify Key Files (`/analysis/key-files`)**:

    - The frontend sends a `POST` request with the `repo_url`.
    - `GithubService` lists all files in the repository.
    - `LLM_service` is used to analyze the file list and identify which files are most important for understanding the repository's deployment setup (e.g., `package.json`, `Dockerfile`, `main.py`).
    - It returns the full file list and the identified key files.

2.  **Start Stream (`/stream/start`)**:

    - The frontend sends a `POST` request.
    - The backend generates a unique `analysis_id` (UUID).
    - It creates an `asyncio.Queue` and stores it in a global dictionary (`analysis_streams`) keyed by the `analysis_id`.
    - It returns the `analysis_id` to the frontend.

3.  **Trigger Analysis (`/analysis`)**:

    - The frontend sends a `POST` request containing the `repo_url`, the `important_files`, and the `analysis_id`.
    - `GithubService` fetches the content of the important files.
    - The files are split into smaller chunks.
    - Using a `ThreadPoolExecutor`, the backend processes these chunks in parallel.
    - For each chunk, `LLM_service` is called to analyze the code and generate deployment-related recommendations.
    - As recommendations are generated, they are put into the `asyncio.Queue` corresponding to the `analysis_id` as `RECOMMENDATION` events. `PROGRESS` events are also sent.

4.  **Stream Events (`/stream/analysis/{analysis_id}`)**:
    - The frontend maintains an open `EventSource` connection to this `GET` endpoint.
    - An `async` generator (`event_generator`) continuously polls the queue for the given `analysis_id`.
    - When an event is found in the queue, it's formatted as an SSE message and sent to the frontend.
    - If the queue is empty for a period, a `HEARTBEAT` event is sent to keep the connection alive.
    - Once the `/analysis` endpoint is finished processing, it places a `COMPLETE` event in the queue. The `event_generator` sends this final event and then terminates the stream.

## 4. Implementation Checklist

- [ ] **Frontend**: Create `handleSubmit` in `Hero.tsx` to navigate to stats page.
- [ ] **Frontend**: Implement `StatsPage.tsx` to handle the overall layout and state.
- [ ] **Frontend**: Create `useStreamingAnalysis` hook to manage API communication.
- [ ] **Backend**: Create `analysis.py` with `/analysis` and `/analysis/key-files` endpoints.
- [ ] **Backend**: Implement `GithubService` to fetch repository data.
- [ ] **Backend**: Implement `LLM_service` for code analysis.
- [ ] **Backend**: Create `streaming.py` to handle SSE streaming.
- [ ] **Documentation**: Add docstrings to all new functions referencing this system design document.
