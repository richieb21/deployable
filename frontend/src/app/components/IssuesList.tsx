"use client";

import { Recommendation } from "../types/api";
import { useState, useEffect } from "react";
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
  onIssueStatusChange?: (completedIssues: CompletedIssues) => void;
}) => {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [completedIssues, setCompletedIssues] = useState<CompletedIssues>({});

  // Load completed issues from localStorage on mount
  useEffect(() => {
    if (recommendations.length > 0) {
      try {
        const storedCompletedIssues = localStorage.getItem('completedIssues');
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
    if (Object.keys(completedIssues).length > 0) {
      try {
        localStorage.setItem('completedIssues', JSON.stringify(completedIssues));
        // Notify parent component about the change
        if (onIssueStatusChange) {
          onIssueStatusChange(completedIssues);
        }
      } catch (error) {
        console.error("Error saving completed issues:", error);
      }
    }
  }, [completedIssues, onIssueStatusChange]);

  const toggleIssueCompletion = (issueId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent expanding/collapsing when clicking the checkbox
    
    setCompletedIssues(prev => {
      const newCompletedIssues = { 
        ...prev,
        [issueId]: !prev[issueId]
      };
      return newCompletedIssues;
    });
  };

  // Sort recommendations: incomplete first, then completed
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const aCompleted = completedIssues[`${a.title}-${a.file_path}`] || false;
    const bCompleted = completedIssues[`${b.title}-${b.file_path}`] || false;
    
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
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
    <div className="max-w-5xl mx-auto bg-[#1A1817] rounded-xl shadow-lg divide-y divide-gray-700/50">
      <AnimatePresence initial={false}>
        {sortedRecommendations.map((issue, index) => {
          const issueId = `${issue.title}-${issue.file_path}`;
          const isCompleted = completedIssues[issueId] || false;
          
          return (
            <motion.div 
              key={issueId}
              layout
              initial={{ opacity: 1 }}
              animate={{ 
                opacity: 1,
                backgroundColor: isCompleted ? 'rgba(26, 26, 26, 1)' : 'rgba(26, 24, 23, 1)'
              }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                layout: { duration: 0.5, type: "spring" },
                opacity: { duration: 0.3 },
                backgroundColor: { duration: 0.5 }
              }}
              className={`p-6 transition-all duration-300 hover:bg-opacity-80 ${
                isCompleted ? 'hover:bg-[#222222]' : 'hover:bg-[#232323]'
              }`}
              onClick={() => setExpandedIssue(expandedIssue === index ? null : index)}
            >
              <div className="flex items-start justify-between cursor-pointer">
                <div className="flex items-start space-x-3">
                  <motion.div
                    animate={{ 
                      backgroundColor: isCompleted ? '#10B981' : getSeverityColorValue(issue.severity as IssueSeverity) 
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-3 h-3 mt-1.5 rounded-full`}
                  ></motion.div>
                  <motion.div 
                    animate={{ opacity: isCompleted ? 0.6 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {issue.file_path}
                    </p>
                  </motion.div>
                </div>
                <div className="flex items-center space-x-3">
                  <label 
                    className="flex items-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => {}}
                      onClick={(e) => toggleIssueCompletion(issueId, e)}
                      className="form-checkbox h-5 w-5 text-green-500 rounded border-gray-600 bg-gray-800 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="ml-2 text-sm text-gray-400">
                      {isCompleted ? 'Completed' : 'Mark complete'}
                    </span>
                  </label>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-800 text-gray-300">
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
                    <div className={`mt-6 pl-6 border-l-2 border-gray-700 ${isCompleted ? 'opacity-60' : ''}`}>
                      <p className="text-gray-300 mb-4">
                        {issue.description}
                      </p>

                      {issue.action_items && issue.action_items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-white mb-2">
                            Action Items:
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                            {issue.action_items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {issue.code_snippets &&
                        (issue.code_snippets.before || issue.code_snippets.after) && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-white mb-2">
                              Code Snippets:
                            </h4>

                            {issue.code_snippets.before && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-400 mb-1">
                                  Before:
                                </p>
                                <pre className="bg-[#0A0A0A] p-3 rounded text-xs overflow-x-auto text-gray-300">
                                  {issue.code_snippets.before}
                                </pre>
                              </div>
                            )}

                            {issue.code_snippets.after && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  After:
                                </p>
                                <pre className="bg-[#0A0A0A] p-3 rounded text-xs overflow-x-auto text-gray-300">
                                  {issue.code_snippets.after}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                      {issue.references && issue.references.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">
                            References:
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
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
