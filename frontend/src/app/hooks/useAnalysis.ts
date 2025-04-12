"use client";

import { useState, useEffect } from "react";
import {
  AnalysisResponse,
  IdentifyKeyFilesResponse,
  KeyFiles,
} from "../types/api";

export function useAnalysis(repoUrl: string) {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [keyFiles, setKeyFiles] = useState<KeyFiles | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!repoUrl) return;

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
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refreshAnalysis, keyFiles };
}
