"use client";

import { useState, useRef } from "react";
import { Recommendation, AnalysisResponse } from "../types/api";

interface AnalysisEvent {
  type: "PROGRESS" | "RECOMMENDATION" | "COMPLETE" | "HEARTBEAT";
  chunk_index?: number;
  files?: string[];
  recommendations_count?: number;
  recommendations?: Recommendation[];
  recommendation?: Recommendation;
  analysis_timestamp?: string;
}

interface KeyFilesStructure {
  frontend: string[];
  backend: string[];
  infra: string[];
}

interface StreamingAnalysisState {
  files: string[];
  keyFiles: KeyFilesStructure;
  highlightedFiles: Set<string>;
  isAnalyzing: boolean;
  analysisIssues: Recommendation[];
  analysisResult: AnalysisResponse | null;
  error: Error | null;
}

/**
 * Custom hook to manage the streaming analysis of a repository.
 * It handles the entire lifecycle of fetching key files, initiating the analysis,
 * and processing real-time events from the backend.
 * See system-design/issue-generation.md for full design details.
 */
export function useStreamingAnalysis(repoUrl: string) {
  const [state, setState] = useState<StreamingAnalysisState>({
    files: [],
    keyFiles: {
      frontend: [],
      backend: [],
      infra: [],
    },
    highlightedFiles: new Set<string>(),
    isAnalyzing: false,
    analysisIssues: [],
    analysisResult: null,
    error: null,
  });

  // Keep track of the EventSource instance
  const eventSourceRef = useRef<EventSource | null>(null);

  // Function to start the entire analysis process
  const startAnalysisProcess = async () => {
    // Reset state for a new analysis run
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      files: [],
      keyFiles: { frontend: [], backend: [], infra: [] },
      highlightedFiles: new Set<string>(),
      analysisIssues: [],
      analysisResult: null,
      error: null,
    }));

    // Close any existing EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // 1. Fetch Key Files (initial step, could be optimized later)
      const keyFilesResponse = await fetch(`${apiUrl}/analysis/key-files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!keyFilesResponse.ok) {
        throw new Error(
          `Failed to fetch key files: ${keyFilesResponse.statusText}`
        );
      }

      const keyFilesData = await keyFilesResponse.json();
      const fetchedFiles = keyFilesData.all_files;
      const fetchedKeyFiles = keyFilesData.key_files;

      // Update state immediately with file info
      setState((prev) => ({
        ...prev,
        files: fetchedFiles,
        keyFiles: fetchedKeyFiles,
      }));

      // 2. Start the analysis stream
      const startResponse = await fetch(`${apiUrl}/stream/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!startResponse.ok) {
        throw new Error(
          `Failed to start analysis stream: ${startResponse.statusText}`
        );
      }

      const { analysis_id } = await startResponse.json();

      // 3. Connect to the EventSource
      const eventSource = new EventSource(
        `${apiUrl}/stream/analysis/${analysis_id}`,
        { withCredentials: false }
      );
      eventSourceRef.current = eventSource; // Store the reference

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AnalysisEvent;
          console.log("Received event:", data); // Keep for debugging

          switch (data.type) {
            case "PROGRESS":
              if (data.files) {
                setState((prev) => ({
                  ...prev,
                  highlightedFiles: new Set([
                    ...Array.from(prev.highlightedFiles),
                    ...data.files!,
                  ]),
                }));
              }
              break;

            case "RECOMMENDATION":
              if (data.recommendation) {
                // Add unique recommendations based on title and file path
                setState((prev) => {
                  const issueExists = prev.analysisIssues.some(
                    (issue) =>
                      issue.title === data.recommendation?.title &&
                      issue.file_path === data.recommendation?.file_path
                  );
                  return {
                    ...prev,
                    analysisIssues: issueExists
                      ? prev.analysisIssues
                      : [data.recommendation!, ...prev.analysisIssues],
                  };
                });
              }
              break;

            case "COMPLETE":
              // Construct the final AnalysisResponse
              const finalResult: AnalysisResponse = {
                repository: repoUrl,
                recommendations: data.recommendations || [],
                analysis_timestamp:
                  data.analysis_timestamp || new Date().toISOString(),
                // tech_stack can be added if backend sends it
              };
              setState((prev) => ({
                ...prev,
                analysisResult: finalResult,
                isAnalyzing: false, // Analysis is complete
              }));
              eventSource.close(); // Close the connection
              eventSourceRef.current = null;
              break;

            case "HEARTBEAT":
              // Optional: handle heartbeat, e.g., update a 'last seen' timestamp
              break;
          }
        } catch (parseError) {
          console.error("Failed to parse event data:", event.data, parseError);
          // Potentially set an error state here if parsing fails critically
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        setState((prev) => ({
          ...prev,
          error: new Error("EventSource connection failed"),
          isAnalyzing: false,
        }));
        eventSource.close();
        eventSourceRef.current = null;
      };

      // 4. Trigger the actual analysis on the backend
      const analysisResponse = await fetch(`${apiUrl}/analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          important_files: fetchedKeyFiles,
          analysis_id, // Link this request to the stream
        }),
      });

      // Check if triggering the analysis failed *synchronously*
      // Note: Asynchronous errors during analysis are handled by the EventSource onerror
      if (!analysisResponse.ok) {
        // We might get a 404 if the stream was closed/invalidated before analysis started
        if (analysisResponse.status === 404) {
          throw new Error(
            `Analysis stream ${analysis_id} not found on backend.`
          );
        }
        // Or other server errors triggering the analysis
        throw new Error(
          `Failed to trigger analysis: ${analysisResponse.statusText}`
        );
      }

      // Note: We don't process analysisResponse.json() here,
      // the results come via the EventSource.
    } catch (err) {
      console.error("Error during analysis setup:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err : new Error(String(err)),
        isAnalyzing: false, // Ensure loading state is turned off on error
      }));
      // Ensure EventSource is closed on setup error
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };

  // Expose the state and the start function
  return {
    ...state,
    startAnalysis: startAnalysisProcess, // Rename the exported function
  };
}
