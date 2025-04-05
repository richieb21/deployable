"use client";

import { Header } from "./Header";

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
  return (
    <div className="min-h-screen bg-[#121212] dark:bg-[#121212] text-gray-100">
      <Header variant="dark" onRefresh={onRefresh} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">{repoName}</h1>
        </div>
        {children}
      </div>
    </div>
  );
};
