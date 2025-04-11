"use client";

import { useTheme } from "../context/ThemeContext";

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
      style={{
        color: theme === "dark" ? "#6b7280" : "#9ca3af",
        borderTop: theme === "dark" ? "none" : "1px solid #f3f4f6",
      }}
      className="py-6 sm:py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-xs sm:text-sm">
          © 2024 deployable. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
