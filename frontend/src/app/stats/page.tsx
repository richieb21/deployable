"use client";

import { StatsDisplay } from "../components/StatsDisplay";
import { IssuesList } from "../components/IssuesList";
import { useSearchParams } from "next/navigation";
import { StatsLayout } from "../components/StatsLayout";
import { useAnalysis } from "../hooks/useAnalysis";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StatsPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || "github.com/richieb21/deployable";
  const [completedIssues, setCompletedIssues] = useState<{
    [key: string]: boolean;
  }>({});
  const prevCompletedCountRef = useRef(0);
  const changedIssueIdRef = useRef<string | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Extract just the repo name from the URL
  const repoName = repoUrl.split("/").slice(-2).join("/");

  // Fetch analysis data with caching
  const { data, loading, error } = useAnalysis(repoUrl);

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
    const uncompleted =
      data?.recommendations?.filter(
        (rec) => !completedIssues[`${rec.title}-${rec.file_path}`]
      ) || [];

    if (selectedIssues.size > 0) {
      setSelectedIssues(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIssues(
        new Set(uncompleted.map((rec) => `${rec.title}-${rec.file_path}`))
      );
      setShowBulkActions(true);
    }
  };

  return (
    <StatsLayout repoName={repoName}>
      {/* Floating progress bar */}
      <AnimatePresence>
        {showProgressBar && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-20 bg-[#121212]/80 backdrop-blur-md py-2 px-4 border-b border-gray-800/50"
          >
            <div className="max-w-5xl mx-auto flex items-center gap-4">
              <div className="text-xl font-semibold text-white min-w-[40px] text-center">
                {overallScore}
              </div>
              <div className="flex-1 bg-gray-800/50 rounded-full h-2.5">
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
          <h2 className="text-2xl font-bold text-white">Issues to Address</h2>

          <div className="ml-auto flex items-center space-x-4">
            <AnimatePresence>
              {showBulkActions && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-sm text-gray-400">
                    {selectedIssues.size} selected
                  </span>
                  <button className="flex items-center px-4 py-2 bg-[#2A2D31] text-gray-300 hover:bg-[#353A40] rounded transition-colors">
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Issues
                  </button>
                  <button className="flex items-center px-4 py-2 bg-[#2A2D31] text-gray-300 hover:bg-[#353A40] rounded transition-colors">
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
              className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
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
        />
      </div>
    </StatsLayout>
  );
}
