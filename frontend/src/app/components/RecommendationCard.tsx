import { Recommendation, Severity, IssueCategory } from "../types/api";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

const severityColors = {
  [Severity.CRITICAL]: "text-red-500 dark:text-red-400",
  [Severity.HIGH]: "text-orange-500 dark:text-orange-400",
  [Severity.MEDIUM]: "text-yellow-500 dark:text-yellow-400",
  [Severity.LOW]: "text-blue-500 dark:text-blue-400",
  [Severity.INFO]: "text-gray-500 dark:text-gray-400",
};

const severityIcons = {
  [Severity.CRITICAL]: AlertCircle,
  [Severity.HIGH]: AlertTriangle,
  [Severity.MEDIUM]: AlertTriangle,
  [Severity.LOW]: Info,
  [Severity.INFO]: CheckCircle,
};

const categoryColors = {
  [IssueCategory.SECURITY]:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  [IssueCategory.PERFORMANCE]:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  [IssueCategory.INFRASTRUCTURE]:
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  [IssueCategory.RELIABILITY]:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  [IssueCategory.COMPLIANCE]:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  [IssueCategory.COST]:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  repoUrl: string;
}

export const RecommendationCard = ({
  recommendation,
  repoUrl,
}: RecommendationCardProps) => {
  const SeverityIcon = severityIcons[recommendation.severity];
  const categoryColor = categoryColors[recommendation.category];

  // Convert GitHub URL to raw file URL
  const getGitHubFileUrl = (repoUrl: string, filePath: string) => {
    const cleanRepoUrl = repoUrl.replace(/\/$/, "");
    return `${cleanRepoUrl}/blob/main/${filePath}`;
  };

  return (
    <div className="max-w-xl bg-white dark:bg-gray-900 rounded-xl border border-black/10 dark:border-white/10 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <SeverityIcon
            className={`w-5 h-5 ${severityColors[recommendation.severity]}`}
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {recommendation.title}
          </h3>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}
        >
          {recommendation.category}
        </span>
      </div>
      {recommendation.file_path && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          File:{" "}
          <a
            href={getGitHubFileUrl(repoUrl, recommendation.file_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 inline-flex items-center gap-1"
          >
            {recommendation.file_path}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <p className="text-base text-gray-600 dark:text-gray-300">
        {recommendation.description}
      </p>

      {recommendation.action_items.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Action Items:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {recommendation.action_items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
