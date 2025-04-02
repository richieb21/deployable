"use client";

import { StatsDisplay } from "../components/StatsDisplay";
import { IssuesList } from "../components/IssuesList";
import { useSearchParams } from "next/navigation";
import { StatsLayout } from "../components/StatsLayout";
import { useAnalysis } from "../hooks/useAnalysis";
import { useState, useEffect } from "react";

export default function StatsPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || "github.com/richieb21/deployable";
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Extract just the repo name from the URL
  const repoName = repoUrl.split("/").slice(-2).join("/");

  // Fetch analysis data
  const { data, loading, error } = useAnalysis(repoUrl);

  // Set analyzing state based on loading
  useEffect(() => {
    setIsAnalyzing(loading);
  }, [loading]);

  return (
    <StatsLayout repoName={repoName}>
      <StatsDisplay analysisData={data} loading={loading} />

      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Issues to Address
          </h2>
          {isAnalyzing && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
              <span className="text-gray-600">Analyzing repository...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error.message}
          </div>
        )}

        <IssuesList recommendations={data?.recommendations} />
      </div>
    </StatsLayout>
  );
}
