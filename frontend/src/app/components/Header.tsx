"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";

export interface HeaderProps {
  variant?: "dark" | "light";
  onRefresh?: () => void;
}

export const Header = ({ variant = "dark", onRefresh }: HeaderProps) => {
  const pathname = usePathname();
  const isStatsPage = pathname === "/stats";
  const { theme } = useTheme();

  // Use the theme context to determine the actual variant
  const effectiveVariant =
    variant === "dark" || theme === "dark" ? "dark" : "light";

  return (
    <header
      className={`fixed top-0 left-0 right-0 backdrop-blur-md z-10 ${
        effectiveVariant === "dark" ? "bg-[#121212]/80" : "bg-[#f9fafb]/80"
      }`}
    >
      <div className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={
              effectiveVariant === "dark" ? "/logo_light.png" : "/logo_dark.png"
            }
            alt="deployable"
            width={32}
            height={32}
          />
          <span
            className={`text-lg font-semibold ${
              effectiveVariant === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            deployable
          </span>
        </Link>

        <nav className="flex gap-6 text-sm text-gray-400 items-center">
          {/* Show refresh button only on stats page */}
          {isStatsPage && onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Analysis
            </button>
          )}
          <a
            href="#"
            className={`hover:${
              effectiveVariant === "dark" ? "text-white" : "text-gray-900"
            } transition-colors`}
          >
            Documentation
          </a>
          <a
            href="#"
            className={`hover:${
              effectiveVariant === "dark" ? "text-white" : "text-gray-900"
            } transition-colors`}
          >
            GitHub
          </a>
          <a
            href="#"
            className={`hover:${
              effectiveVariant === "dark" ? "text-white" : "text-gray-900"
            } transition-colors`}
          >
            Contact
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};
