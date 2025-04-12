"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";

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
          border: "none",
        }
      : {
          background: "linear-gradient(135deg, #ea580c 0%, #ea580c 100%)",
          color: "white",
          border: "none",
        };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 md:pt-48 pb-32 md:pb-64">
      <div className="text-center space-y-6 md:space-y-8">
        <h2
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold max-w-none mx-auto leading-tight"
          style={{
            color: theme === "dark" ? "transparent" : "#111827",
            backgroundImage:
              theme === "dark"
                ? "linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)"
                : "none",
            backgroundClip: theme === "dark" ? "text" : "unset",
            WebkitBackgroundClip: theme === "dark" ? "text" : "unset",
            position: "relative",
          }}
        >
          deployable
          {theme === "dark" && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/30 to-transparent animate-shine" />
          )}
        </h2>
        <p
          className="text-base md:text-xl max-w-2xl mx-auto px-2"
          style={{ color: theme === "dark" ? "#d1d5db" : "#4b5563" }}
        >
          A free, instant AI-powered analysis of your repository to catch
          deployment issues before they catch you.
        </p>

        {/* CTA Section */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full max-w-2xl mx-auto gap-4 mt-8 md:mt-12 px-2"
        >
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <div className="relative flex-grow group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl focus:outline-none text-sm sm:text-base relative z-10 ${
                  theme === "dark"
                    ? "bg-[#1a1a1a] text-white placeholder:text-gray-500 border-[#333]"
                    : "bg-white text-gray-900 placeholder:text-gray-400 border-gray-200"
                } border-2 transition-colors`}
                disabled={isLoading}
              />
              {/* Animated border effect - only show in dark mode */}
              {theme === "dark" && (
                <>
                  <div className="absolute -inset-[2px] rounded-xl z-0 bg-gradient-to-r from-transparent via-green-500/50 to-transparent group-hover:animate-shine" />
                  <div
                    className={`absolute inset-0 rounded-xl z-[5] bg-[#1a1a1a]`}
                  />
                  <div className="absolute inset-[2px] rounded-lg z-[6] bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !url}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:transform hover:scale-105 text-sm sm:text-base relative group overflow-hidden"
              style={buttonStyle}
            >
              <span className="relative z-10">
                {isLoading ? "Analyzing..." : "Analyze"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        {/* Add keyframe animation for the shine effect */}
        <style jsx global>{`
          @keyframes shine {
            0% {
              transform: translateX(-100%) skewX(-15deg);
              opacity: 0;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              transform: translateX(100%) skewX(-15deg);
              opacity: 0;
            }
          }
          .animate-shine {
            animation: shine 4s infinite;
            mix-blend-mode: overlay;
          }
        `}</style>
      </div>
    </div>
  );
};
