"use client";

import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Modal component for displaying generated Cursor prompts.
 * See system-design/cursor-prompt-generation.md for full design details.
 */

interface PromptModalProps {
  title: string;
  prompt: string;
  isOpen: boolean;
  onClose: () => void;
}

const PromptModal = ({ title, prompt, isOpen, onClose }: PromptModalProps) => {
  const { theme } = useTheme();
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copying" | "copied" | "error"
  >("idle");

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Copy to clipboard functionality
  const handleCopyToClipboard = async () => {
    setCopyStatus("copying");

    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus("copied");

      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setCopyStatus("error");

      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-4xl max-h-[90vh] p-6 rounded-lg shadow-xl ${
          theme === "dark" ? "bg-[#121212]" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 mr-4">
            <h3
              className={`text-xl font-medium ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Generated Cursor Prompt
            </h3>
            <p
              className={`mt-1 text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {title}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Prompt content */}
        <div className="mb-6">
          <div
            className={`relative p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96 ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700 text-gray-200"
                : "bg-gray-50 border-gray-200 text-gray-800"
            }`}
          >
            {prompt}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              theme === "dark"
                ? "focus-visible:ring-gray-500"
                : "focus-visible:ring-gray-400"
            }`}
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={copyStatus === "copying"}
            className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              copyStatus === "copied"
                ? theme === "dark"
                  ? "bg-green-700 text-green-200"
                  : "bg-green-200 text-green-800"
                : copyStatus === "error"
                  ? theme === "dark"
                    ? "bg-red-700 text-red-200"
                    : "bg-red-200 text-red-800"
                  : theme === "dark"
                    ? "bg-blue-700 text-white hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400"
                    : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed`}
          >
            {copyStatus === "copying" && (
              <svg
                className="w-4 h-4 mr-2 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {copyStatus === "copied" && (
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {copyStatus === "error" && (
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {copyStatus === "idle" && (
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
            {copyStatus === "copying" && "Copying..."}
            {copyStatus === "copied" && "Copied!"}
            {copyStatus === "error" && "Failed"}
            {copyStatus === "idle" && "Copy to Clipboard"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PromptModal;
