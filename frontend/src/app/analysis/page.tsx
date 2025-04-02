"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IdentifyKeyFilesResponse } from "../types/api";
import { FileTree } from "../components/FileTree";

interface AnalysisStep {
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("url") || "";
  const [isLoading, setIsLoading] = useState(true);
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
      title: "Security Check",
      description: "Analyzing security configurations and dependencies",
      status: "pending",
    },
    {
      title: "Performance Review",
      description: "Evaluating performance optimizations",
      status: "pending",
    },
    {
      title: "Deployment Readiness",
      description: "Generating deployment recommendations",
      status: "pending",
    },
  ]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
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
            index === 0
              ? { ...step, status: "completed" }
              : index === 1
              ? { ...step, status: "in_progress" }
              : step
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (repoUrl) {
      fetchFiles();
    }
  }, [repoUrl]);

  const renderKeyFileCategory = (
    category: keyof typeof keyFiles,
    title: string
  ) => {
    const files = keyFiles[category];
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        {Array.isArray(files) && files.length > 0 ? (
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file}
                className="flex items-center space-x-2 p-2 text-sm rounded-lg bg-orange-50 dark:bg-orange-900/20"
              >
                <svg
                  className="w-4 h-4 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{file}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No {category} files identified
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFAF5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Analyzing repository...
          </p>
        </div>
      </div>
    );
  }

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
            {/* Repository Analysis Step */}
            <div
              className={`flex items-start space-x-4 p-4 rounded-lg border-2 ${
                steps[0].status === "completed"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : steps[0].status === "in_progress"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  steps[0].status === "completed"
                    ? "bg-green-500"
                    : steps[0].status === "in_progress"
                    ? "bg-orange-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {steps[0].status === "completed" ? (
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
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    1
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black dark:text-white">
                  {steps[0].title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {steps[0].description}
                </p>

                {/* Repository Analysis Content */}
                {steps[0].status === "completed" && (
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
                        {renderKeyFileCategory("frontend", "Frontend Files")}
                        {renderKeyFileCategory("backend", "Backend Files")}
                        {renderKeyFileCategory("infra", "Infrastructure Files")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remaining Steps */}
            {steps.slice(1).map((step, index) => (
              <div
                key={index + 1}
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
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {index + 2}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
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
            Continue Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
