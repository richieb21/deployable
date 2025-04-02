"use client";

import { Recommendation } from "../types/api";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type IssueSeverity = "HIGH" | "MEDIUM" | "LOW";

const getSeverityColor = (severity: IssueSeverity) => {
  switch (severity) {
    case "HIGH":
      return "bg-red-500";
    case "MEDIUM":
      return "bg-yellow-500";
    case "LOW":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

// Get severity weight for sorting (higher number = higher severity)
const getSeverityWeight = (severity: string): number => {
  switch (severity.toUpperCase()) {
    case "HIGH":
    case "CRITICAL":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
};

// Type for completed issues
interface CompletedIssues {
  [key: string]: boolean;
}

export const IssuesList = ({
  recommendations = [],
  loading = false,
  onIssueStatusChange,
}: {
  recommendations?: Recommendation[];
  loading?: boolean;
  onIssueStatusChange?: (
    completedIssues: CompletedIssues,
    changedIssueId: string
  ) => void;
}) => {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [completedIssues, setCompletedIssues] = useState<CompletedIssues>({});
  const prevCompletedRef = useRef<CompletedIssues>({});
  const changedIssueIdRef = useRef<string | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Load completed issues from localStorage on mount
  useEffect(() => {
    if (recommendations.length > 0) {
      try {
        const storedCompletedIssues = localStorage.getItem("completedIssues");
        if (storedCompletedIssues) {
          setCompletedIssues(JSON.parse(storedCompletedIssues));
        }
      } catch (error) {
        console.error("Error loading completed issues:", error);
      }
    }
  }, [recommendations]);

  // Save completed issues to localStorage when they change
  useEffect(() => {
    // Store previous state for comparison
    const hasChanged =
      JSON.stringify(prevCompletedRef.current) !==
      JSON.stringify(completedIssues);

    if (Object.keys(completedIssues).length > 0 && hasChanged) {
      try {
        localStorage.setItem(
          "completedIssues",
          JSON.stringify(completedIssues)
        );

        // Notify parent component about the change with the changed issue ID
        if (onIssueStatusChange && changedIssueIdRef.current) {
          onIssueStatusChange(completedIssues, changedIssueIdRef.current);
          changedIssueIdRef.current = null; // Reset after use
        }

        // Update the previous state reference
        prevCompletedRef.current = { ...completedIssues };

        // Restore scroll position after state update
        if (scrollPositionRef.current) {
          setTimeout(() => {
            window.scrollTo({
              top: scrollPositionRef.current,
              behavior: "auto",
            });
            scrollPositionRef.current = 0;
          }, 0);
        }
      } catch (error) {
        console.error("Error saving completed issues:", error);
      }
    }
  }, [completedIssues, onIssueStatusChange]);

  const toggleIssueCompletion = (issueId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent expanding/collapsing when clicking the button

    // Store current scroll position
    scrollPositionRef.current = window.scrollY;

    // Store the changed issue ID
    changedIssueIdRef.current = issueId;

    setCompletedIssues((prev) => {
      const newCompletedIssues = {
        ...prev,
        [issueId]: !prev[issueId],
      };
      return newCompletedIssues;
    });
  };

  // Sort recommendations: first by completion status, then by severity
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const aCompleted = completedIssues[`${a.title}-${a.file_path}`] || false;
    const bCompleted = completedIssues[`${b.title}-${b.file_path}`] || false;

    // First sort by completion status
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    // Then sort by severity (high to low)
    const aSeverity = getSeverityWeight(a.severity);
    const bSeverity = getSeverityWeight(b.severity);
    return bSeverity - aSeverity;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto bg-[#1A1817] rounded-xl p-8 flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400 text-lg">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="max-w-5xl mx-auto bg-[#1A1817] rounded-xl p-8 shadow-lg">
        <p className="text-gray-400 text-center py-8">
          No issues found or analysis not yet completed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <AnimatePresence initial={false} mode="popLayout">
        {sortedRecommendations.map((issue, index) => {
          const issueId = `${issue.title}-${issue.file_path}`;
          const isCompleted = completedIssues[issueId] || false;

          return (
            <motion.div
              key={issueId}
              layout="position"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                layout: { duration: 0.3, type: "tween" },
                opacity: { duration: 0.3 },
              }}
              className={`p-8 transition-all duration-300 rounded-xl shadow-md ${
                isCompleted
                  ? "bg-green-900/5 hover:bg-green-900/10 border border-green-900/10"
                  : "bg-[#1A1817] hover:bg-[#232323] border border-gray-800/30"
              }`}
              onClick={() =>
                setExpandedIssue(expandedIssue === index ? null : index)
              }
            >
              <div className="flex items-start justify-between cursor-pointer">
                <div className="flex items-start space-x-4">
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted
                        ? "#10B981"
                        : getSeverityColorValue(
                            issue.severity as IssueSeverity
                          ),
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-3 h-3 mt-2 rounded-full flex-shrink-0`}
                  ></motion.div>
                  <motion.div
                    animate={{ opacity: isCompleted ? 0.8 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      {issue.file_path}
                    </p>
                  </motion.div>
                </div>
                <div className="flex flex-col items-end space-y-4 ml-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-medium px-3 py-1 rounded bg-gray-800 text-gray-300">
                      {issue.category}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        expandedIssue === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                  <button
                    onClick={(e) => toggleIssueCompletion(issueId, e)}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                      isCompleted
                        ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                        : "bg-[#2A2D31] text-gray-300 hover:bg-[#353A40]"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 mr-2 ${
                        isCompleted ? "text-green-400" : "text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {isCompleted ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      )}
                    </svg>
                    <span className="text-sm">
                      {isCompleted ? "Completed" : "Mark Complete"}
                    </span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedIssue === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`mt-8 pl-8 border-l-2 ${
                        isCompleted
                          ? "border-green-800/30 opacity-80"
                          : "border-gray-700"
                      }`}
                    >
                      <p className="text-gray-300 mb-6">{issue.description}</p>

                      {issue.action_items && issue.action_items.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-white mb-3">
                            Action Items:
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                            {issue.action_items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {issue.code_snippets &&
                        (issue.code_snippets.before ||
                          issue.code_snippets.after) && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-white mb-3">
                              Code Snippets:
                            </h4>

                            {issue.code_snippets.before && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-400 mb-2">
                                  Before:
                                </p>
                                <pre className="bg-[#0A0A0A] p-4 rounded text-xs overflow-x-auto text-gray-300">
                                  {issue.code_snippets.before}
                                </pre>
                              </div>
                            )}

                            {issue.code_snippets.after && (
                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  After:
                                </p>
                                <pre className="bg-[#0A0A0A] p-4 rounded text-xs overflow-x-auto text-gray-300">
                                  {issue.code_snippets.after}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                      {issue.references && issue.references.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-3">
                            References:
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                            {issue.references.map((ref, i) => (
                              <li key={i}>
                                <a
                                  href={ref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline"
                                >
                                  {ref}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Add this helper function to get color values instead of class names
const getSeverityColorValue = (severity: IssueSeverity): string => {
  switch (severity) {
    case "HIGH":
      return "#EF4444"; // red-500
    case "MEDIUM":
      return "#F59E0B"; // yellow-500
    case "LOW":
      return "#3B82F6"; // blue-500
    default:
      return "#6B7280"; // gray-500
  }
};
