"use client";

import { useState } from "react";

export const Hero = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Analysis response:", data); // Add handling later
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32">
      <div className="text-center space-y-8">
        <h2 className="text-5xl sm:text-6xl font-bold max-w-3xl mx-auto leading-tight">
          Ship with confidence, <br />
          <span className="text-orange-600 dark:text-orange-500">
            deploy without surprises
          </span>
        </h2>
        <p className="text-xl max-w-2xl mx-auto text-black/80 dark:text-white/80">
          {" "}
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
                className="w-full px-6 py-4 bg-white dark:bg-gray-900 border-2 border-black/10 dark:border-white/10 rounded-xl 
                         focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 
                         placeholder:text-gray-400 dark:placeholder:text-gray-600
                         text-black dark:text-white"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url}
              className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold 
                        hover:bg-gray-800 dark:hover:bg-gray-100 transition whitespace-nowrap
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : "Deploy!"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};
