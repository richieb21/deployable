"use client";

import { Recommendation } from "../types/api";
import { useState } from "react";

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

export const IssuesList = ({
  recommendations = [],
}: {
  recommendations?: Recommendation[];
}) => {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No issues found or analysis not yet completed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
      {recommendations.map((issue, index) => (
        <div key={index} className="p-6">
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={() =>
              setExpandedIssue(expandedIssue === index ? null : index)
            }
          >
            <div className="flex items-start space-x-3">
              <div
                className={`w-3 h-3 mt-1.5 rounded-full ${getSeverityColor(
                  issue.severity as IssueSeverity
                )}`}
              ></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {issue.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {issue.file_path}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                {issue.category}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
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

          {expandedIssue === index && (
            <div className="mt-4 pl-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {issue.description}
              </p>

              {issue.action_items && issue.action_items.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Action Items:
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {issue.action_items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {issue.code_snippets &&
                (issue.code_snippets.before || issue.code_snippets.after) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Code Snippets:
                    </h4>

                    {issue.code_snippets.before && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Before:
                        </p>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                          {issue.code_snippets.before}
                        </pre>
                      </div>
                    )}

                    {issue.code_snippets.after && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          After:
                        </p>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                          {issue.code_snippets.after}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

              {issue.references && issue.references.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    References:
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {issue.references.map((ref, i) => (
                      <li key={i}>
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {ref}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
