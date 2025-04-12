/**
 * IssuesList Component
 *
 * This is the main container component for displaying a list of code quality issues.
 * It handles:
 * - Loading and sorting issues by severity and completion status
 * - Managing state for completed and created GitHub issues
 * - Persisting issue status in localStorage
 * - Handling issue expansion/collapse
 * - Creating GitHub issues via API
 *
 * The component delegates rendering of individual issues to the IssueItem component
 * for better separation of concerns and maintainability.
 */

"use client";

import { Recommendation } from "@/app/types/api";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import IssueItem from "@/app/components/display/IssueItem";
import { AnimatedLogo } from "@/app/components/ui/AnimatedLogo";
import ErrorModal from "@/app/components/shared/ErrorModal";

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
  const { theme } = useTheme();
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const prevCompletedRef = useRef<CompletedIssues>({});
  const changedIssueIdRef = useRef<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const expandingRef = useRef<boolean>(false);
  const [createdIssues, setCreatedIssues] = useState<CreatedIssues>({});
  const [isCreatingIssue, setIsCreatingIssue] = useState<{
    [key: string]: boolean;
  }>({});
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    showExplanation?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    showExplanation: false,
  });

  // Load created issues from Redis on mount
  useEffect(() => {
    async function loadCreatedIssues() {
      try {
        const response = await fetch("/api/issues/created");
        if (response.ok) {
          const data = await response.json();
          setCreatedIssues(data);
        }
      } catch (error) {
        console.error("Error loading created issues:", error);
      }
    }
    loadCreatedIssues();
  }, []);

  // Save created issues to Redis when they change
  useEffect(() => {
    if (Object.keys(createdIssues).length > 0) {
      try {
        fetch("/api/issues/created", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createdIssues),
        });
      } catch (error) {
        console.error("Error saving created issues:", error);
      }
    }
  }, [createdIssues]);

  // Save completed issues to Redis when they change
  useEffect(() => {
    // Store previous state for comparison
    const hasChanged =
      JSON.stringify(prevCompletedRef.current) !==
      JSON.stringify(completedIssues);

    if (Object.keys(completedIssues).length > 0 && hasChanged) {
      try {
        fetch("/api/issues/completed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(completedIssues),
        });

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
        console.log("Error response data:", errorData); // Debug logging

        // Check for .deployable file error in multiple possible locations
        const isDeployableError =
          errorData.error === "Repository not enabled for Deployable" ||
          (errorData.details &&
            (errorData.details.includes(".deployable") ||
              errorData.details.includes("deployable"))) ||
          (errorData.originalError &&
            errorData.originalError.detail &&
            (errorData.originalError.detail.includes(".deployable") ||
              errorData.originalError.detail.includes("deployable")));

        if (isDeployableError) {
          setErrorModal({
            isOpen: true,
            title: "Repository Not Enabled",
            message:
              "This repository has not been enabled for Deployable.\n\nTo enable issue creation, please add a '.deployable' file to the root directory of your repository.",
            showExplanation: true,
          });
          return; // Exit early
        }

        // For other errors, show a more generic message
        setErrorModal({
          isOpen: true,
          title: "Error Creating Issue",
          message:
            errorData.error ||
            errorData.details ||
            (errorData.originalError && errorData.originalError.detail) ||
            "Failed to create GitHub issue",
        });
        return; // Exit early
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
      setErrorModal({
        isOpen: true,
        title: "Error Creating Issue",
        message: `Failed to create GitHub issue: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
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
    return <AnimatedLogo theme={theme} />;
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div
        className="max-w-5xl mx-auto rounded-xl p-8 text-center border"
        style={{
          backgroundColor: theme === "dark" ? "#1A1817" : "white",
          borderColor: theme === "dark" ? "transparent" : "#e5e7eb",
        }}
      >
        <p
          style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
          className="text-lg"
        >
          No issues found.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <AnimatePresence>
        {sortedRecommendations.map((issue, index) => {
          const issueId = `${issue.title}-${issue.file_path}`;
          const isCompleted = completedIssues[issueId] || false;
          const isCreated = !!createdIssues[issueId];
          const isCreatingIssueItem = isCreatingIssue[issueId] || false;

          return (
            <IssueItem
              key={`${issueId}-${index}`}
              issue={issue}
              index={index}
              issueId={issueId}
              isCompleted={isCompleted}
              isCreated={isCreated}
              isCreatingIssue={isCreatingIssueItem}
              expandedIssue={expandedIssue}
              createdIssueInfo={createdIssues[issueId]}
              handleToggleExpand={handleToggleExpand}
              toggleIssueCompletion={toggleIssueCompletion}
              createGitHubIssue={createGitHubIssue}
            />
          );
        })}
      </AnimatePresence>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        showExplanation={errorModal.showExplanation}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />
    </div>
  );
};
