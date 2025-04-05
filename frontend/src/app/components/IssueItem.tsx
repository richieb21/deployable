/**
 * IssueItem Component
 *
 * Renders an individual issue in the issues list with:
 * - Collapsible UI for showing/hiding details
 * - Visual indicators for issue severity and completion status
 * - Buttons for marking issues as complete
 * - Functionality to create GitHub issues
 *
 * This component handles the presentation and interaction for a single issue,
 * while delegating the rendering of detailed issue content to the IssueDetails component.
 * All state management is handled by the parent IssuesList component.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Recommendation } from "../types/api";
import { useTheme } from "../context/ThemeContext";
import IssueDetails from "./IssueDetails";

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

interface IssueItemProps {
  issue: Recommendation;
  index: number;
  issueId: string;
  isCompleted: boolean;
  isCreated: boolean;
  isCreatingIssue: boolean;
  expandedIssue: number | null;
  createdIssueInfo?: {
    url: string;
    number: number;
  };
  handleToggleExpand: (index: number) => void;
  toggleIssueCompletion: (issueId: string, event: React.MouseEvent) => void;
  createGitHubIssue: (
    issue: Recommendation,
    issueId: string,
    event: React.MouseEvent
  ) => void;
}

const IssueItem = ({
  issue,
  index,
  issueId,
  isCompleted,
  isCreated,
  isCreatingIssue,
  expandedIssue,
  createdIssueInfo,
  handleToggleExpand,
  toggleIssueCompletion,
  createGitHubIssue,
}: IssueItemProps) => {
  const { theme } = useTheme();
  const severityColor = getSeverityColor(issue.severity as IssueSeverity);

  return (
    <div className="mb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`relative rounded-t-xl ${
          expandedIssue === index ? "" : "rounded-b-xl"
        } overflow-hidden`}
        style={{
          backgroundColor: isCompleted
            ? "rgba(20, 83, 45, 0.05)"
            : theme === "dark"
            ? "#1A1817"
            : "white",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: isCompleted
            ? "rgba(20, 83, 45, 0.2)"
            : theme === "dark"
            ? "rgba(75, 85, 99, 0.3)"
            : "#e5e7eb",
        }}
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
              <h3
                className="text-lg font-semibold mb-2"
                style={{
                  color: theme === "dark" ? "white" : "#111827",
                }}
              >
                {issue.title}
              </h3>
              <p
                className="text-sm"
                style={{
                  color: theme === "dark" ? "#9ca3af" : "#6b7280",
                }}
              >
                {issue.file_path}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-4 ml-6">
              <div className="flex items-center space-x-4">
                <span
                  className="text-xs font-medium px-3 py-1 rounded"
                  style={{
                    backgroundColor: theme === "dark" ? "#1f2937" : "#f3f4f6",
                    color: theme === "dark" ? "#d1d5db" : "#4b5563",
                  }}
                >
                  {issue.category}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expandedIssue === index ? "rotate-180" : ""
                  }`}
                  style={{
                    color: theme === "dark" ? "#9ca3af" : "#6b7280",
                  }}
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
                  disabled={isCreated || isCreatingIssue}
                  style={{
                    backgroundColor: isCreated
                      ? "rgba(22, 163, 74, 0.2)"
                      : isCreatingIssue
                      ? theme === "dark"
                        ? "#374151"
                        : "#d1d5db"
                      : theme === "dark"
                      ? "#2A2D31"
                      : "#e5e7eb",
                    color: isCreated
                      ? "#15803d"
                      : isCreatingIssue
                      ? theme === "dark"
                        ? "#9ca3af"
                        : "#4b5563"
                      : theme === "dark"
                      ? "#d1d5db"
                      : "#374151",
                  }}
                  className="flex items-center px-4 py-2 rounded-md transition-colors duration-200 hover:bg-opacity-90"
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      isCreated ? "text-green-400" : "text-gray-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={
                      isCreated
                        ? "#15803d"
                        : theme === "dark"
                        ? "#9ca3af"
                        : "#4b5563"
                    }
                  >
                    {isCreated ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    ) : isCreatingIssue ? (
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
                      : isCreatingIssue
                      ? "Creating..."
                      : "Create Issue"}
                  </span>
                </button>
                <button
                  onClick={(e) => toggleIssueCompletion(issueId, e)}
                  className="flex items-center px-4 py-2 rounded-md transition-colors duration-200"
                  style={{
                    backgroundColor: isCompleted
                      ? "rgba(22, 163, 74, 0.2)"
                      : theme === "dark"
                      ? "#2A2D31"
                      : "#e5e7eb",
                    color: isCompleted
                      ? "#15803d"
                      : theme === "dark"
                      ? "#d1d5db"
                      : "#374151",
                  }}
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      isCompleted ? "text-green-400" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke={
                      isCompleted
                        ? "#15803d"
                        : theme === "dark"
                        ? "#9ca3af"
                        : "#4b5563"
                    }
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
            className="overflow-hidden"
            style={{
              backgroundColor: isCompleted
                ? "rgba(20, 83, 45, 0.05)"
                : theme === "dark"
                ? "#1A1817"
                : "white",
              borderTop: "1px solid",
              borderTopColor: isCompleted
                ? "rgba(20, 83, 45, 0.1)"
                : theme === "dark"
                ? "rgba(75, 85, 99, 0.3)"
                : "#e5e7eb",
            }}
          >
            <IssueDetails
              issue={issue}
              isCompleted={isCompleted}
              isCreated={isCreated}
              createdIssueInfo={createdIssueInfo}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueItem;
