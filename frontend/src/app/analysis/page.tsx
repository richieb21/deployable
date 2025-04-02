"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IdentifyKeyFilesResponse } from "../types/api";
import { FileTree } from "../components/FileTree";
import { KeyFileCategory } from "../components/KeyFileCategory";

interface AnalysisStep {
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("url") || "";
  const [error, setError] = useState<string | null>(null);
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [keyFiles, setKeyFiles] = useState<
    IdentifyKeyFilesResponse["key_files"]
  >({
    frontend: [],
    backend: [],
    infra: [],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<AnalysisStep[]>([
    {
      title: "Repository Analysis",
      description: "Scanning repository structure and identifying key files",
      status: "pending",
    },
    // {
    //   title: "File Selection",
    //   description: "Select additional files to analyze",
    //   status: "pending",
    // },
    {
      title: "Deployment Readiness",
      description: "Analyzing security configurations and dependencies",
      status: "pending",
    },
    {
      title: "Create Issues (beta)",
      description: "Generating deployment recommendations",
      status: "pending",
    },
  ]);

  // Add function to start repository analysis
  const startRepositoryAnalysis = async () => {
    try {
      setSteps((prev) =>
        prev.map((step, index) =>
          index === 0 ? { ...step, status: "in_progress" } : step
        )
      );

      const response = await fetch("/api/analysis/key-files", {
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
      setAllFiles(data.all_files);
      setKeyFiles(data.key_files);
      setSteps((prev) =>
        prev.map((step, index) =>
          index === 0 ? { ...step, status: "completed" } : step
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Remove the automatic start from useEffect
  useEffect(() => {
    // Only initialize the steps, don't start analysis
    if (repoUrl) {
      setSteps((prev) =>
        prev.map((step, index) =>
          index === 0 ? { ...step, status: "pending" } : step
        )
      );
    }
  }, [repoUrl]);

  const renderStep = (step: AnalysisStep, index: number) => {
    // For first step, show button if pending
    const canStart =
      (index === 0 && step.status === "pending") ||
      // For other steps, show button if previous step is completed and this step is pending
      (index > 0 &&
        steps[index - 1].status === "completed" &&
        step.status === "pending");

    return (
      <div
        key={index}
        className={`flex items-start space-x-4 p-4 rounded-lg border-2 ${
          step.status === "completed"
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : step.status === "in_progress"
            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
            : "border-gray-200 dark:border-gray-700"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step.status === "completed"
              ? "bg-green-500"
              : step.status === "in_progress"
              ? "bg-orange-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {step.status === "completed" ? (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : step.status === "in_progress" ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {index + 1}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-black dark:text-white">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
            {canStart && (
              <button
                onClick={() => {
                  if (index === 0) {
                    startRepositoryAnalysis();
                  } else {
                    // Handle other steps' start logic
                    setSteps((prev) =>
                      prev.map((s, i) =>
                        i === index ? { ...s, status: "in_progress" } : s
                      )
                    );
                  }
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                Start
              </button>
            )}
          </div>

          {/* Repository Analysis Content */}
          {index === 0 && step.status === "completed" && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File Tree */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-sm font-semibold text-black dark:text-white mb-3">
                  Repository Structure
                </h2>
                <div className="max-h-[300px] overflow-y-auto">
                  <FileTree files={allFiles} />
                </div>
              </div>

              {/* Key Files */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-sm font-semibold text-black dark:text-white mb-3">
                  Key Files Identified
                </h2>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  <KeyFileCategory
                    category="frontend"
                    title="Frontend Files"
                    files={keyFiles.frontend}
                  />
                  <KeyFileCategory
                    category="backend"
                    title="Backend Files"
                    files={keyFiles.backend}
                  />
                  <KeyFileCategory
                    category="infra"
                    title="Infrastructure Files"
                    files={keyFiles.infra}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFAF5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF5] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            Analyzing Repository
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{repoUrl}</p>
        </div>

        {/* Progress Steps with Repository Analysis */}
        <div className="mb-12">
          <div className="space-y-4">
            {steps.map((step, index) => renderStep(step, index))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => window.history.back()}
          >
            Back
          </button>
          <button
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            LGTM! 👍
          </button>
        </div>
      </div>
    </div>
  );
}
