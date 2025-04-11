"use client";

import { useState, useEffect, useRef } from "react";

export function useIssueCompletion() {
  const [completedIssues, setCompletedIssues] = useState<{
    [key: string]: boolean;
  }>({});
  const prevCompletedCountRef = useRef(0);
  const changedIssueIdRef = useRef<string | null>(null);

  // Load completed issues from localStorage on mount
  useEffect(() => {
    try {
      const storedCompletedIssues = localStorage.getItem("completedIssues");
      if (storedCompletedIssues) {
        const parsed = JSON.parse(storedCompletedIssues);
        setCompletedIssues(parsed);
        prevCompletedCountRef.current = Object.keys(parsed).length;
      }
    } catch (error) {
      console.error("Error loading completed issues:", error);
    }
  }, []);

  // Handle issue status changes
  const handleIssueStatusChange = (
    updatedCompletedIssues: { [key: string]: boolean },
    changedIssueId: string
  ) => {
    changedIssueIdRef.current = changedIssueId;
    setCompletedIssues(updatedCompletedIssues);

    // Save to localStorage
    try {
      localStorage.setItem(
        "completedIssues",
        JSON.stringify(updatedCompletedIssues)
      );
    } catch (error) {
      console.error("Error saving completed issues:", error);
    }
  };

  // Handle bulk completion
  const handleCompleteAll = (selectedIssues: Set<string>) => {
    if (selectedIssues.size === 0) return;

    // Create a copy of the current completedIssues
    const updatedCompletedIssues = { ...completedIssues };

    // Mark all selected issues as completed
    selectedIssues.forEach((issueId) => {
      updatedCompletedIssues[issueId] = true;
    });

    // Update state
    setCompletedIssues(updatedCompletedIssues);

    // Save to localStorage
    try {
      localStorage.setItem(
        "completedIssues",
        JSON.stringify(updatedCompletedIssues)
      );
    } catch (error) {
      console.error("Error saving completed issues:", error);
    }

    // Set the last changed issue ID to trigger animations
    changedIssueIdRef.current = "bulk-update";

    return updatedCompletedIssues;
  };

  // Clear all completed issues
  const clearCompletedIssues = () => {
    setCompletedIssues({});
    localStorage.removeItem("completedIssues");
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
