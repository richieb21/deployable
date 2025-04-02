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

  // Extract just the repo name from the URL
  const repoName = repoUrl.split("/").slice(-2).join("/");

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
        <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto px-2">
          <h2 className="text-2xl font-bold text-white">Issues to Address</h2>

          <button
            onClick={refreshAnalysis}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                Refresh Analysis
              </>
            )}
          </button>
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
        />
      </div>
    </StatsLayout>
  );
}
