import { Hero } from "./components/Hero";
import { Header } from "./components/Header";
import { Features } from "./components/Features";
import { IssueCategory, Recommendation, Severity } from "./types/api";
import { RecommendationCard } from "./components/RecommendationCard";

export default function Home() {
  const testRecommendation: Recommendation = {
    title: "Missing Requirements Specification",
    severity: Severity.CRITICAL,
    category: IssueCategory.COST,
    file_path: "backend/requirements.txt",
    description:
      "The backend/requirements.txt file is empty, which means the application's dependencies are not specified. This can lead to deployment failures or inconsistencies across environments.",
    action_items: [
      "Populate requirements.txt with all necessary Python dependencies",
      "Specify exact versions of dependencies to ensure consistency",
      "Consider using a tool like pip-tools or poetry for better dependency management",
    ],
  };

  return (
    <div className="min-h-screen bg-[#FFFAF5] dark:bg-[#1A1817] text-gray-900 dark:text-gray-50">
      <Header />
      <Hero />
      <Features />
      <div className="flex justify-center">
        <RecommendationCard
          recommendation={testRecommendation}
          repoUrl="https://github.com/richieb21/deployable"
        />
      </div>
    </div>
  );
}
