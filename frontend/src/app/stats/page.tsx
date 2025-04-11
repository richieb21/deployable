"use client";

import { StatsDisplay } from "../components/StatsDisplay";
import { IssuesList } from "../components/IssuesList";
import { ImportantFiles } from "../components/ImportantFiles";
import { FileTree } from "../components/FileTree";
import { AnimatedLogo } from "../components/AnimatedLogo";
import { useSearchParams } from "next/navigation";
import { StatsLayout } from "../components/StatsLayout";
import { useAnalysis } from "../hooks/useAnalysis";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { IdentifyKeyFilesResponse, Recommendation } from "../types/api";

interface AnalysisEvent {
  type: "PROGRESS" | "COMPLETE" | "HEARTBEAT";
  chunk_index?: number;
  files?: string[];
  recommendations_count?: number;
  recommendations?: Recommendation[];
  analysis_timestamp?: string;
}

export default function StatsPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || "github.com/richieb21/deployable";

  // Extract owner and repo from the URL
  const repoUrlParts = repoUrl
    .replace(/^https?:\/\/(www\.)?github\.com\//, "")
    .split("/");
  const repoOwner = repoUrlParts[0] || "";
  const repoName = repoUrlParts[1] || "";

  const [completedIssues, setCompletedIssues] = useState<{
    [key: string]: boolean;
  }>({});
  const prevCompletedCountRef = useRef(0);
  const changedIssueIdRef = useRef<string | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // New state for file tree and analysis streaming
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch analysis data with caching
  const { data, loading, error, refreshAnalysis } = useAnalysis(repoUrl);

  // Load completed issues from localStorage on mount
  useEffect(() => {
    try {
      const storedCompletedIssues = localStorage.getItem("completedIssues");
      if (storedCompletedIssues) {
        const parsed = JSON.parse(storedCompletedIssues);
        setCompletedIssues(parsed);
        prevCompletedCountRef.current = Object.keys(parsed).length;
      }
    } catch (error) {
      console.error("Error loading completed issues:", error);
    }
  }, []);

  // Handle issue status changes
  const handleIssueStatusChange = (
    updatedCompletedIssues: { [key: string]: boolean },
    changedIssueId: string
  ) => {
    // Track which issue was changed
    changedIssueIdRef.current = changedIssueId;
    setCompletedIssues(updatedCompletedIssues);
  };

  // Handle scroll to show/hide progress bar
  useEffect(() => {
    const handleScroll = () => {
      // Show progress bar when scrolled past 300px
      setShowProgressBar(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update overall score when data or completed issues change
  const handleScoreUpdate = (score: number) => {
    setOverallScore(score);
  };

  const handleSelectAll = () => {
    if (!data?.recommendations) return;

    // Get all unresolved issues
    const unresolvedIssues = data.recommendations
      .filter((rec) => !completedIssues[`${rec.title}-${rec.file_path}`])
      .map((rec) => `${rec.title}-${rec.file_path}`);

    // If we already have some selected issues, clear the selection
    if (selectedIssues.size > 0) {
      setSelectedIssues(new Set());
      setShowBulkActions(false);
    } else if (unresolvedIssues.length > 0) {
      // Otherwise, select all unresolved issues
      setSelectedIssues(new Set(unresolvedIssues));
      setShowBulkActions(true);
    }
  };

  // Add a new function to handle completing all selected issues
  const handleCompleteAll = () => {
    if (selectedIssues.size === 0) return;

    // Create a copy of the current completedIssues
    const updatedCompletedIssues = { ...completedIssues };

    // Mark all selected issues as completed
    selectedIssues.forEach((issueId) => {
      updatedCompletedIssues[issueId] = true;
    });

    // Update state
    setCompletedIssues(updatedCompletedIssues);

    // Save to localStorage
    try {
      localStorage.setItem(
        "completedIssues",
        JSON.stringify(updatedCompletedIssues)
      );
    } catch (error) {
      console.error("Error saving completed issues:", error);
    }

    // Clear selection and hide bulk actions
    setSelectedIssues(new Set());
    setShowBulkActions(false);

    // Set the last changed issue ID to trigger animations
    changedIssueIdRef.current = "bulk-update";
  };

  // New function to handle starting analysis with streaming
  const startAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setHighlightedFiles(new Set());

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
          setHighlightedFiles((prev) => {
            const newSet = new Set([...prev, ...data.files!]);
            return newSet;
          });
        }

        if (data.type === "COMPLETE") {
          eventSource.close();
          // Do NOT trigger refreshAnalysis here as it causes the UI to revert
          // Instead, set a flag to check if analysis is complete
          setIsAnalyzing(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setIsAnalyzing(false);
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
      setIsAnalyzing(false);
    }
  };

  // Function to fetch repository files
  const fetchRepositoryFiles = async () => {
    try {
      setIsAnalyzing(true);
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

      const data: IdentifyKeyFilesResponse = await response.json();
      setFiles(data.all_files);
      setKeyFiles(data.key_files);

      // Once we have files, start the streaming analysis
      await startAnalysis();

      // Important: Don't call refreshAnalysis here and don't set isAnalyzing to false
      // Let the event stream completion handle the state change
    } catch (err) {
      console.error("Error:", err);
      setIsAnalyzing(false);
    }
  };

  const handleRefresh = () => {
    // Clear created issues state
    localStorage.removeItem("createdIssues");

    // We don't want to call refreshAnalysis here directly
    // Instead, fetch repository files and start streaming analysis
    fetchRepositoryFiles();
  };

  // Add an effect to load analysis after streaming completes
  useEffect(() => {
    // If we have files but analysis is no longer in progress,
    // and there's no current data, refresh the analysis data
    if (files.length > 0 && !isAnalyzing && !data) {
      refreshAnalysis();
    }
  }, [isAnalyzing, files.length, data, refreshAnalysis]);

  return (
    <StatsLayout
      repoName={`${repoOwner}/${repoName}`}
      onRefresh={handleRefresh}
    >
      {/* Floating progress bar */}
      <AnimatePresence>
        {showProgressBar && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-0 right-0 z-20 ${
              theme === "dark"
                ? "bg-[#121212]/80 backdrop-blur-md border-b border-gray-800/50"
                : "bg-[#f9fafb]/80 backdrop-blur-md border-b border-gray-200"
            } py-2 px-4`}
          >
            <div className="max-w-5xl mx-auto flex items-center gap-4">
              <div
                className={`text-lg sm:text-xl font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                } min-w-[40px] text-center`}
              >
                {overallScore}
              </div>
              <div
                className={`flex-1 ${
                  theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                } rounded-full h-2.5`}
              >
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${overallScore}%`,
                    backgroundColor:
                      overallScore >= 80
                        ? "#4ADE80"
                        : overallScore >= 50
                          ? "#FBBF24"
                          : "#EF4444",
                  }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show File Tree and Important Files during analysis */}
      {isAnalyzing ? (
        <div className="mt-8">
          <div className="mb-6 flex justify-center">
            <AnimatedLogo size={100} loadingText="Finding important files..." />
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div
                className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                <h2 className="text-xl font-semibold mb-4">
                  Repository Structure
                </h2>
                <FileTree files={files} />
              </div>

              <div
                className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                <h2 className="text-xl font-semibold mb-4">Important Files</h2>
                <ImportantFiles
                  key_files={keyFiles}
                  highlightedFiles={highlightedFiles}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <StatsDisplay
            analysisData={data}
            loading={loading}
            completedIssues={completedIssues}
            changedIssueId={changedIssueIdRef.current}
            onScoreUpdate={handleScoreUpdate}
          />

          <div className="mt-8 sm:mt-16">
            <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 max-w-5xl mx-auto px-2">
              <h2
                className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-0 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Issues to Address
              </h2>

              <div className="sm:ml-auto flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <AnimatePresence>
                  {showBulkActions && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-2"
                    >
                      <span
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {selectedIssues.size} selected
                      </span>
                      <button
                        onClick={handleCompleteAll}
                        className={`flex items-center px-3 sm:px-4 py-2 ${
                          theme === "dark"
                            ? "bg-[#2A2D31] text-gray-300 hover:bg-[#353A40]"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        } rounded transition-colors text-sm`}
                      >
                        <svg
                          className="w-4 h-4 mr-1 sm:mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Complete All
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleSelectAll}
                  className={`flex items-center px-3 sm:px-4 py-2 ${
                    theme === "dark"
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } rounded transition-colors text-sm`}
                >
                  <svg
                    className="w-4 h-4 mr-1 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  {selectedIssues.size > 0 ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6 max-w-5xl mx-auto">
                Error: {error.message}
              </div>
            )}

            <IssuesList
              recommendations={data?.recommendations}
              loading={loading}
              onIssueStatusChange={handleIssueStatusChange}
              selectedIssues={selectedIssues}
              onSelectionChange={setSelectedIssues}
              completedIssues={completedIssues}
              repoOwner={repoOwner}
              repoName={repoName}
            />
          </div>
        </>
      )}
    </StatsLayout>
  );
}
