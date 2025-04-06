"use client";

import { useState } from "react";
import { ImportantFiles } from "@/app/components/ImportantFiles";
import { FileTree } from "../../components/FileTree";
import { IdentifyKeyFilesResponse } from "@/app/types/api";

const sampleFiles = [
  "README.md",
  "backend/app/__init__.py",
  "backend/app/api/endpoints/analysis.py",
  "backend/app/api/endpoints/github.py",
  "backend/app/core/config.py",
  "backend/app/core/logging_config.py",
  "backend/app/main.py",
  "backend/app/mcp/.python-version",
  "backend/app/mcp/README.md",
  "backend/app/mcp/context/clients.txt",
  "backend/app/mcp/context/githubMCP.txt",
  "backend/app/mcp/context/plan.txt",
  "backend/app/mcp/context/writingMcpClients.txt",
  "backend/app/mcp/github_api_client.py",
  "backend/app/mcp/github_client.py",
  "backend/app/mcp/hello.py",
  "backend/app/mcp/pyproject.toml",
  "backend/app/models/schemas.py",
  "backend/app/services/deepseek_service.py",
  "backend/app/services/github.py",
  "backend/app/services/openai_service.py",
  "backend/requirements.txt",
  "frontend/README.md",
  "frontend/eslint.config.mjs",
  "frontend/next.config.ts",
  "frontend/postcss.config.mjs",
  "frontend/public/deployable.png",
  "frontend/public/file.svg",
  "frontend/public/globe.svg",
  "frontend/public/next.svg",
  "frontend/public/vercel.svg",
  "frontend/public/window.svg",
  "frontend/src/app/api/analysis/route.ts",
  "frontend/src/app/components/Features.tsx",
  "frontend/src/app/components/Footer.tsx",
  "frontend/src/app/components/Header.tsx",
  "frontend/src/app/components/Hero.tsx",
  "frontend/src/app/favicon.ico",
  "frontend/src/app/fonts.ts",
  "frontend/src/app/globals.css",
  "frontend/src/app/layout.tsx",
  "frontend/src/app/page.tsx",
  "frontend/src/app/types/api.ts",
  "frontend/tsconfig.json",
  "sample.json",
  "tailwind.config.js",
];

const key_files = {
  frontend: [
    "frontend/next.config.ts",
    "frontend/src/app/api/analysis/route.ts",
    "frontend/src/app/layout.tsx",
    "frontend/src/app/page.tsx",
  ],
  backend: [
    "backend/app/__init__.py",
    "backend/app/api/endpoints/analysis.py",
    "backend/app/api/endpoints/github.py",
    "backend/app/core/config.py",
    "backend/app/core/logging_config.py",
    "backend/app/main.py",
    "backend/app/models/schemas.py",
    "backend/app/services/LLM_service.py",
    "backend/app/services/github_service.py",
    "backend/requirements.txt",
  ],
  infra: [],
};

export default function FileTreeTestPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState(sampleFiles);
  const [keyFiles, setKeyFiles] = useState<{
    frontend: string[];
    backend: string[];
    infra: string[];
  }>(key_files);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/analysis/key-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repository files");
      }

      const data: IdentifyKeyFilesResponse = await response.json();
      setFiles(data.all_files);
      setKeyFiles(data.key_files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF5] dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            FileTree Component Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the FileTree component with sample repository data
          </p>
        </div>

        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-6 py-4 bg-white dark:bg-gray-900 border-2 border-black/10 dark:border-white/10 rounded-xl 
                           focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 
                           placeholder:text-gray-400 dark:placeholder:text-gray-600
                           text-black dark:text-white"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !url}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold 
                          hover:bg-gray-800 dark:hover:bg-gray-100 transition whitespace-nowrap
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Loading..." : "Analyze Repository"}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Repository Structure
            </h2>
            <FileTree files={files} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Important Files
            </h2>
            <ImportantFiles key_files={keyFiles} />
          </div>
        </div>
      </div>
    </div>
  );
}
