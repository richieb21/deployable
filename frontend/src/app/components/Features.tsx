"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export const Features = () => {
  const [stats, setStats] = useState({
    repos: 0,
    files: 0,
    recommendations: 0,
  });
  const [status, setStatus] = useState("connecting");
  const { theme } = useTheme();

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stats");

    ws.onopen = () => {
      setStatus("connected");
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received:", data);
        setStats(data);
      } catch (error) {
        console.error(
          "Error parsing WebSocket message:",
          error,
          "Raw data:",
          event.data
        );
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("error");
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event);
      setStatus("error");
    };

    return () => {
      console.log("Closing WebSocket connection");
      ws.close();
    };
  }, []);

  return (
    <div className="py-24 bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                Ship with confidence,
                <br />
                <span
                  className={
                    theme === "dark" ? "text-green-600" : "text-orange-600"
                  }
                >
                  deploy without surprises
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our AI-powered analysis helps you catch deployment issues before
                they catch you.
              </p>
            </div>

            {/* Live Stats */}
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {status === "connected"
                  ? "Live Stats"
                  : "Connecting to live stats..."}
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: theme === "dark" ? "#10B981" : "#ea580c" }}
                  >
                    {stats.repos}
                  </div>
                  <div className="text-sm text-gray-500">Repos Analyzed</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: theme === "dark" ? "#10B981" : "#ea580c" }}
                  >
                    {stats.files}
                  </div>
                  <div className="text-sm text-gray-500">Files Processed</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: theme === "dark" ? "#10B981" : "#ea580c" }}
                  >
                    {stats.recommendations}
                  </div>
                  <div className="text-sm text-gray-500">Recommendations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Demo Video */}
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Demo Video</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
