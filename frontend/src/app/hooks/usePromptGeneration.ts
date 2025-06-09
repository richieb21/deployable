"use client";

import { useState, useRef } from "react";
import { Recommendation, PromptGenerationRequest } from "@/app/types/api";
import {
  promptService,
  PromptServiceError,
} from "@/app/services/promptService";

/**
 * Custom hook for prompt generation functionality.
 * See system-design/cursor-prompt-generation.md for full design details.
 */

interface PromptState {
  [issueId: string]: {
    isGenerating: boolean;
    prompt: string | null;
    error: string | null;
    generatedAt: string | null;
  };
}

export function usePromptGeneration() {
  const [promptStates, setPromptStates] = useState<PromptState>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [currentIssueTitle, setCurrentIssueTitle] = useState<string>("");

  // Generate prompt for an issue
  const generatePrompt = async (issue: Recommendation, issueId: string) => {
    // Set loading state
    setPromptStates((prev) => ({
      ...prev,
      [issueId]: {
        isGenerating: true,
        prompt: null,
        error: null,
        generatedAt: null,
      },
    }));

    try {
      // Prepare the request
      const request: PromptGenerationRequest = {
        title: issue.title,
        description: issue.description,
        file_path: issue.file_path,
        severity: issue.severity,
        category: issue.category,
        action_items: issue.action_items || [],
        code_snippets: issue.code_snippets,
        references: issue.references || [],
      };

      // Call the API
      const response = await promptService.generatePrompt(request);

      // Update state with success
      setPromptStates((prev) => ({
        ...prev,
        [issueId]: {
          isGenerating: false,
          prompt: response.prompt,
          error: null,
          generatedAt: response.generated_at,
        },
      }));

      // Open modal with the generated prompt
      setCurrentPrompt(response.prompt);
      setCurrentIssueTitle(issue.title);
      setIsModalOpen(true);

      return response.prompt;
    } catch (error) {
      const errorMessage =
        error instanceof PromptServiceError
          ? error.message
          : "Failed to generate prompt";

      // Update state with error
      setPromptStates((prev) => ({
        ...prev,
        [issueId]: {
          isGenerating: false,
          prompt: null,
          error: errorMessage,
          generatedAt: null,
        },
      }));

      console.error("Error generating prompt:", error);
      throw error;
    }
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentPrompt(null);
    setCurrentIssueTitle("");
  };

  // Get prompt state for a specific issue
  const getPromptState = (issueId: string) => {
    return (
      promptStates[issueId] || {
        isGenerating: false,
        prompt: null,
        error: null,
        generatedAt: null,
      }
    );
  };

  // Clear error for a specific issue
  const clearError = (issueId: string) => {
    setPromptStates((prev) => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        error: null,
      },
    }));
  };

  return {
    generatePrompt,
    getPromptState,
    clearError,
    isModalOpen,
    currentPrompt,
    currentIssueTitle,
    closeModal,
  };
}
