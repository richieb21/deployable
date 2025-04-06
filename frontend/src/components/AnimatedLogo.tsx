"use client";

import { useState } from "react";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export function AnimatedLogo({
  size = 200,
  className = "",
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={isHovered ? "animate-pupil" : ""}
      >
        <rect
          x="0"
          y="0"
          width="200"
          height="200"
          rx="30"
          ry="30"
          fill="black"
        />
        <circle cx="100" cy="100" r="60" fill="white" />
        <rect
          id="pupil"
          x="85"
          y="85"
          width="50"
          height="50"
          rx="10"
          ry="10"
          fill="black"
        />
      </svg>
    </div>
  );
}
