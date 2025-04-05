/**
 * IssueDetails Component
 * 
 * Renders the expanded details of a code quality issue, including:
 * - Issue description
 * - Action items
 * - Code snippets (before/after)
 * - References and documentation links
 * - GitHub issue link (if created)
 * 
 * This component is purely presentational and receives all necessary data
 * and state via props from the parent IssueItem component.
 */

import { Recommendation } from "../types/api";
import { useTheme } from "../context/ThemeContext";

interface IssueDetailsProps {
  issue: Recommendation;
  isCompleted: boolean;
  isCreated: boolean;
  createdIssueInfo?: {
    url: string;
    number: number;
  };
}

const IssueDetails = ({
  issue,
  isCompleted,
  isCreated,
  createdIssueInfo,
}: IssueDetailsProps) => {
  const { theme } = useTheme();

  return (
    <div className="p-8 pl-10">
      <div
        className="pl-8 border-l-2"
        style={{
          borderLeftColor: isCompleted
            ? "rgba(20, 83, 45, 0.3)"
            : theme === "dark"
            ? "#4b5563"
            : "#9ca3af",
          opacity: isCompleted ? 0.8 : 1,
        }}
      >
        {/* Show GitHub issue link if created */}
        {isCreated && createdIssueInfo && (
          <div
            className={`mb-4 p-3 ${
              theme === "dark"
                ? "bg-green-900/20 border border-green-800/30"
                : "bg-green-100 border border-green-200"
            } rounded-md`}
          >
            <p
              className={`${
                theme === "dark" ? "text-green-400" : "text-green-700"
              } flex items-center`}
            >
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
                href={createdIssueInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`ml-2 underline ${
                  theme === "dark" ? "hover:text-green-300" : "hover:text-green-800"
                }`}
              >
                #{createdIssueInfo.number}
              </a>
            </p>
          </div>
        )}

        <p
          className={`${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          } mb-6`}
        >
          {issue.description}
        </p>

        {/* Action items section */}
        {issue.action_items && issue.action_items.length > 0 && (
          <div className="mb-6">
            <h4
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-3`}
            >
              Action Items:
            </h4>
            <ul
              className={`list-disc pl-5 text-sm ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              } space-y-2`}
            >
              {issue.action_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Code snippets section */}
        {issue.code_snippets &&
          (issue.code_snippets.before || issue.code_snippets.after) && (
            <div className="mb-6">
              <h4
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                } mb-3`}
              >
                Code Snippets:
              </h4>

              {issue.code_snippets.before && (
                <div className="mb-4">
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    } mb-2`}
                  >
                    Before:
                  </p>
                  <pre
                    className={`${
                      theme === "dark" ? "bg-[#0A0A0A]" : "bg-gray-50"
                    } p-4 rounded text-xs overflow-x-auto ${
                      theme === "dark" ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
                    {issue.code_snippets.before}
                  </pre>
                </div>
              )}

              {issue.code_snippets.after && (
                <div>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    } mb-2`}
                  >
                    After:
                  </p>
                  <pre
                    className={`${
                      theme === "dark" ? "bg-[#0A0A0A]" : "bg-gray-50"
                    } p-4 rounded text-xs overflow-x-auto ${
                      theme === "dark" ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
                    {issue.code_snippets.after}
                  </pre>
                </div>
              )}
            </div>
          )}

        {/* References section */}
        {issue.references && issue.references.length > 0 && (
          <div>
            <h4
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-3`}
            >
              References:
            </h4>
            <ul
              className={`list-disc pl-5 text-sm ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              } space-y-2`}
            >
              {issue.references.map((ref, i) => (
                <li key={i}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    } hover:underline`}
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
  );
};

export default IssueDetails; 