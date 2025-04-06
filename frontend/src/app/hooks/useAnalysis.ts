"use client";

import { useState, useEffect } from "react";
import {
  AnalysisResponse,
  IdentifyKeyFilesResponse,
  KeyFiles,
} from "../types/api";

// Cache key prefix for storing analysis results
const CACHE_KEY_PREFIX = "deployable_analysis_";

export function useAnalysis(repoUrl: string) {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [keyFiles, setKeyFiles] = useState<KeyFiles | null>(null);

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
        // First, fetch key files
        const keyFilesResponse = await fetch("/api/analysis/key-files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repo_url: repoUrl }),
        });

        if (!keyFilesResponse.ok) {
          throw new Error(
            `Key files request failed: ${keyFilesResponse.status}`
          );
        }

        const keyFilesResult: IdentifyKeyFilesResponse =
          await keyFilesResponse.json();
        setKeyFiles(keyFilesResult.key_files);

        // Then, use the key files in the analysis request
        const analysisResponse = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo_url: repoUrl,
            important_files: keyFilesResult.key_files,
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error(
            `Analysis request failed: ${analysisResponse.status}`
          );
        }

        const result = await analysisResponse.json();

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

    // Also clear created issues when refreshing
    localStorage.removeItem("createdIssues");

    setLoading(true);
    try {
      // First, fetch key files
      const keyFilesResponse = await fetch("/api/analysis/key-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!keyFilesResponse.ok) {
        throw new Error(`Key files request failed: ${keyFilesResponse.status}`);
      }

      const keyFilesResult: IdentifyKeyFilesResponse =
        await keyFilesResponse.json();
      setKeyFiles(keyFilesResult.key_files);

      // Then, use the key files in the analysis request
      const analysisResponse = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          important_files: keyFilesResult.key_files,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis request failed: ${analysisResponse.status}`);
      }

      const result = await analysisResponse.json();

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

  return { data, loading, error, refreshAnalysis, keyFiles };
}
