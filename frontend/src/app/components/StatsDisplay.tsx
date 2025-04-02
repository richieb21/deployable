"use client";

import { useEffect, useState } from "react";
import { AnalysisResponse } from "../types/api";

type StatMetric = {
  name: string;
  value: number;
  color: string;
};

const CircleGraph = ({
  metric,
  size = "normal",
}: {
  metric: StatMetric;
  size?: "normal" | "large";
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate the circumference of the circle
  const radius = size === "large" ? 70 : 45;
  const circumference = 2 * Math.PI * radius;

  // Calculate the dash offset based on the value (0-100)
  const dashOffset = circumference - (metric.value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${
          size === "large" ? "w-56 h-56" : "w-36 h-36"
        } flex items-center justify-center`}
      >
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

        {/* Foreground circle */}
        <svg className="w-full h-full -rotate-90 absolute">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={metric.color}
            strokeWidth={size === "large" ? "14" : "10"}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Value text */}
        <div
          className={`${
            size === "large" ? "text-5xl" : "text-3xl"
          } font-bold text-white`}
        >
          {metric.value}
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
const getScoreColor = (score: number): string => {
  if (score >= 80) return "#86EFAC"; // Green for high scores
  if (score >= 50) return "#FCD34D"; // Yellow for medium scores
  return "#F87171"; // Red for low scores
};

// Update the component props to include loading state
export const StatsDisplay = ({
  analysisData,
  loading = false,
}: {
  analysisData?: AnalysisResponse | null;
  loading?: boolean;
}) => {
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

  // Calculate metrics based on recommendations if available
  const calculateMetrics = () => {
    if (!analysisData || !analysisData.recommendations) {
      return {
        mainMetric: {
          name: "Overall Score",
          value: 89,
          color: "#86EFAC",
        },
        metrics: [
          { name: "Readability", value: 19, color: "#F87171" },
          { name: "Security", value: 55, color: "#FCD34D" },
          { name: "Scalability", value: 100, color: "#86EFAC" },
          { name: "Performance", value: 100, color: "#86EFAC" },
          { name: "Cost", value: 55, color: "#FCD34D" },
        ],
      };
    }

    // Count recommendations by category
    const categories = analysisData.recommendations.reduce((acc, rec) => {
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

    return {
      mainMetric: {
        name: "Overall Score",
        value: overallScore,
        color: getScoreColor(overallScore),
      },
      metrics: [
        {
          name: "Readability",
          value: readabilityScore,
          color: getScoreColor(readabilityScore),
        },
        {
          name: "Security",
          value: securityScore,
          color: getScoreColor(securityScore),
        },
        {
          name: "Performance",
          value: performanceScore,
          color: getScoreColor(performanceScore),
        },
        {
          name: "Scalability",
          value: scalabilityScore,
          color: getScoreColor(scalabilityScore),
        },
        { name: "Cost", value: costScore, color: getScoreColor(costScore) },
      ],
    };
  };

  const { mainMetric, metrics } = calculateMetrics();

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
    <div className="max-w-5xl mx-auto bg-[#1A1817] rounded-xl p-8">
      {/* Main metric with description */}
      <div className="flex flex-col md:flex-row items-start justify-between mb-10 gap-8">
        <div className="flex flex-col items-center">
          <CircleGraph metric={mainMetric} size="large" />
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

      {/* Smaller metrics row - using grid for better spacing */}
      <div className="grid grid-cols-5 gap-0 mx-auto">
        {metrics.map((metric, index) => (
          <CircleGraph key={`${metric.name}-${index}`} metric={metric} />
        ))}
      </div>
    </div>
  );
};
