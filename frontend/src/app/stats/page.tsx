"use client";

import { StatsDisplay } from "@/app/components/display/StatsDisplay";
import { IssuesList } from "@/app/components/display/IssuesList";
import { AnalysisView } from "@/app/components/loading/AnalysisView";
import { useSearchParams } from "next/navigation";
import { StatsLayout } from "@/app/components/display/StatsLayout";
import { useAnalysis } from "@/app/hooks/useAnalysis";
import { useStreamingAnalysis } from "@/app/hooks/useStreamingAnalysis";
import { useIssueCompletion } from "@/app/hooks/useIssueCompletion";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

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

  // Use our custom hooks
  const {
    completedIssues,
    changedIssueId,
    handleIssueStatusChange,
    handleCompleteAll,
  } = useIssueCompletion();
  const { data, loading, error, refreshAnalysis } = useAnalysis(repoUrl);
  const {
    files,
    keyFiles,
    highlightedFiles,
    isAnalyzing,
    analysisIssues,
    startAnalysis,
  } = useStreamingAnalysis(repoUrl);

  const [showProgressBar, setShowProgressBar] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Automatically start analysis when the page loads for the first time
  useEffect(() => {
    if (!initialLoadDone && !data && !isAnalyzing) {
      startAnalysis();
      setInitialLoadDone(true);
    }
  }, [data, isAnalyzing, initialLoadDone, startAnalysis]);

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

  // Handle completing all selected issues
  const handleCompleteSelected = () => {
    if (selectedIssues.size === 0) return;

    // Use the bulk complete handler from our hook
    handleCompleteAll(selectedIssues);

    // Clear selection and hide bulk actions
    setSelectedIssues(new Set());
    setShowBulkActions(false);
  };

  // Add an effect to load analysis after streaming completes
  useEffect(() => {
    // If we have files but analysis is no longer in progress,
    // and there's no current data, refresh the analysis data
    if (files.length > 0 && !isAnalyzing && !data) {
      refreshAnalysis();
    }
  }, [isAnalyzing, files.length, data, refreshAnalysis]);

  const handleRefresh = () => {
    // Clear created issues state
    localStorage.removeItem("createdIssues");

    // Reset initial load flag to ensure we can restart analysis from scratch
    setInitialLoadDone(false);

    // Start the streaming analysis process
    startAnalysis();
  };

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

      {/* Show Analysis View during analysis */}
      {isAnalyzing ? (
        <AnalysisView
          files={files}
          keyFiles={keyFiles}
          highlightedFiles={highlightedFiles}
          theme={theme}
          issues={analysisIssues}
        />
      ) : (
        <>
          <StatsDisplay
            analysisData={data}
            loading={loading}
            completedIssues={completedIssues}
            changedIssueId={changedIssueId}
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
                        onClick={handleCompleteSelected}
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
