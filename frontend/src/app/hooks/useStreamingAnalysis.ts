"use client";

import { useState } from "react";
import { Recommendation } from "../types/api";

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
}

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
  });

  // Function to fetch repository files
  const fetchRepositoryFiles = async () => {
    try {
      setState((prev) => ({ ...prev, isAnalyzing: true }));
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/analysis/key-files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repository files");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        files: data.all_files,
        keyFiles: data.key_files,
      }));

      // Once we have files, start the streaming analysis
      await startAnalysis(data.all_files, data.key_files);
    } catch (err) {
      console.error("Error:", err);
      setState((prev) => ({ ...prev, isAnalyzing: false }));
    }
  };

  // Function to handle starting analysis with streaming
  const startAnalysis = async (
    files: string[],
    keyFiles: KeyFilesStructure
  ) => {
    try {
      setState((prev) => ({
        ...prev,
        highlightedFiles: new Set<string>(),
        analysisIssues: [],
      }));

      // 1. Start the analysis stream
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const startResponse = await fetch(`${apiUrl}/stream/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!startResponse.ok) {
        throw new Error("Failed to start analysis");
      }

      const { analysis_id } = await startResponse.json();

      // 2. Connect to the event stream
      const eventSource = new EventSource(
        `${apiUrl}/stream/analysis/${analysis_id}`,
        { withCredentials: false }
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as AnalysisEvent;
        console.log("Received event:", data);

        if (data.type === "PROGRESS" && data.files) {
          setState((prev) => ({
            ...prev,
            highlightedFiles: new Set([
              ...Array.from(prev.highlightedFiles),
              ...data.files!,
            ]),
          }));
        }

        // Handle both array of recommendations and single recommendation
        if (data.type === "RECOMMENDATION") {
          if (
            data.recommendations &&
            Array.isArray(data.recommendations) &&
            data.recommendations.length > 0
          ) {
            const newIssues = data.recommendations as Recommendation[];
            setState((prev) => ({
              ...prev,
              analysisIssues: [...prev.analysisIssues, ...newIssues],
            }));
          } else if (data.recommendation) {
            // Handle single recommendation - ensuring it's not undefined
            const recommendation = data.recommendation;
            setState((prev) => ({
              ...prev,
              analysisIssues: [...prev.analysisIssues, recommendation],
            }));
          }
        }

        if (data.type === "COMPLETE") {
          eventSource.close();
          setState((prev) => ({ ...prev, isAnalyzing: false }));
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setState((prev) => ({ ...prev, isAnalyzing: false }));
      };

      // 3. Start the actual analysis
      const analysisResponse = await fetch(`${apiUrl}/analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          important_files: keyFiles,
          analysis_id,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Analysis failed to start");
      }
    } catch (err) {
      console.error("Error:", err);
      setState((prev) => ({ ...prev, isAnalyzing: false }));
    }
  };

  return {
    ...state,
    startAnalysis: fetchRepositoryFiles,
  };
}
