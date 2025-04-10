"use client";

import { Hero } from "./Hero";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Features } from "./Features";
import { useTheme } from "../context/ThemeContext";

export const HomeContent = () => {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme === "dark" ? "#121212" : "#f9fafb",
        color: theme === "dark" ? "#f9fafb" : "#1f2937",
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
