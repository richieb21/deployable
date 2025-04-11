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
import { Recommendation } from "@/app/types/api";
import { useTheme } from "@/app/context/ThemeContext";
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
              ? severityColor === "bg-red-500"
                ? "rgba(239, 68, 68, 0.05)"
                : severityColor === "bg-yellow-500"
                  ? "rgba(234, 179, 8, 0.05)"
                  : severityColor === "bg-blue-500"
                    ? "rgba(59, 130, 246, 0.05)"
                    : "#1A1817"
              : severityColor === "bg-red-500"
                ? "rgba(239, 68, 68, 0.02)"
                : severityColor === "bg-yellow-500"
                  ? "rgba(234, 179, 8, 0.02)"
                  : severityColor === "bg-blue-500"
                    ? "rgba(59, 130, 246, 0.02)"
                    : "white",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: isCompleted
            ? "rgba(20, 83, 45, 0.2)"
            : theme === "dark"
              ? severityColor === "bg-red-500"
                ? "rgba(239, 68, 68, 0.1)"
                : severityColor === "bg-yellow-500"
                  ? "rgba(234, 179, 8, 0.1)"
                  : severityColor === "bg-blue-500"
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(75, 85, 99, 0.3)"
              : severityColor === "bg-red-500"
                ? "rgba(239, 68, 68, 0.05)"
                : severityColor === "bg-yellow-500"
                  ? "rgba(234, 179, 8, 0.05)"
                  : severityColor === "bg-blue-500"
                    ? "rgba(59, 130, 246, 0.05)"
                    : "#e5e7eb",
        }}
      >
        {/* Severity color bar on left edge */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            isCompleted ? "bg-green-500" : severityColor
          }`}
        ></div>

        <div className="p-4 sm:p-6 md:p-8 pl-6 sm:pl-8 md:pl-10">
          <div
            className="flex flex-col sm:flex-row sm:justify-between cursor-pointer"
            onClick={() => handleToggleExpand(index)}
          >
            <div className="flex-1 mb-4 sm:mb-0">
              <h3
                className="text-base sm:text-lg font-semibold mb-2"
                style={{
                  color: theme === "dark" ? "white" : "#111827",
                }}
              >
                {issue.title}
              </h3>
              <p
                className="text-xs sm:text-sm break-words"
                style={{
                  color: theme === "dark" ? "#9ca3af" : "#6b7280",
                }}
              >
                {issue.file_path}
              </p>
            </div>

            {/* Category tag and chevron - now in separate div */}
            <div className="flex flex-col sm:flex-col items-start sm:items-end sm:ml-6 mb-3 sm:mb-0">
              <div className="flex items-center justify-between w-full sm:justify-end sm:space-x-3">
                <span
                  className="text-xs font-medium px-2 sm:px-3 py-1 rounded max-w-[150px] truncate"
                  style={{
                    backgroundColor: theme === "dark" ? "#1f2937" : "#f3f4f6",
                    color: theme === "dark" ? "#d1d5db" : "#4b5563",
                  }}
                  title={issue.category} // Show full category on hover
                >
                  {issue.category}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${
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

              {/* Action buttons in separate row on mobile */}
              <div className="flex items-center space-x-2 mt-3 sm:mt-4 w-full sm:w-auto">
                <button
                  onClick={(e) => createGitHubIssue(issue, issueId, e)}
                  disabled={isCreated || isCreatingIssue}
                  style={{
                    backgroundColor: isCreated
                      ? theme === "dark"
                        ? "rgba(22, 163, 74, 0.3)"
                        : "rgba(22, 163, 74, 0.2)"
                      : isCreatingIssue
                        ? theme === "dark"
                          ? "#374151"
                          : "#d1d5db"
                        : theme === "dark"
                          ? "#2A2D31"
                          : "#e5e7eb",
                    color: isCreated
                      ? theme === "dark"
                        ? "#4ade80"
                        : "#15803d"
                      : isCreatingIssue
                        ? theme === "dark"
                          ? "#9ca3af"
                          : "#4b5563"
                        : theme === "dark"
                          ? "#d1d5db"
                          : "#374151",
                  }}
                  className="flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-md transition-colors duration-200 hover:bg-opacity-90 text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                >
                  <svg
                    className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0 ${
                      isCreated ? "text-green-400" : "text-gray-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={
                      isCreated
                        ? theme === "dark"
                          ? "#4ade80"
                          : "#15803d"
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
                      <>
                        <circle cx="12" cy="12" r="7" strokeWidth="2" />
                        <circle
                          cx="12"
                          cy="12"
                          r="1"
                          strokeWidth="2"
                          fill="currentColor"
                        />
                      </>
                    )}
                  </svg>
                  <span className="whitespace-nowrap">
                    {isCreated
                      ? "Issue Created"
                      : isCreatingIssue
                        ? "Creating..."
                        : "Create Issue"}
                  </span>
                </button>
                <button
                  onClick={(e) => toggleIssueCompletion(issueId, e)}
                  className="flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-md transition-colors duration-200 text-xs sm:text-sm flex-1 sm:flex-auto justify-center sm:justify-start"
                  style={{
                    backgroundColor: isCompleted
                      ? theme === "dark"
                        ? "rgba(22, 163, 74, 0.3)"
                        : "rgba(22, 163, 74, 0.2)"
                      : theme === "dark"
                        ? "#2A2D31"
                        : "#e5e7eb",
                    color: isCompleted
                      ? theme === "dark"
                        ? "#4ade80"
                        : "#15803d"
                      : theme === "dark"
                        ? "#d1d5db"
                        : "#374151",
                  }}
                >
                  <svg
                    className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0 ${
                      isCompleted ? "text-green-400" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke={
                      isCompleted
                        ? theme === "dark"
                          ? "#4ade80"
                          : "#15803d"
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
                  <span className="whitespace-nowrap">
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
                  ? severityColor === "bg-red-500"
                    ? "rgba(239, 68, 68, 0.05)"
                    : severityColor === "bg-yellow-500"
                      ? "rgba(234, 179, 8, 0.05)"
                      : severityColor === "bg-blue-500"
                        ? "rgba(59, 130, 246, 0.05)"
                        : "#1A1817"
                  : severityColor === "bg-red-500"
                    ? "rgba(239, 68, 68, 0.02)"
                    : severityColor === "bg-yellow-500"
                      ? "rgba(234, 179, 8, 0.02)"
                      : severityColor === "bg-blue-500"
                        ? "rgba(59, 130, 246, 0.02)"
                        : "white",
              borderTop: "1px solid",
              borderTopColor: isCompleted
                ? "rgba(20, 83, 45, 0.1)"
                : theme === "dark"
                  ? severityColor === "bg-red-500"
                    ? "rgba(239, 68, 68, 0.1)"
                    : severityColor === "bg-yellow-500"
                      ? "rgba(234, 179, 8, 0.1)"
                      : severityColor === "bg-blue-500"
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(75, 85, 99, 0.3)"
                  : severityColor === "bg-red-500"
                    ? "rgba(239, 68, 68, 0.05)"
                    : severityColor === "bg-yellow-500"
                      ? "rgba(234, 179, 8, 0.05)"
                      : severityColor === "bg-blue-500"
                        ? "rgba(59, 130, 246, 0.05)"
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
