import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ErrorModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  showExplanation?: boolean;
}

const ErrorModal = ({
  title,
  message,
  isOpen,
  onClose,
  showExplanation = false,
}: ErrorModalProps) => {
  const { theme } = useTheme();
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${
          theme === "dark" ? "bg-[#121212]" : "bg-white"
        }`}
      >
        <div className="flex items-start mb-4">
          <div className="flex-1 mr-4">
            <h3
              className={`text-xl font-medium ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h3>
            <div
              className={`mt-2 text-base ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <p className="whitespace-pre-line">{message}</p>

              {showExplanation && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                    className={`flex items-center text-base font-medium ${
                      theme === "dark"
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mr-2 transition-transform ${
                        isExplanationOpen ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    Why do we need a .deployable file?
                  </button>

                  {isExplanationOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-4 p-4 rounded-md text-sm ${
                        theme === "dark"
                          ? "bg-gray-800 text-gray-200 border border-gray-700"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      <p className="mb-5 leading-relaxed">
                        The{" "}
                        <code
                          className={`px-2 py-1 rounded font-mono text-lg ${
                            theme === "dark"
                              ? "bg-gray-900 text-gray-200"
                              : "bg-white text-gray-800 border border-gray-300"
                          }`}
                        >
                          .deployable
                        </code>{" "}
                        file serves as an opt-in mechanism for repository
                        owners.
                      </p>
                      <p className="mb-5 leading-relaxed">
                        This security measure prevents unauthorized users from
                        creating issues in repositories that haven&apos;t
                        explicitly opted in to our service.
                      </p>
                      <p className="leading-relaxed">
                        To enable issue creation, simply add an empty file named{" "}
                        <code
                          className={`px-2 py-1 rounded font-mono text-lg ${
                            theme === "dark"
                              ? "bg-gray-900 text-gray-200"
                              : "bg-white text-gray-800 border border-gray-300"
                          }`}
                        >
                          .deployable
                        </code>{" "}
                        to the root directory of your repository.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              theme === "dark" ? "bg-red-900/30" : "bg-red-100"
            }`}
          >
            <svg
              className={`w-6 h-6 ${
                theme === "dark" ? "text-red-500" : "text-red-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md ${
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
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorModal;
