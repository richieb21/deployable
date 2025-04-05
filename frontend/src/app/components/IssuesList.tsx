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

// Type for created issues
interface CreatedIssues {
  [key: string]: {
    url: string;
    number: number;
  };
}

export const IssuesList = ({
  recommendations = [],
  loading = false,
  onIssueStatusChange,
  completedIssues = {},
  repoOwner = "",
  repoName = "",
}: {
  recommendations?: Recommendation[];
  loading?: boolean;
  onIssueStatusChange?: (
    completedIssues: CompletedIssues,
    changedIssueId: string
  ) => void;
  selectedIssues?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  completedIssues?: CompletedIssues;
  repoOwner?: string;
  repoName?: string;
}) => {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const prevCompletedRef = useRef<CompletedIssues>({});
  const changedIssueIdRef = useRef<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const expandingRef = useRef<boolean>(false);
  const [createdIssues, setCreatedIssues] = useState<CreatedIssues>({});
  const [isCreatingIssue, setIsCreatingIssue] = useState<{
    [key: string]: boolean;
  }>({});

  // Load created issues from localStorage on mount
  useEffect(() => {
    try {
      const storedCreatedIssues = localStorage.getItem("createdIssues");
      if (storedCreatedIssues) {
        setCreatedIssues(JSON.parse(storedCreatedIssues));
      }
    } catch (error) {
      console.error("Error loading created issues:", error);
    }
  }, []);

  // Save created issues to localStorage when they change
  useEffect(() => {
    if (Object.keys(createdIssues).length > 0) {
      try {
        localStorage.setItem("createdIssues", JSON.stringify(createdIssues));
      } catch (error) {
        console.error("Error saving created issues:", error);
      }
    }
  }, [createdIssues]);

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

    // Create updated completedIssues
    const newCompletedIssues = {
      ...completedIssues,
      [issueId]: !completedIssues[issueId],
    };

    // Call the parent's handler directly
    if (onIssueStatusChange) {
      onIssueStatusChange(newCompletedIssues, issueId);
    }
  };

  // Handle expanding/collapsing issues
  const handleToggleExpand = (index: number) => {
    // Store current scroll position
    scrollPositionRef.current = window.scrollY;

    // Set flag to indicate we're in the middle of expanding/collapsing
    expandingRef.current = true;

    setExpandedIssue(expandedIssue === index ? null : index);

    // Reset the expanding flag after animation completes
    setTimeout(() => {
      expandingRef.current = false;

      // Restore scroll position
      if (scrollPositionRef.current) {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: "auto",
        });
        scrollPositionRef.current = 0;
      }
    }, 300); // Match this with animation duration
  };

  // Create GitHub issue
  const createGitHubIssue = async (
    issue: Recommendation,
    issueId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent expanding/collapsing when clicking the button

    // If issue is already created, do nothing
    if (createdIssues[issueId]) {
      return;
    }

    // Set loading state for this specific issue
    setIsCreatingIssue((prev) => ({ ...prev, [issueId]: true }));

    try {
      // Use the repository information from props
      const owner = repoOwner || "richieb21"; // Fallback if not provided
      const repo = repoName || "deployable"; // Fallback if not provided

      console.log(`Creating issue in ${owner}/${repo}`);

      // Prepare issue body with formatted content
      const body = `
## Issue Description
${issue.description}

${
  issue.action_items && issue.action_items.length > 0
    ? `
## Action Items
${issue.action_items.map((item) => `- ${item}`).join("\n")}
`
    : ""
}

${
  issue.code_snippets &&
  (issue.code_snippets.before || issue.code_snippets.after)
    ? `
## Code Snippets
${
  issue.code_snippets.before
    ? `
### Before:
\`\`\`
${issue.code_snippets.before}
\`\`\`
`
    : ""
}
${
  issue.code_snippets.after
    ? `
### After:
\`\`\`
${issue.code_snippets.after}
\`\`\`
`
    : ""
}
`
    : ""
}

${
  issue.references && issue.references.length > 0
    ? `
## References
${issue.references.map((ref) => `- ${ref}`).join("\n")}
`
    : ""
}

## File Path
\`${issue.file_path}\`

## Severity
${issue.severity}

## Category
${issue.category}

---
*This issue was automatically created by the Code Quality Analyzer.*
      `;

      // Create labels based on severity and category
      const labels = [
        `severity:${issue.severity.toLowerCase()}`,
        `category:${issue.category.toLowerCase().replace(/\s+/g, "-")}`,
      ];

      // Call the API to create the issue
      const response = await fetch("/api/github/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner,
          repo,
          title: issue.title,
          body,
          labels,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create issue");
      }

      const data = await response.json();

      // Update created issues state
      setCreatedIssues((prev) => ({
        ...prev,
        [issueId]: {
          url: data.html_url,
          number: data.number,
        },
      }));
    } catch (error) {
      console.error("Error creating GitHub issue:", error);
      alert(
        `Failed to create GitHub issue: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Clear loading state
      setIsCreatingIssue((prev) => ({ ...prev, [issueId]: false }));
    }
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

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="max-w-5xl mx-auto bg-[#1A1817] rounded-xl p-8 text-center">
        <p className="text-gray-400 text-lg">No issues found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <AnimatePresence initial={false}>
        {sortedRecommendations.map((issue, index) => {
          const issueId = `${issue.title}-${issue.file_path}`;
          const isCompleted = completedIssues[issueId] || false;
          const isCreated = !!createdIssues[issueId];
          const isLoading = isCreatingIssue[issueId] || false;
          const severityColor = getSeverityColor(
            issue.severity as IssueSeverity
          );

          return (
            <div key={issueId} className="rounded-xl shadow-md overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative ${
                  isCompleted
                    ? "bg-green-900/5 hover:bg-green-900/10 border border-green-900/10"
                    : "bg-[#1A1817] hover:bg-[#232323] border border-gray-800/30"
                }`}
              >
                {/* Severity color bar on left edge */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isCompleted ? "bg-green-500" : severityColor
                  }`}
                ></div>

                <div className="p-8 pl-10">
                  <div
                    className="flex justify-between cursor-pointer"
                    onClick={() => handleToggleExpand(index)}
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-gray-400">{issue.file_path}</p>
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => createGitHubIssue(issue, issueId, e)}
                          disabled={isCreated || isLoading}
                          className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                            isCreated
                              ? "bg-green-600/20 text-green-400 cursor-default"
                              : isLoading
                              ? "bg-gray-700 text-gray-400 cursor-wait"
                              : "bg-[#2A2D31] text-gray-300 hover:bg-[#353A40]"
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 mr-2 ${
                              isCreated ? "text-green-400" : "text-gray-400"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {isCreated ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            ) : isLoading ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                className="animate-spin"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 3c.53 0 1.04.21 1.41.59.38.37.59.88.59 1.41 0 .53-.21 1.04-.59 1.41-.37.38-.88.59-1.41.59-.53 0-1.04-.21-1.41-.59C10.21 6.04 10 5.53 10 5c0-.53.21-1.04.59-1.41C10.96 3.21 11.47 3 12 3zM12 15c.53 0 1.04.21 1.41.59.38.37.59.88.59 1.41 0 .53-.21 1.04-.59 1.41-.37.38-.88.59-1.41.59-.53 0-1.04-.21-1.41-.59-.38-.37-.59-.88-.59-1.41 0-.53.21-1.04.59-1.41.37-.38.88-.59 1.41-.59zM12 9c.53 0 1.04.21 1.41.59.38.37.59.88.59 1.41 0 .53-.21 1.04-.59 1.41-.37.38-.88.59-1.41.59-.53 0-1.04-.21-1.41-.59C10.21 11.04 10 10.53 10 10c0-.53.21-1.04.59-1.41C10.96 9.21 11.47 9 12 9z"
                              />
                            )}
                          </svg>
                          <span className="text-sm">
                            {isCreated
                              ? "Issue Created"
                              : isLoading
                              ? "Creating..."
                              : "Create Issue"}
                          </span>
                        </button>
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
                            {isCompleted ? "Completed" : "Complete"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Expanded issue content */}
              <AnimatePresence>
                {expandedIssue === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`overflow-hidden ${
                      isCompleted
                        ? "bg-green-900/5 border-t border-green-900/10"
                        : "bg-[#1A1817] border-t border-gray-800/30"
                    }`}
                  >
                    <div className="p-8 pl-10">
                      <div
                        className={`pl-8 border-l-2 ${
                          isCompleted
                            ? "border-green-800/30 opacity-80"
                            : "border-gray-700"
                        }`}
                      >
                        {/* Show GitHub issue link if created */}
                        {isCreated && createdIssues[issueId] && (
                          <div className="mb-4 p-3 bg-green-900/20 border border-green-800/30 rounded-md">
                            <p className="text-green-400 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              GitHub issue created:
                              <a
                                href={createdIssues[issueId].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 underline hover:text-green-300"
                              >
                                #{createdIssues[issueId].number}
                              </a>
                            </p>
                          </div>
                        )}

                        <p className="text-gray-300 mb-6">
                          {issue.description}
                        </p>

                        {/* Rest of the expanded content remains the same */}
                        {issue.action_items &&
                          issue.action_items.length > 0 && (
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
