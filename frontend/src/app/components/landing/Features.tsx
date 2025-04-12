"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import { AnimatedNumber } from "@/app/components/ui/AnimatedNumber";

export const Features = () => {
  const [stats, setStats] = useState({
    repos: 0,
    files: 0,
    recommendations: 0,
  });
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get the WebSocket URL from environment variables
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/stats";

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
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
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event);
    };

    return () => {
      console.log("Closing WebSocket connection");
      ws.close();
    };
  }, [wsUrl]);

  // Effect for Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
        } else {
          videoRef.current?.pause();
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of the video is visible
      }
    );

    const currentVideoRef = videoRef.current;
    if (currentVideoRef) {
      observer.observe(currentVideoRef);
    }

    return () => {
      if (currentVideoRef) {
        observer.unobserve(currentVideoRef);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center bg-gradient-to-b from-transparent via-transparent to-transparent overflow-hidden">
      {/* Background Glows */}
      {theme === "dark" && (
        <>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-50 -z-10 animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/10 rounded-full filter blur-3xl opacity-40 -z-10 animate-pulse-slow animation-delay-2000" />
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-8">
                Ship with confidence,
                <br />
                <span
                  className={
                    theme === "dark" ? "text-green-500" : "text-orange-600"
                  }
                >
                  deploy without surprises
                </span>
              </h2>
            </div>

            {/* Live Stats */}
            <div className="space-y-4">
              <div className="text-sm font-medium flex items-center gap-2">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-900"
                  }
                >
                  Live Stats
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-green-500" : "bg-orange-500"} animate-pulse`}
                />
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      theme === "dark" ? "text-green-500" : "text-gray-900"
                    }`}
                  >
                    <AnimatedNumber value={stats.repos} />
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Repos
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      theme === "dark" ? "text-green-500" : "text-gray-900"
                    }`}
                  >
                    <AnimatedNumber value={stats.files} />
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Files
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      theme === "dark" ? "text-green-500" : "text-gray-900"
                    }`}
                  >
                    <AnimatedNumber value={stats.recommendations} />
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Recommendations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Demo Video */}
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-900/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-black/10">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls
              muted
              loop
              playsInline
              poster="/aws-video-poster.jpg"
            >
              <source
                src="https://yangstevenwebsite.s3.us-east-1.amazonaws.com/marketloo.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};
