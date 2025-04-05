"use client";

import { StatsDisplay } from "../components/StatsDisplay";
import { IssuesList } from "../components/IssuesList";
import { useSearchParams } from "next/navigation";
import { StatsLayout } from "../components/StatsLayout";
import { useAnalysis } from "../hooks/useAnalysis";
import { useState, useEffect, useRef } from "react";
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

  const [completedIssues, setCompletedIssues] = useState<{
    [key: string]: boolean;
  }>({});
  const prevCompletedCountRef = useRef(0);
  const changedIssueIdRef = useRef<string | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

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

  const handleRefresh = () => {
    // Clear created issues state
    localStorage.removeItem("createdIssues");

    // Call the refreshAnalysis function
    refreshAnalysis();
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
                className={`text-xl font-semibold ${
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

      <StatsDisplay
        analysisData={data}
        loading={loading}
        completedIssues={completedIssues}
        changedIssueId={changedIssueIdRef.current}
        onScoreUpdate={handleScoreUpdate}
      />

      <div className="mt-16">
        <div className="flex items-center mb-6 max-w-5xl mx-auto px-2">
          <h2
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Issues to Address
          </h2>

          <div className="ml-auto flex items-center space-x-4">
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
                    className={`flex items-center px-4 py-2 ${
                      theme === "dark"
                        ? "bg-[#2A2D31] text-gray-300 hover:bg-[#353A40]"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } rounded transition-colors`}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
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
              className={`flex items-center px-4 py-2 ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } rounded transition-colors`}
            >
              <svg
                className="w-4 h-4 mr-2"
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
    </StatsLayout>
  );
}
