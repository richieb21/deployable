"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create context with default values to avoid undefined errors
const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("theme") as Theme | null;

      if (storedTheme && (storedTheme === "dark" || storedTheme === "light")) {
        setTheme(storedTheme);
        if (storedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        // Default to dark theme if no preference is stored
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      }
    } catch (e) {
      // Handle case where localStorage is not available
      console.warn("Could not access localStorage", e);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    try {
      // Update localStorage
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      console.warn("Could not save theme preference", e);
    }

    // Update document class for Tailwind
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
