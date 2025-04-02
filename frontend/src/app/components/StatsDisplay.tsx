"use client";

import { useEffect, useState, useRef } from "react";
import { AnalysisResponse } from "../types/api";

type StatMetric = {
  name: string;
  value: number;
  color: string;
  gradient?: string;
};

const CircleGraph = ({
  metric,
  size = "normal",
}: {
  metric: StatMetric;
  size?: "normal" | "large";
  shouldAnimate?: boolean;
}) => {
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
  }, [metric.value, mounted]);

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
            className="text-[#2A2A2A] dark:text-[#2A2A2A]"
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
          className={`${
            size === "large" ? "text-5xl" : "text-3xl"
          } font-bold text-white`}
        >
          {displayValue}
        </div>
      </div>
      {size !== "large" && (
        <div className="mt-2 text-base font-medium text-gray-400">
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
  // Calculate metrics regardless of loading state
  const calculateMetrics = () => {
    if (!analysisData || !analysisData.recommendations) {
      return {
        mainMetric: {
          name: "Overall Score",
          value: 89,
          color: "#86EFAC",
          gradient: "#4ADE80",
        },
        metrics: [
          {
            name: "Readability",
            value: 19,
            color: "#F87171",
            gradient: "#EF4444",
          },
          {
            name: "Security",
            value: 55,
            color: "#FCD34D",
            gradient: "#FBBF24",
          },
          {
            name: "Scalability",
            value: 100,
            color: "#86EFAC",
            gradient: "#4ADE80",
          },
          {
            name: "Performance",
            value: 100,
            color: "#86EFAC",
            gradient: "#4ADE80",
          },
          { name: "Cost", value: 55, color: "#FCD34D", gradient: "#FBBF24" },
        ],
      };
    }

    // Filter out completed issues
    const activeRecommendations = analysisData.recommendations.filter((rec) => {
      const issueId = `${rec.title}-${rec.file_path}`;
      return !completedIssues[issueId];
    });

    // Count recommendations by category (only counting active ones)
    const categories = activeRecommendations.reduce((acc, rec) => {
      const category = rec.category?.toLowerCase() || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate scores based on number of issues (fewer issues = higher score)
    const securityScore = Math.max(0, 100 - (categories.security || 0) * 10);
    const readabilityScore = Math.max(
      0,
      100 - (categories.readability || 0) * 10
    );
    const performanceScore = Math.max(
      0,
      100 - (categories.performance || 0) * 10
    );
    const scalabilityScore = Math.max(
      0,
      100 - (categories.scalability || 0) * 10
    );
    const costScore = Math.max(0, 100 - (categories.cost || 0) * 10);

    // Calculate overall score as average
    const overallScore = Math.round(
      (securityScore +
        readabilityScore +
        performanceScore +
        scalabilityScore +
        costScore) /
        5
    );

    const overallColors = getScoreColor(overallScore);
    const securityColors = getScoreColor(securityScore);
    const readabilityColors = getScoreColor(readabilityScore);
    const performanceColors = getScoreColor(performanceScore);
    const scalabilityColors = getScoreColor(scalabilityScore);
    const costColors = getScoreColor(costScore);

    return {
      mainMetric: {
        name: "Overall Score",
        value: overallScore,
        color: overallColors.main,
        gradient: overallColors.gradient,
      },
      metrics: [
        {
          name: "Readability",
          value: readabilityScore,
          color: readabilityColors.main,
          gradient: readabilityColors.gradient,
        },
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
          name: "Scalability",
          value: scalabilityScore,
          color: scalabilityColors.main,
          gradient: scalabilityColors.gradient,
        },
        {
          name: "Cost",
          value: costScore,
          color: costColors.main,
          gradient: costColors.gradient,
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
      <div className="max-w-5xl mx-auto bg-[#1A1817] rounded-xl p-8 flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400 text-lg">Analyzing repository...</p>
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
      <div className="bg-[#1A1817] rounded-xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col items-center">
            <CircleGraph
              metric={mainMetric}
              size="large"
              shouldAnimate={changedIssueId !== null}
            />
            <div className="mt-2 text-xl font-semibold text-gray-400">
              Overall Score
            </div>
          </div>

          <div className="md:w-2/3 md:pt-8">
            <h3 className="text-2xl font-bold mb-3 text-white">
              {mainMetric.value >= 80
                ? "Great Overall"
                : mainMetric.value >= 50
                ? "Needs Improvement"
                : "Critical Issues Found"}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Smaller metrics row - Second block */}
      <div className="bg-[#1A1817] rounded-xl p-8 shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-6 px-4">
          Category Scores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mx-auto">
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
