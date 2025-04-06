"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { useTheme } from "../context/ThemeContext";

interface StatsLayoutProps {
  children: React.ReactNode;
  repoName: string;
  onRefresh?: () => void;
}

export const StatsLayout = ({
  children,
  repoName,
  onRefresh,
}: StatsLayoutProps) => {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme === "dark" ? "#121212" : "#f9fafb",
        color: theme === "dark" ? "#f9fafb" : "#111827",
      }}
    >
      <Header
        variant={theme === "dark" ? "dark" : "light"}
        onRefresh={onRefresh}
      />
      <div className="flex-grow w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2 break-words"
            style={{ color: theme === "dark" ? "#ffffff" : "#111827" }}
          >
            {repoName}
          </h1>
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
};
