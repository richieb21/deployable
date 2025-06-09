import {
  PromptGenerationRequest,
  PromptGenerationResponse,
} from "@/app/types/api";

/**
 * Service for prompt generation API calls.
 * See system-design/cursor-prompt-generation.md for full design details.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class PromptServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "PromptServiceError";
  }
}

export const promptService = {
  /**
   * Generate a Cursor IDE-compatible prompt from issue data.
   */
  async generatePrompt(
    request: PromptGenerationRequest
  ): Promise<PromptGenerationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new PromptServiceError(
          errorData.detail || errorData.error || `HTTP ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof PromptServiceError) {
        throw error;
      }

      // Network or other errors
      throw new PromptServiceError(
        error instanceof Error ? error.message : "Failed to generate prompt"
      );
    }
  },
};
