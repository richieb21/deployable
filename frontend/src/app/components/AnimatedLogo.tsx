"use client";

import { useState, useEffect } from "react";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
  theme?: "dark" | "light";
  loadingText?: string;
}

export function AnimatedLogo({
  size = 100,
  className = "",
  theme = "dark",
  loadingText = "Analyzing...",
}: AnimatedLogoProps) {
  const [transform, setTransform] = useState("translate(0, 0)");

  useEffect(() => {
    // Generate random values between -18 and 18 pixels
    const generateRandomValue = () => Math.floor(Math.random() * 32) - 16;

    const interval = setInterval(() => {
      const x = generateRandomValue();
      const y = generateRandomValue();
      setTransform(`translate(${x}px, ${y}px)`);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="animated-logo"
        >
          <rect
            x="0"
            y="0"
            width="200"
            height="200"
            rx="50"
            ry="50"
            fill={theme === "dark" ? "white" : "black"}
          />
          <circle
            cx="100"
            cy="100"
            r="60"
            fill={theme === "dark" ? "black" : "white"}
          />
          <rect
            className="pupil"
            x="80"
            y="80"
            width="40"
            height="40"
            rx="10"
            ry="10"
            fill={theme === "dark" ? "white" : "black"}
            style={{ transform }}
          />
        </svg>
      </div>
      {loadingText && (
        <p
          className={`mt-4 text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {loadingText}
        </p>
      )}
    </div>
  );
}
