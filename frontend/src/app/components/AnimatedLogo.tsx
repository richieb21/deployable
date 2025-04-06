"use client";

import { useState, useEffect } from "react";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
  theme?: "dark" | "light";
}

export function AnimatedLogo({
  size = 200,
  className = "",
  theme = "dark",
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
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
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
          id="pupil"
          x="80"
          y="80"
          width="50"
          height="50"
          rx="10"
          ry="10"
          fill={theme === "dark" ? "white" : "black"}
          style={{ transform }}
        />
      </svg>
    </div>
  );
}
