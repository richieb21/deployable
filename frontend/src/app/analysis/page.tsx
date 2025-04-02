"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface File {
  name: string;
  path: string;
  type: "file" | "directory";
}

interface AnalysisStep {
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("url") || "";

  // Sample data for demonstration
  const [files, setFiles] = useState<File[]>([
    { name: "package.json", path: "/package.json", type: "file" },
    { name: "src", path: "/src", type: "directory" },
    { name: "README.md", path: "/README.md", type: "file" },
    { name: "Dockerfile", path: "/Dockerfile", type: "file" },
  ]);

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  const steps: AnalysisStep[] = [
    {
      title: "Repository Analysis",
      description: "Scanning repository structure and identifying key files",
      status: "completed",
    },
    {
      title: "File Selection",
      description: "Select additional files to analyze",
      status: "in_progress",
    },
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
  ];

  const toggleFileSelection = (path: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelectedFiles(newSelection);
  };

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

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="space-y-4">
            {steps.map((step, index) => (
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
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
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

        {/* File Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Select Files to Analyze
          </h2>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => toggleFileSelection(file.path)}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => {}}
                  className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                />
                <div className="flex items-center space-x-2">
                  {file.type === "directory" ? (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {file.name}
                  </span>
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
