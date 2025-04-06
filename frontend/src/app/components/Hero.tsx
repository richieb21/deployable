"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

/**
 * Hero Component
 *
 * The main landing page hero section with a repository input form.
 */
export const Hero = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Instead of doing the analysis here, just navigate to the stats page
      // The analysis will be performed there via the useAnalysis hook
      router.push(`/stats?repo=${encodeURIComponent(url)}`);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Define button styles based on theme
  const buttonStyle =
    theme === "dark"
      ? {
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          color: "white",
          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
          border: "none",
        }
      : {
          background: "linear-gradient(135deg, #ea580c 0%, #ea580c 100%)",
          color: "white",
          boxShadow: "0 4px 14px #ea580c",
          border: "none",
        };

  // Define input styles based on theme
  const inputStyle = {
    backgroundColor: theme === "dark" ? "#1f2937" : "white",
    color: theme === "dark" ? "#f9fafb" : "#111827",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor:
      theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
    boxShadow:
      theme === "dark"
        ? "0 4px 12px rgba(0, 0, 0, 0.3)"
        : "0 4px 12px rgba(0, 0, 0, 0.08)",
    fontWeight: 500,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-64">
      <div className="text-center space-y-8">
        <h2
          className="text-5xl sm:text-6xl font-bold max-w-3xl mx-auto leading-tight"
          style={{ color: theme === "dark" ? "#ffffff" : "#111827" }}
        >
          Ship with confidence, <br />
          <span
            className={theme === "dark" ? "text-green-600" : "text-orange-600"}
          >
            deploy without surprises
          </span>
        </h2>
        <p
          className="text-xl max-w-2xl mx-auto"
          style={{ color: theme === "dark" ? "#d1d5db" : "#4b5563" }}
        >
          A free, instant AI-powered analysis of your repository to catch
          deployment issues before they catch you.
        </p>
        {/*             A free tool to analyze your personal projects and applications to give you piece of mind before you hit deploy */}
        {/* CTA Section */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full max-w-2xl mx-auto gap-4 mt-12"
        >
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/richieb21/deployable"
                className="w-full px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                style={inputStyle}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url}
              className="px-8 py-4 rounded-xl font-semibold transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:transform hover:scale-105"
              style={buttonStyle}
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};
