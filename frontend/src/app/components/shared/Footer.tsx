"use client";

import { useTheme } from "@/app/context/ThemeContext";

/**
 * Footer Component
 *
 * Renders the application footer with copyright information.
 * Adapts styling based on the current theme.
 */
export const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer
      className={`py-6 sm:py-8 ${
        theme === "dark"
          ? "text-gray-400 border-none"
          : "text-gray-500 border-t border-gray-100"
      }`}
      style={{
        backgroundColor: "var(--bg-color)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-xs sm:text-sm">
          © 2024 deployable. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
