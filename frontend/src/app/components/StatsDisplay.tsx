"use client";

import { useEffect, useState, useRef } from "react";
import { AnalysisResponse } from "../types/api";
import { useTheme } from "../context/ThemeContext";

type StatMetric = {
  name: string;
  value: number;
  color: string;
  gradient?: string;
};

const CircleGraph = ({
  metric,
  size = "normal",
  shouldAnimate = false,
}: {
  metric: StatMetric;
  size?: "normal" | "large";
  shouldAnimate?: boolean;
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  // Animation duration in seconds
  const animationDuration = 1.5;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate the value when it changes
  useEffect(() => {
    if (!mounted) return;

    const startValue = prevValueRef.current;
    const endValue = metric.value;
    const difference = endValue - startValue;
    const startTime = performance.now();
    const endTime = startTime + animationDuration * 1000;

    const animateValue = (timestamp: number) => {
      if (timestamp >= endTime) {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
        return;
      }

      const elapsed = timestamp - startTime;
      const progress = elapsed / (animationDuration * 1000);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(startValue + difference * easedProgress);

      setDisplayValue(currentValue);
      requestAnimationFrame(animateValue);
    };

    requestAnimationFrame(animateValue);
  }, [metric.value, mounted, shouldAnimate]);

  // Easing function for smoother animation
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };

  if (!mounted) return null;

  // Calculate the circumference of the circle
  const radius = size === "large" ? 70 : 45;
  const circumference = 2 * Math.PI * radius;

  // Calculate the dash offset based on the display value (0-100)
  const dashOffset = circumference - (displayValue / 100) * circumference;

  // Generate unique gradient ID
  const gradientId = `gradient-${metric.name
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${
          size === "large" ? "w-56 h-56" : "w-36 h-36"
        } flex items-center justify-center`}
      >
        {/* SVG Gradient Definitions */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={metric.color} />
              <stop offset="100%" stopColor={metric.gradient || metric.color} />
            </linearGradient>
          </defs>
        </svg>

        {/* Background circle */}
        <svg className="w-full h-full -rotate-90 absolute">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth={size === "large" ? "14" : "10"}
            fill="transparent"
            className={theme === "dark" ? "text-[#2A2A2A]" : "text-gray-200"}
          />
        </svg>

        {/* Foreground circle with smooth transition */}
        <svg className="w-full h-full -rotate-90 absolute">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={size === "large" ? "14" : "10"}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition:
                "stroke-dashoffset 1.5s cubic-bezier(0.33, 1, 0.68, 1)",
            }}
          />
        </svg>

        {/* Value text */}
        <div
          className={`${size === "large" ? "text-5xl" : "text-3xl"} font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {displayValue}
        </div>
      </div>
      {size !== "large" && (
        <div className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
          {metric.name}
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on score
const getScoreColor = (score: number): { main: string; gradient: string } => {
  if (score >= 80)
    return {
      main: "#86EFAC", // Green for high scores
      gradient: "#4ADE80",
    };
  if (score >= 50)
    return {
      main: "#FCD34D", // Yellow for medium scores
      gradient: "#FBBF24",
    };
  return {
    main: "#F87171", // Red for low scores
    gradient: "#EF4444",
  };
};

// Issue severity levels and their corresponding point impacts
const SEVERITY_WEIGHTS = {
  critical: 25,
  high: 15,
  medium: 10,
  low: 5,
  info: 2,
};

// Category importance weights (for overall score calculation)
const CATEGORY_WEIGHTS = {
  security: 1.2, // Security issues are weighted higher
  performance: 1.0,
  efficiency: 0.9, // Combined category for readability, scalability, and cost
};

// Add type for valid severity levels
type SeverityLevel = keyof typeof SEVERITY_WEIGHTS;

// Update the component props to include onScoreUpdate
export const StatsDisplay = ({
  analysisData,
  loading = false,
  completedIssues = {},
  changedIssueId = null,
  onScoreUpdate,
}: {
  analysisData?: AnalysisResponse | null;
  loading?: boolean;
  completedIssues?: { [key: string]: boolean };
  changedIssueId?: string | null;
  onScoreUpdate?: (score: number) => void;
}) => {
  const { theme } = useTheme();

  // Calculate metrics regardless of loading state
  const calculateMetrics = () => {
    if (!analysisData || !analysisData.recommendations) {
      return {
        mainMetric: {
          name: "Overall Score",
          value: 0,
          color: "#F87171",
          gradient: "#EF4444",
        },
        metrics: [
          { name: "Security", value: 0, color: "#F87171", gradient: "#EF4444" },
          {
            name: "Performance",
            value: 0,
            color: "#F87171",
            gradient: "#EF4444",
          },
          {
            name: "Efficiency",
            value: 0,
            color: "#F87171",
            gradient: "#EF4444",
          },
        ],
      };
    }

    // Filter out completed issues
    const activeRecommendations = analysisData.recommendations.filter((rec) => {
      const issueId = `${rec.title}-${rec.file_path}`;
      return !completedIssues[issueId];
    });

    // Group recommendations by category
    const categorizedIssues: Record<
      string,
      AnalysisResponse["recommendations"]
    > = {};
    activeRecommendations.forEach((rec) => {
      const category = rec.category?.toLowerCase() || "other";

      // Map readability, scalability, and cost to efficiency
      let mappedCategory = category;
      if (["readability", "scalability", "cost"].includes(category)) {
        mappedCategory = "efficiency";
      }

      if (!categorizedIssues[mappedCategory]) {
        categorizedIssues[mappedCategory] = [];
      }
      categorizedIssues[mappedCategory].push(rec);
    });

    // Calculate category scores
    const calculateCategoryScore = (
      issues: AnalysisResponse["recommendations"] = []
    ) => {
      if (issues.length === 0) return 100;

      let score = 100;

      issues.sort((a, b) => {
        const severityA = (a.severity?.toLowerCase() ||
          "medium") as SeverityLevel;
        const severityB = (b.severity?.toLowerCase() ||
          "medium") as SeverityLevel;
        return SEVERITY_WEIGHTS[severityB] - SEVERITY_WEIGHTS[severityA];
      });

      // Adjust the impact of security issues to be less severe
      issues.forEach((issue, index) => {
        const severity = (issue.severity?.toLowerCase() ||
          "medium") as SeverityLevel;
        const baseImpact = SEVERITY_WEIGHTS[severity];

        // Reduce the impact of security issues by 40%
        const categoryFactor =
          issue.category?.toLowerCase() === "security" ? 0.6 : 1.0;

        // Diminishing factor - impact reduces with each subsequent issue
        // Make this less aggressive to avoid extremely low scores
        const diminishingFactor = Math.max(0.6, 1 - index * 0.08);

        // Calculate point reduction for this issue
        const pointReduction = baseImpact * diminishingFactor * categoryFactor;

        // Apply the reduction
        score = Math.max(20, score - pointReduction); // Set minimum score to 20 instead of 0
      });

      return Math.round(score);
    };

    // Calculate scores for each category
    const securityScore = calculateCategoryScore(categorizedIssues.security);
    const performanceScore = calculateCategoryScore(
      categorizedIssues.performance
    );
    const efficiencyScore = calculateCategoryScore(
      categorizedIssues.efficiency
    );

    // Calculate weighted overall score
    const overallScore = Math.round(
      (securityScore * (CATEGORY_WEIGHTS.security || 1) +
        performanceScore * (CATEGORY_WEIGHTS.performance || 1) +
        efficiencyScore * (CATEGORY_WEIGHTS.efficiency || 1)) /
        ((CATEGORY_WEIGHTS.security || 1) +
          (CATEGORY_WEIGHTS.performance || 1) +
          (CATEGORY_WEIGHTS.efficiency || 1))
    );

    const overallColors = getScoreColor(overallScore);
    const securityColors = getScoreColor(securityScore);
    const performanceColors = getScoreColor(performanceScore);
    const efficiencyColors = getScoreColor(efficiencyScore);

    return {
      mainMetric: {
        name: "Overall Score",
        value: overallScore,
        color: overallColors.main,
        gradient: overallColors.gradient,
      },
      metrics: [
        {
          name: "Security",
          value: securityScore,
          color: securityColors.main,
          gradient: securityColors.gradient,
        },
        {
          name: "Performance",
          value: performanceScore,
          color: performanceColors.main,
          gradient: performanceColors.gradient,
        },
        {
          name: "Efficiency",
          value: efficiencyScore,
          color: efficiencyColors.main,
          gradient: efficiencyColors.gradient,
        },
      ],
    };
  };

  const { mainMetric, metrics } = calculateMetrics();

  // Call onScoreUpdate when mainMetric.value changes
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(mainMetric.value);
    }
  }, [mainMetric.value, onScoreUpdate]);

  // If loading, show a loading state instead of the graphs
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto bg-[#1A1817] dark:bg-[#1A1817] bg-white/90 rounded-xl p-8 flex justify-center items-center min-h-[300px] border border-gray-200 dark:border-transparent">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800 dark:border-white mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Analyzing repository...
          </p>
        </div>
      </div>
    );
  }

  // Generate description based on overall score
  const getDescription = () => {
    if (mainMetric.value >= 80) {
      return "Your repository has a good overall score and is ready for deployment with minor improvements.";
    } else if (mainMetric.value >= 50) {
      return "Your repository has a moderate score. Address the identified issues before deployment for better performance and security.";
    } else {
      return "Your repository needs significant improvements before deployment. Focus on addressing the critical issues identified in the analysis.";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Main metric with description - First block */}
      <div
        className={`rounded-xl p-8 shadow-lg border transition-colors duration-300 ${
          mainMetric.value === 100
            ? "bg-green-900/10 border-green-900/20"
            : theme === "dark"
            ? "bg-[#1A1817] border-transparent"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col items-center">
            <CircleGraph
              metric={mainMetric}
              size="large"
              shouldAnimate={changedIssueId !== null}
            />
            <div
              className="mt-2 text-xl font-semibold"
              style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
            >
              Overall Score
            </div>
          </div>

          <div className="md:w-2/3 md:pt-8">
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: theme === "dark" ? "#ffffff" : "#111827" }}
            >
              {mainMetric.value >= 80
                ? "Great Overall"
                : mainMetric.value >= 50
                ? "Needs Improvement"
                : "Critical Issues Found"}
            </h3>
            <p
              className="text-lg leading-relaxed"
              style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
            >
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Smaller metrics row - Second block */}
      <div
        className={`rounded-xl p-8 shadow-lg border transition-colors duration-300 ${
          metrics.every((metric) => metric.value === 100)
            ? "bg-green-900/10 border-green-900/20"
            : theme === "dark"
            ? "bg-[#1A1817] border-transparent"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className="text-xl font-semibold mb-6 px-4"
          style={{ color: theme === "dark" ? "#ffffff" : "#111827" }}
        >
          Category Scores
        </h3>
        <div className="flex justify-center items-center gap-12 mx-auto">
          {metrics.map((metric, index) => (
            <div
              key={`${metric.name}-${index}`}
              className="flex flex-col items-center"
            >
              <CircleGraph
                metric={metric}
                shouldAnimate={
                  changedIssueId !== null &&
                  (changedIssueId.includes(metric.name.toUpperCase()) ||
                    metric.name.toUpperCase() === "OVERALL")
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
