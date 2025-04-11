"use client";

import { Hero } from "./Hero";
import { Header } from "@/app/components/shared/Header";
import { Footer } from "@/app/components/shared/Footer";
import { Features } from "@/app/components/landing/Features";
import { useTheme } from "@/app/context/ThemeContext";

export const HomeContent = () => {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme === "dark" ? "#121212" : "#f9fafb",
        color: theme === "dark" ? "#f9fafb" : "#1f2937",
        backgroundImage:
          theme === "dark"
            ? "linear-gradient(to bottom, #121212, #1A1817, #121212)"
            : "linear-gradient(to bottom, #f9fafb, #ffffff, #f9fafb)",
      }}
    >
      <Header variant={theme === "dark" ? "dark" : "light"} />
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};
