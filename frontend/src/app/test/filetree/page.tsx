"use client";

import { useState } from "react";
import { ImportantFiles } from "@/app/components/ImportantFiles";
import { FileTree } from "../../components/FileTree";
import { IdentifyKeyFilesResponse } from "@/app/types/api";

interface AnalysisEvent {
  type: "PROGRESS" | "COMPLETE" | "HEARTBEAT";
  chunk_index?: number;
  files?: string[];
  recommendations_count?: number;
  recommendations?: Array<{
    id: string;
    title: string;
    description: string;
    priority?: number;
  }>;
  analysis_timestamp?: string;
}

export default function FileTreeTestPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [keyFiles, setKeyFiles] = useState<{
    frontend: string[];
    backend: string[];
    infra: string[];
  }>({
    frontend: [],
    backend: [],
    infra: [],
  });
  const [highlightedFiles, setHighlightedFiles] = useState<Set<string>>(
    new Set()
  );
  // const [analysisId, setAnalysisId] = useState<string | null>(null);

  const startAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHighlightedFiles(new Set());

      // 1. Start the analysis stream
      const startResponse = await fetch("http://localhost:8000/stream/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: url }),
      });

      if (!startResponse.ok) {
        throw new Error("Failed to start analysis");
      }

      const { analysis_id } = await startResponse.json();
      // setAnalysisId(analysis_id);

      // 2. Connect to the event stream
      const eventSource = new EventSource(
        `http://localhost:8000/stream/analysis/${analysis_id}`,
        { withCredentials: false }
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as AnalysisEvent;
        console.log("Received event:", data);

        if (data.type === "PROGRESS" && data.files) {
          console.log("Highlighting files:", data.files);
          setHighlightedFiles((prev) => {
            const newSet = new Set([...prev, ...data.files!]);
            console.log("Current highlighted files:", Array.from(newSet));
            return newSet;
          });
        }

        if (data.type === "COMPLETE") {
          eventSource.close();
          setIsLoading(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setError("Stream connection error");
        setIsLoading(false);
      };

      // 3. Start the actual analysis
      const analysisResponse = await fetch("http://localhost:8000/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: url,
          important_files: keyFiles,
          analysis_id,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Analysis failed to start");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/analysis/key-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repository files");
      }

      const data: IdentifyKeyFilesResponse = await response.json();
      setFiles(data.all_files);
      setKeyFiles(data.key_files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF5] dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            FileTree Component Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the FileTree component with sample repository data
          </p>
        </div>

        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-6 py-4 bg-white dark:bg-gray-900 border-2 border-black/10 dark:border-white/10 rounded-xl 
                           focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 
                           placeholder:text-gray-400 dark:placeholder:text-gray-600
                           text-black dark:text-white"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !url}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold 
                          hover:bg-gray-800 dark:hover:bg-gray-100 transition whitespace-nowrap
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Loading..." : "Analyze Repository"}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        {files.length > 0 && (
          <div className="mb-4">
            <button
              onClick={startAnalysis}
              disabled={isLoading || !url}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold 
                        hover:bg-orange-600 transition whitespace-nowrap
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : "Start Analysis"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Repository Structure
            </h2>
            {files.length > 0 ? (
              <FileTree files={files} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No repository analyzed yet
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Important Files
            </h2>
            {files.length > 0 ? (
              <ImportantFiles
                key_files={keyFiles}
                highlightedFiles={highlightedFiles}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No repository analyzed yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
