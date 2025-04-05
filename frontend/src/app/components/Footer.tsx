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
        backgroundColor: theme === "dark" ? "#121212" : "#f9fafb",
        color: theme === "dark" ? "#9ca3af" : "#6b7280",
        borderTop: theme === "dark" ? "none" : "1px solid #f3f4f6",
      }}
      className="py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm">
          © 2024 deployable. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
