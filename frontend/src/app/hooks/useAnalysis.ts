"use client";

import { useState, useEffect } from "react";
import { AnalysisResponse } from "../types/api";

// Cache key prefix for storing analysis results
const CACHE_KEY_PREFIX = "deployable_analysis_";

export function useAnalysis(repoUrl: string) {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!repoUrl) return;

      // Create a cache key based on the repo URL
      const cacheKey = `${CACHE_KEY_PREFIX}${repoUrl}`;
      
      // Check if we have cached results
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setData(parsedData);
          setLoading(false);
          console.log("Using cached analysis results");
          return;
        } catch (err) {
          // If there's an error parsing the cached data, we'll fetch fresh data
          console.warn("Error parsing cached data:", err);
          localStorage.removeItem(cacheKey);
        }
      }

      setLoading(true);
      try {
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repo_url: repoUrl }),
        });

        if (!response.ok) {
          throw new Error(`Analysis request failed: ${response.status}`);
        }

        const result = await response.json();
        
        // Cache the results
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (err) {
          console.warn("Error caching analysis results:", err);
        }
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [repoUrl]);

  // Function to clear the cache and force a refresh
  const refreshAnalysis = async () => {
    // Clear the cache for this repo
    const cacheKey = `${CACHE_KEY_PREFIX}${repoUrl}`;
    localStorage.removeItem(cacheKey);
    
    setLoading(true);
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the new results
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (err) {
        console.warn("Error caching analysis results:", err);
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refreshAnalysis };
}
