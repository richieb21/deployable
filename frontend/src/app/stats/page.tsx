"use client";

import { StatsDisplay } from "../components/StatsDisplay";
import { IssuesList } from "../components/IssuesList";
import { useSearchParams } from "next/navigation";
import { StatsLayout } from "../components/StatsLayout";
import { useAnalysis } from "../hooks/useAnalysis";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function StatsPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || "github.com/richieb21/deployable";
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedIssues, setCompletedIssues] = useState<{
    [key: string]: boolean;
  }>({});

  // Extract just the repo name from the URL
  const repoName = repoUrl.split("/").slice(-2).join("/");

  // Fetch analysis data with caching
  const { data, loading, error, refreshAnalysis } = useAnalysis(repoUrl);

  // Set analyzing state based on loading
  useEffect(() => {
    setIsAnalyzing(loading);
  }, [loading]);

  // Load completed issues from localStorage on mount
  useEffect(() => {
    try {
      const storedCompletedIssues = localStorage.getItem("completedIssues");
      if (storedCompletedIssues) {
        setCompletedIssues(JSON.parse(storedCompletedIssues));
      }
    } catch (error) {
      console.error("Error loading completed issues:", error);
    }
  }, []);

  // Handle issue status changes
  const handleIssueStatusChange = (updatedCompletedIssues: {
    [key: string]: boolean;
  }) => {
    setCompletedIssues(updatedCompletedIssues);
  };

  // Add a key to the StatsDisplay component that changes when completedIssues changes
  // This will force a re-render with fresh animations
  const completedIssuesKey = Object.keys(completedIssues).length;

  return (
    <StatsLayout repoName={repoName}>
      <motion.div
        key={`stats-${completedIssuesKey}`}
        initial={{ opacity: 0.8, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatsDisplay
          analysisData={data}
          loading={loading}
          completedIssues={completedIssues}
        />
      </motion.div>

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
