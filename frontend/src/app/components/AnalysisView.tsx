"use client";

import { AnimatedLogo } from "./AnimatedLogo";
import { FileTree } from "./FileTree";
import { ImportantFiles } from "./ImportantFiles";
import { useState, useEffect, useRef } from "react";

// Import the Recommendation type
import { Recommendation } from "../types/api";

interface AnalysisViewProps {
  files: string[];
  keyFiles: {
    frontend: string[];
    backend: string[];
    infra: string[];
  };
  highlightedFiles: Set<string>;
  theme: "dark" | "light";
  issues?: Recommendation[];
}

export const AnalysisView = ({
  files,
  keyFiles,
  highlightedFiles,
  theme,
  issues = [],
}: AnalysisViewProps) => {
  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing");
  const [dots, setDots] = useState("");
  const animationRef = useRef<number | null>(null);

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Update status text based on analysis stage
  useEffect(() => {
    if (files.length === 0) {
      setStatusText("Initializing");
    } else if (
      keyFiles.frontend.length === 0 &&
      keyFiles.backend.length === 0 &&
      keyFiles.infra.length === 0
    ) {
      setStatusText("Finding important files");
    } else if (highlightedFiles.size === 0) {
      setStatusText("Analyzing repository structure");
    } else if (issues.length === 0) {
      setStatusText("Identifying issues");
    } else {
      setStatusText("Finalizing analysis");
    }
  }, [files, keyFiles, highlightedFiles, issues]);

  // Calculate target progress based on the analysis state
  useEffect(() => {
    let newProgress = 0;

    // Start with 15% when we have repo data
    if (files.length > 0) {
      newProgress = 15;

      // Jump to 30% when we have important files
      if (
        keyFiles.frontend.length > 0 ||
        keyFiles.backend.length > 0 ||
        keyFiles.infra.length > 0
      ) {
        newProgress = 30;

        // Calculate remaining progress based on highlighted files
        if (highlightedFiles.size > 0) {
          // Calculate percentage of files analyzed
          const totalKeyFiles =
            keyFiles.frontend.length +
            keyFiles.backend.length +
            keyFiles.infra.length;
          const percentAnalyzed = Math.min(
            highlightedFiles.size / totalKeyFiles,
            1
          );

          // Distribute the remaining 70% based on file analysis progress
          newProgress += percentAnalyzed * 70;
        }
      }
    }

    setTargetProgress(newProgress);
  }, [files, keyFiles, highlightedFiles]);

  // Animate the progress smoothly
  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const animateProgress = () => {
      setProgress((currentProgress) => {
        // If we've reached or exceeded the target, stop animation
        if (currentProgress >= targetProgress) {
          return targetProgress;
        }

        // Otherwise, increment by a small amount
        const increment = Math.max(
          0.3,
          (targetProgress - currentProgress) * 0.03
        );
        const newProgress = Math.min(
          currentProgress + increment,
          targetProgress
        );

        // Continue animation if not at target
        if (newProgress < targetProgress) {
          animationRef.current = requestAnimationFrame(animateProgress);
        }

        return newProgress;
      });
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animateProgress);

    // Cleanup on unmount or when targetProgress changes
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetProgress]);

  return (
    <div className="mt-2 flex flex-col items-center">
      {/* Container to limit width on all content */}
      <div className="w-full max-w-7xl px-3">
        {/* Header section with logo and progress indicator */}
        <div className="mb-8 w-full">
          <div className="flex items-center">
            <div className="mr-3 shrink-0">
              <AnimatedLogo size={48} theme={theme} />
            </div>
            <div className="flex-1 flex flex-col">
              <div
                className={`text-sm mb-2 ${
                  theme === "dark" ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {statusText}
                {dots}
              </div>
              <div
                className={`w-full h-3 ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                } rounded-full overflow-hidden`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    theme === "dark" ? "bg-white" : "bg-black"
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 w-full">
            {/* Repository Structure (3/12 = 25% on desktop, full width on mobile) */}
            <div
              className={`md:col-span-3 ${
                theme === "dark" ? "bg-[#13151a]" : "bg-gray-50"
              } rounded-xl shadow-sm p-3 md:p-4 
                ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              <h2
                className={`text-base font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Repo
              </h2>
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                <FileTree files={files} />
              </div>
            </div>

            {/* Important Files (5/12 ≈ 42% on desktop, full width on mobile) */}
            <div
              className={`md:col-span-5 ${
                theme === "dark" ? "bg-[#13151a]" : "bg-gray-50"
              } rounded-xl shadow-sm p-3 md:p-4 
                ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              <h2
                className={`text-lg font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Important Files
              </h2>
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                <ImportantFiles
                  key_files={keyFiles}
                  highlightedFiles={highlightedFiles}
                />
              </div>
            </div>

            {/* Issues (4/12 ≈ 33% on desktop, full width on mobile) */}
            <div
              className={`md:col-span-4 ${
                theme === "dark" ? "bg-[#13151a]" : "bg-gray-50"
              } rounded-xl shadow-sm p-3 md:p-4 
                ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              <h2
                className={`text-base font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Issues
              </h2>
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                {issues && issues.length > 0 ? (
                  <ul className="space-y-2">
                    {issues.map((issue, index) => (
                      <li
                        key={index}
                        className="border-b border-gray-800/20 pb-2"
                      >
                        <div
                          className={`font-medium ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}
                        >
                          {issue.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {issue.file_path}
                        </div>
                        <div
                          className={`text-xs mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                        >
                          {issue.description.substring(0, 100)}...
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Issues will appear as analysis progresses...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
