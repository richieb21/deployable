"use client";

import { AnimatedLogo } from "@/app/components/ui/AnimatedLogo";
import { FileTree } from "@/app/components/loading/FileTree";
import { ImportantFiles } from "@/app/components/loading/ImportantFiles";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import the Recommendation type
import { Recommendation } from "@/app/types/api";

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
  const issuesContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll issues container when new issues arrive
  useEffect(() => {
    if (issuesContainerRef.current && issues.length > 0) {
      issuesContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [issues.length]);

  // Get color for issue severity
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return theme === "dark" ? "text-red-300" : "text-red-700";
      case "high":
        return theme === "dark" ? "text-orange-300" : "text-orange-700";
      case "medium":
        return theme === "dark" ? "text-yellow-300" : "text-yellow-700";
      case "low":
        return theme === "dark" ? "text-emerald-300" : "text-emerald-700";
      default:
        return theme === "dark" ? "text-gray-300" : "text-gray-700";
    }
  };

  // Get background color for issue severity
  const getSeverityBgColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return theme === "dark" ? "bg-red-800/60" : "bg-red-100/80";
      case "high":
        return theme === "dark" ? "bg-orange-800/60" : "bg-orange-100/80";
      case "medium":
        return theme === "dark" ? "bg-yellow-700/60" : "bg-yellow-100/80";
      case "low":
        return theme === "dark" ? "bg-emerald-800/70" : "bg-emerald-100/80";
      default:
        return theme === "dark" ? "bg-gray-800/60" : "bg-gray-100/80";
    }
  };

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
                className={`text-base font-medium mb-2 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
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
                theme === "dark" ? "bg-[#1A1817]" : "bg-gray-50"
              } rounded-xl shadow-sm p-3 md:p-4 border ${
                theme === "dark" ? "border-[#1F1F1F]" : "border-gray-200"
              }
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
                theme === "dark" ? "bg-[#1A1817]" : "bg-gray-50"
              } rounded-xl shadow-sm p-3 md:p-4 border ${
                theme === "dark" ? "border-[#1F1F1F]" : "border-gray-200"
              }
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
                theme === "dark" ? "bg-[#1A1817]" : "bg-gray-50"
              } rounded-xl shadow-sm p-3 md:p-4 border ${
                theme === "dark" ? "border-[#1F1F1F]" : "border-gray-200"
              }
                ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              <h2
                className={`text-base font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Issues
              </h2>
              <div
                ref={issuesContainerRef}
                className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scroll-smooth"
              >
                {issues && issues.length > 0 ? (
                  <ul className="space-y-2">
                    <AnimatePresence initial={false}>
                      {issues.map((issue, index) => (
                        <motion.li
                          key={issue.title + index}
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                            marginBottom: 8,
                          }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className={`${getSeverityBgColor(issue.severity)} rounded-lg p-3`}
                        >
                          <div
                            className={`font-medium ${getSeverityColor(issue.severity)} text-sm`}
                          >
                            {issue.title}
                          </div>
                          <div
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {issue.file_path}
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <div
                    className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
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
