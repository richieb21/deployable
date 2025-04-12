"use client";

import { useState, useEffect, useRef } from "react";

export function useIssueCompletion() {
  const [completedIssues, setCompletedIssues] = useState<{
    [key: string]: boolean;
  }>({});
  const prevCompletedCountRef = useRef(0);
  const changedIssueIdRef = useRef<string | null>(null);

  // Load completed issues from Redis on mount
  useEffect(() => {
    async function loadCompletedIssues() {
      try {
        const response = await fetch("/api/issues/completed");
        if (response.ok) {
          const data = await response.json();
          setCompletedIssues(data);
          prevCompletedCountRef.current = Object.keys(data).length;
        }
      } catch (error) {
        console.error("Error loading completed issues:", error);
      }
    }
    loadCompletedIssues();
  }, []);

  // Handle issue status changes
  const handleIssueStatusChange = async (
    updatedCompletedIssues: { [key: string]: boolean },
    changedIssueId: string
  ) => {
    changedIssueIdRef.current = changedIssueId;
    setCompletedIssues(updatedCompletedIssues);

    // Save to Redis
    try {
      await fetch("/api/issues/completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCompletedIssues),
      });
    } catch (error) {
      console.error("Error saving completed issues:", error);
    }
  };

  // Handle bulk completion
  const handleCompleteAll = async (selectedIssues: Set<string>) => {
    if (selectedIssues.size === 0) return;

    // Create a copy of the current completedIssues
    const updatedCompletedIssues = { ...completedIssues };

    // Mark all selected issues as completed
    selectedIssues.forEach((issueId) => {
      updatedCompletedIssues[issueId] = true;
    });

    // Update state
    setCompletedIssues(updatedCompletedIssues);

    // Save to Redis
    try {
      await fetch("/api/issues/completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCompletedIssues),
      });
    } catch (error) {
      console.error("Error saving completed issues:", error);
    }

    // Set the last changed issue ID to trigger animations
    changedIssueIdRef.current = "bulk-update";

    return updatedCompletedIssues;
  };

  // Clear all completed issues
  const clearCompletedIssues = async () => {
    setCompletedIssues({});
    try {
      await fetch("/api/issues/completed", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error clearing completed issues:", error);
    }
    changedIssueIdRef.current = null;
    prevCompletedCountRef.current = 0;
  };

  return {
    completedIssues,
    changedIssueId: changedIssueIdRef.current,
    handleIssueStatusChange,
    handleCompleteAll,
    clearCompletedIssues,
  };
}
