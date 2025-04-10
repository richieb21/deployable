"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

export interface HeaderProps {
  variant?: "dark" | "light";
  onRefresh?: () => void;
}

export const Header = ({ variant = "dark", onRefresh }: HeaderProps) => {
  const pathname = usePathname();
  const isStatsPage = pathname === "/stats";
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use the theme context to determine the actual variant
  const effectiveVariant =
    variant === "dark" || theme === "dark" ? "dark" : "light";

  // Define header styles based on page and theme
  const headerStyles = isStatsPage
    ? effectiveVariant === "dark"
      ? "bg-[#121212]/80 backdrop-blur-md"
      : "bg-[#f9fafb]/80 backdrop-blur-md"
    : ""; // No background, blur, or border on landing page

  return (
    <header className={`fixed top-0 left-0 right-0 z-10 ${headerStyles}`}>
      <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-sm items-center">
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
            className={`${
              effectiveVariant === "dark"
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-orange-600"
            } transition-colors`}
          >
            Documentation
          </a>
          <a
            href="#"
            className={`${
              effectiveVariant === "dark"
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-orange-600"
            } transition-colors`}
          >
            GitHub
          </a>
          <a
            href="#"
            className={`${
              effectiveVariant === "dark"
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-orange-600"
            } transition-colors`}
          >
            Contact
          </a>
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-md ${
              effectiveVariant === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden px-4 py-3 ${
            isStatsPage
              ? effectiveVariant === "dark"
                ? "bg-[#121212]/80 backdrop-blur-md"
                : "bg-[#f9fafb]/80 backdrop-blur-md"
              : effectiveVariant === "dark"
                ? "bg-[#121212]/50"
                : "bg-white/50"
          }`}
        >
          <nav className="flex flex-col gap-4 text-sm">
            {isStatsPage && onRefresh && (
              <button
                onClick={() => {
                  onRefresh();
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2 justify-center"
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
              className={`py-2 ${
                effectiveVariant === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-orange-600"
              } transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </a>
            <a
              href="#"
              className={`py-2 ${
                effectiveVariant === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-orange-600"
              } transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              GitHub
            </a>
            <a
              href="#"
              className={`py-2 ${
                effectiveVariant === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-orange-600"
              } transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};
